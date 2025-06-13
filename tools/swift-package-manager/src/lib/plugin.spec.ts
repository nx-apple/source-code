// Mock child_process
const mockExecSync = jest.fn();
jest.mock('child_process', () => ({
  execSync: mockExecSync
}));

// Mock fs
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  readFileSync: jest.fn()
}));

// Mock the parser
jest.mock('./parser', () => ({
  parseSwiftPackageManifest: jest.fn()
}));

// Mock the targets module
jest.mock('./targets', () => ({
  createSwiftTargets: jest.fn()
}));

// Mock the logger to prevent test output pollution
jest.mock('@nx/devkit', () => ({
  DependencyType: {
    static: 'static'
  },
  logger: {
    warn: jest.fn(),
    debug: jest.fn(),
  },
  createNodesFromFiles: jest.fn().mockImplementation(async (createNodeFn, configFiles, options, context) => {
    // Default implementation that actually calls the node creation function
    const results = [];
    for (const configFile of configFiles) {
      try {
        const result = await createNodeFn(configFile, options, context);
        results.push([configFile, result]);
      } catch {
        results.push([configFile, { projects: {} }]);
      }
    }
    return results;
  }),
  joinPathFragments: (...parts: string[]) => parts.join('/'),
}));

import { createNodesV2, createDependencies } from './plugin.js';
import { CreateNodesContext } from '@nx/devkit';
import { parseSwiftPackageManifest } from './parser';
import { createSwiftTargets } from './targets';
import type { SwiftPackageManifest, SwiftPackageManagerOptions } from './types';
import { existsSync } from 'fs';

const mockExistsSync = existsSync as jest.MockedFunction<typeof existsSync>;
const mockParseSwiftPackageManifest = parseSwiftPackageManifest as jest.MockedFunction<typeof parseSwiftPackageManifest>;
const mockCreateSwiftTargets = createSwiftTargets as jest.MockedFunction<typeof createSwiftTargets>;

describe('swift-package-manager plugin', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default mocks
    mockExistsSync.mockReturnValue(false);
    mockParseSwiftPackageManifest.mockReturnValue(null);
    mockCreateSwiftTargets.mockReturnValue({});
    mockExecSync.mockReset();
  });

  describe('exports', () => {
    it('should export createNodesV2', () => {
      expect(createNodesV2).toBeDefined();
      expect(Array.isArray(createNodesV2)).toBe(true);
      expect(createNodesV2[0]).toBe('**/Package.swift');
      expect(typeof createNodesV2[1]).toBe('function');
    });

    it('should export createDependencies', () => {
      expect(createDependencies).toBeDefined();
      expect(typeof createDependencies).toBe('function');
    });
  });

  describe('createNodesV2 node creation', () => {
    const mockContext: CreateNodesContext = {
      workspaceRoot: '/workspace',
      configFiles: [],
      nxJsonConfiguration: {},
    };

    const mockManifest: SwiftPackageManifest = {
      name: 'TestPackage',
      dependencies: [],
      targets: [
        { name: 'TestPackage', type: 'library', dependencies: [] },
        { name: 'TestPackageTests', type: 'test', dependencies: ['TestPackage'] }
      ],
      products: [
        { name: 'TestPackage', type: 'library', targets: ['TestPackage'] }
      ]
    };

    const mockTargets = {
      build: {
        command: 'swift build',
        options: { cwd: 'libs/test-package' },
        cache: true,
        inputs: ['{projectRoot}/Package.swift', '{projectRoot}/Sources/**/*'],
        outputs: ['{projectRoot}/.build']
      },
      test: {
        command: 'swift test',
        options: { cwd: 'libs/test-package' },
        cache: true,
        inputs: ['{projectRoot}/Package.swift', '{projectRoot}/Sources/**/*'],
        outputs: ['{projectRoot}/.build']
      }
    };

    beforeEach(() => {
      // Reset all mocks for createNodesV2 tests - these test the actual plugin behavior
      jest.clearAllMocks();
    });

    it('should create a new project when Package.swift exists and manifest is valid', async () => {
      mockParseSwiftPackageManifest.mockReturnValue(mockManifest);
      mockCreateSwiftTargets.mockReturnValue(mockTargets);
      mockExistsSync.mockReturnValue(false); // No existing project.json

      const createNodesFn = createNodesV2[1];
      const result = await createNodesFn(
        ['libs/test-package/Package.swift'],
        undefined,
        mockContext
      );

      expect(result).toHaveLength(1);
      expect(result[0][0]).toBe('libs/test-package/Package.swift');
      expect(result[0][1]).toEqual({
        projects: {
          'libs/test-package': {
            name: 'TestPackage', // Use manifest name
            root: 'libs/test-package',
            projectType: 'library',
            sourceRoot: 'libs/test-package/Sources',
            tags: ['lang:swift', 'type:library'],
            targets: mockTargets
          }
        }
      });
    });

    it('should only add targets to existing projects', async () => {
      mockParseSwiftPackageManifest.mockReturnValue(mockManifest);
      mockCreateSwiftTargets.mockReturnValue(mockTargets);
      mockExistsSync.mockImplementation((path: string) => {
        return path.includes('project.json'); // Simulate existing project.json
      });

      const createNodesFn = createNodesV2[1];
      const result = await createNodesFn(
        ['libs/test-package/Package.swift'],
        undefined,
        mockContext
      );

      expect(result).toHaveLength(1);
      expect(result[0][1]).toEqual({
        projects: {
          'libs/test-package': {
            targets: mockTargets
          }
        }
      });
    });

    it('should return empty projects when manifest parsing fails', async () => {
      mockParseSwiftPackageManifest.mockReturnValue(null);

      const createNodesFn = createNodesV2[1];
      const result = await createNodesFn(
        ['libs/test-package/Package.swift'],
        undefined,
        mockContext
      );

      expect(result).toHaveLength(1);
      expect(result[0][1]).toEqual({});
    });

    it('should handle errors gracefully', async () => {
      mockParseSwiftPackageManifest.mockImplementation(() => {
        throw new Error('Parse error');
      });

      const createNodesFn = createNodesV2[1];
      const result = await createNodesFn(
        ['libs/test-package/Package.swift'],
        undefined,
        mockContext
      );

      expect(result).toHaveLength(1);
      expect(result[0][1]).toEqual({});
    });

    it('should detect executable project type', async () => {
      const executableManifest: SwiftPackageManifest = {
        ...mockManifest,
        targets: [
          { name: 'TestApp', type: 'executable', dependencies: [] }
        ]
      };

      mockParseSwiftPackageManifest.mockReturnValue(executableManifest);
      mockCreateSwiftTargets.mockReturnValue(mockTargets);
      mockExistsSync.mockReturnValue(false);

      const createNodesFn = createNodesV2[1];
      const result = await createNodesFn(
        ['apps/test-app/Package.swift'],
        undefined,
        mockContext
      );

      expect(result[0][1].projects['apps/test-app'].projectType).toBe('application');
      expect(result[0][1].projects['apps/test-app'].tags).toContain('type:application');
    });

    it('should use directory name as fallback when manifest has no name', async () => {
      const manifestWithoutName: SwiftPackageManifest = {
        ...mockManifest,
        name: undefined
      };

      mockParseSwiftPackageManifest.mockReturnValue(manifestWithoutName);
      mockCreateSwiftTargets.mockReturnValue(mockTargets);
      mockExistsSync.mockReturnValue(false);

      const createNodesFn = createNodesV2[1];
      const result = await createNodesFn(
        ['libs/my-swift-lib/Package.swift'],
        undefined,
        mockContext
      );

      expect(result[0][1].projects['libs/my-swift-lib'].name).toBe('my-swift-lib');
    });

    it('should pass options to createSwiftTargets', async () => {
      const options: SwiftPackageManagerOptions = {
        buildCommand: 'custom-build',
        testCommand: 'custom-test'
      };

      mockParseSwiftPackageManifest.mockReturnValue(mockManifest);
      mockCreateSwiftTargets.mockReturnValue(mockTargets);
      mockExistsSync.mockReturnValue(false);

      const createNodesFn = createNodesV2[1];
      await createNodesFn(
        ['libs/test-package/Package.swift'],
        options,
        mockContext
      );

      expect(mockCreateSwiftTargets).toHaveBeenCalledWith(
        'libs/test-package',
        mockManifest,
        expect.objectContaining({
          buildCommand: 'custom-build',
          testCommand: 'custom-test',
          lintCommand: 'swiftlint', // default
          includeTestTargets: true, // default
          includeLintTargets: true, // default
        }),
        mockContext.workspaceRoot
      );
    });
  });

  describe('createDependencies', () => {
    const mockContext = {
      projects: {
        'apps/app': {
          name: 'app',
          root: 'apps/app'
        },
        'libs/utils': {
          name: 'utils',
          root: 'libs/utils'
        },
        'libs/core': {
          name: 'core',
          root: 'libs/core'
        }
      },
      filesToProcess: {
        projectFiles: [
          { file: 'apps/app/Package.swift', hash: 'hash1' },
          { file: 'libs/utils/Package.swift', hash: 'hash2' },
          { file: 'libs/core/Package.swift', hash: 'hash3' }
        ],
        nonProjectFiles: [],
        projectFileMap: {
          'apps/app': [
            { file: 'apps/app/Package.swift', hash: 'hash1' }
          ],
          'libs/utils': [
            { file: 'libs/utils/Package.swift', hash: 'hash2' }
          ],
          'libs/core': [
            { file: 'libs/core/Package.swift', hash: 'hash3' }
          ]
        }
      },
      workspaceRoot: '/workspace',
      externalNodes: {},
      nxJsonConfiguration: {},
      fileMap: {
        projectFiles: [],
        nonProjectFiles: [],
        projectFileMap: {}
      }
    };

    it('should return empty dependencies when no Package.swift files exist', () => {
      mockExistsSync.mockReturnValue(false);

      const dependencies = createDependencies(undefined, mockContext);

      expect(dependencies).toEqual([]);
    });

    it('should detect file system dependencies via Swift CLI', () => {
      // Import DependencyType for this test
      const { DependencyType } = require('@nx/devkit');
      
      // Mock existsSync to return true for package directories
      mockExistsSync.mockImplementation((path: string) => {
        const pathStr = path.toString();
        return pathStr.includes('/workspace/apps/app') || pathStr.includes('/workspace/libs/utils') || pathStr.includes('/workspace/libs/core');
      });

      mockExecSync.mockImplementation((command: string, options?: { cwd?: string }) => {
        if (command.includes('swift package dump-package')) {
          const cwd = options?.cwd || '';
          if (cwd.includes('apps/app')) {
            return JSON.stringify({
              name: 'app',
              dependencies: [
                {
                  fileSystem: [
                    { path: '../../libs/utils' }
                  ]
                }
              ],
              targets: []
            });
          }
        }
        return '';
      });

      const dependencies = createDependencies(undefined, mockContext);

      expect(dependencies).toHaveLength(1);
      expect(dependencies[0]).toEqual(
        expect.objectContaining({
          source: 'apps/app',
          target: 'libs/utils',
          type: DependencyType.static,
          sourceFile: 'apps/app/Package.swift'
        })
      );
    });

    it('should detect target dependencies via Swift CLI', () => {
      const { DependencyType } = require('@nx/devkit');
      
      mockExistsSync.mockImplementation((path: string) => {
        const pathStr = path.toString();
        return pathStr.includes('/workspace/apps/app') || pathStr.includes('/workspace/libs/utils') || pathStr.includes('/workspace/libs/core');
      });

      mockExecSync.mockImplementation((command: string, options?: { cwd?: string }) => {
        if (command.includes('swift package dump-package')) {
          const cwd = options?.cwd || '';
          if (cwd.includes('libs/utils')) {
            return JSON.stringify({
              name: 'utils',
              dependencies: [],
              targets: [
                {
                  name: 'Utils',
                  type: 'library',
                  dependencies: [
                    { byName: ['Core', null] }
                  ]
                }
              ]
            });
          }
        }
        return '';
      });

      const dependencies = createDependencies(undefined, mockContext);

      expect(dependencies).toHaveLength(1);
      expect(dependencies[0]).toEqual(
        expect.objectContaining({
          source: 'libs/utils',
          target: 'libs/core',
          type: DependencyType.static,
          sourceFile: 'libs/utils/Package.swift'
        })
      );
    });

    it('should fallback to parser when Swift CLI fails', () => {
      const { DependencyType } = require('@nx/devkit');
      
      mockExistsSync.mockImplementation((path: string) => {
        const pathStr = path.toString();
        return pathStr.includes('/workspace/apps/app') || pathStr.includes('/workspace/libs/utils') || pathStr.includes('/workspace/libs/core');
      });

      mockExecSync.mockImplementation(() => {
        throw new Error('Swift CLI failed');
      });

      mockParseSwiftPackageManifest.mockImplementation((filePath: string) => {
        if (filePath.includes('apps/app')) {
          return {
            name: 'app',
            dependencies: [
              { name: 'utils', path: '../../libs/utils' }
            ],
            targets: [],
            products: []
          };
        }
        return null;
      });

      const dependencies = createDependencies(undefined, mockContext);

      expect(dependencies).toHaveLength(1);
      expect(dependencies[0]).toEqual(
        expect.objectContaining({
          source: 'apps/app',
          target: 'libs/utils',
          type: DependencyType.static,
          sourceFile: 'apps/app/Package.swift'
        })
      );
    });

    it('should handle multiple dependencies from a single package', () => {
      const { DependencyType } = require('@nx/devkit');
      
      mockExistsSync.mockImplementation((path: string) => {
        const pathStr = path.toString();
        return pathStr.includes('/workspace/apps/app') || pathStr.includes('/workspace/libs/utils') || pathStr.includes('/workspace/libs/core');
      });

      mockExecSync.mockImplementation((command: string, options?: { cwd?: string }) => {
        if (command.includes('swift package dump-package')) {
          const cwd = options?.cwd || '';
          if (cwd.includes('apps/app')) {
            return JSON.stringify({
              name: 'app',
              dependencies: [
                {
                  fileSystem: [
                    { path: '../../libs/utils' },
                    { path: '../../libs/core' }
                  ]
                }
              ],
              targets: [
                {
                  name: 'App',
                  type: 'executable',
                  dependencies: [
                    { byName: ['Utils', null] },
                    { byName: ['Core', null] }
                  ]
                }
              ]
            });
          }
        }
        return '';
      });

      const dependencies = createDependencies(undefined, mockContext);

      // Should find both file system dependencies and target dependencies
      expect(dependencies).toHaveLength(4);
      
      // Check file system dependencies
      expect(dependencies).toContainEqual(
        expect.objectContaining({
          source: 'apps/app',
          target: 'libs/utils',
          type: DependencyType.static,
          sourceFile: 'apps/app/Package.swift'
        })
      );
      expect(dependencies).toContainEqual(
        expect.objectContaining({
          source: 'apps/app',
          target: 'libs/core',
          type: DependencyType.static,
          sourceFile: 'apps/app/Package.swift'
        })
      );
      
      // Check target dependencies
      expect(dependencies).toContainEqual(
        expect.objectContaining({
          source: 'apps/app',
          target: 'libs/utils',
          type: DependencyType.static,
          sourceFile: 'apps/app/Package.swift'
        })
      );
      expect(dependencies).toContainEqual(
        expect.objectContaining({
          source: 'apps/app',
          target: 'libs/core',
          type: DependencyType.static,
          sourceFile: 'apps/app/Package.swift'
        })
      );
    });

    it('should ignore external dependencies', () => {
      mockExistsSync.mockImplementation((path: string) => {
        const pathStr = path.toString();
        return pathStr.includes('/workspace/apps/app');
      });

      mockExecSync.mockImplementation((command: string, options?: { cwd?: string }) => {
        if (command.includes('swift package dump-package')) {
          const cwd = options?.cwd || '';
          if (cwd.includes('apps/app')) {
            return JSON.stringify({
              name: 'app',
              dependencies: [
                {
                  scm: {
                    location: 'https://github.com/apple/swift-nio.git',
                    requirement: { range: [{ lowerBound: '2.0.0', upperBound: '3.0.0' }] }
                  }
                }
              ],
              targets: [
                {
                  name: 'App',
                  type: 'executable',
                  dependencies: [
                    { byName: ['NIO', null] }, // External dependency
                    { byName: ['SomeUnknownPackage', null] } // Unknown dependency
                  ]
                }
              ]
            });
          }
        }
        return '';
      });

      const dependencies = createDependencies(undefined, mockContext);

      // Should ignore external dependencies and unknown packages
      expect(dependencies).toHaveLength(0);
    });

    it('should handle absolute paths in file system dependencies', () => {
      const { DependencyType } = require('@nx/devkit');
      
      mockExistsSync.mockImplementation((path: string) => {
        const pathStr = path.toString();
        return pathStr.includes('/workspace/apps/app') || pathStr.includes('/workspace/libs/utils');
      });

      mockExecSync.mockImplementation((command: string, options?: { cwd?: string }) => {
        if (command.includes('swift package dump-package')) {
          const cwd = options?.cwd || '';
          if (cwd.includes('apps/app')) {
            return JSON.stringify({
              name: 'app',
              dependencies: [
                {
                  fileSystem: [
                    { path: '/workspace/libs/utils' } // Absolute path
                  ]
                }
              ],
              targets: []
            });
          }
        }
        return '';
      });

      const dependencies = createDependencies(undefined, mockContext);

      expect(dependencies).toHaveLength(1);
      expect(dependencies[0]).toEqual(
        expect.objectContaining({
          source: 'apps/app',
          target: 'libs/utils',
          type: DependencyType.static,
          sourceFile: 'apps/app/Package.swift'
        })
      );
    });

    it('should handle mixed Swift CLI success and failure scenarios', () => {
      const { DependencyType } = require('@nx/devkit');
      
      mockExistsSync.mockImplementation((path: string) => {
        const pathStr = path.toString();
        return pathStr.includes('/workspace/apps/app') || pathStr.includes('/workspace/libs/utils') || pathStr.includes('/workspace/libs/core');
      });

      let callCount = 0;
      mockExecSync.mockImplementation((command: string, options?: { cwd?: string }) => {
        callCount++;
        if (command.includes('swift package dump-package')) {
          const cwd = options?.cwd || '';
          if (cwd.includes('apps/app')) {
            // First call succeeds
            return JSON.stringify({
              name: 'app',
              dependencies: [
                {
                  fileSystem: [
                    { path: '../../libs/utils' }
                  ]
                }
              ],
              targets: []
            });
          } else if (cwd.includes('libs/utils') && callCount === 2) {
            // Second call fails, should trigger parser fallback
            throw new Error('Swift CLI failed for utils');
          }
        }
        return '';
      });

      mockParseSwiftPackageManifest.mockImplementation((filePath: string) => {
        if (filePath.includes('libs/utils')) {
          return {
            name: 'utils',
            dependencies: [
              { name: 'core', path: '../core' }
            ],
            targets: [],
            products: []
          };
        }
        return null;
      });

      const dependencies = createDependencies(undefined, mockContext);

      expect(dependencies).toHaveLength(2);
      
      // Should have dependency from app to utils (via Swift CLI)
      expect(dependencies).toContainEqual(
        expect.objectContaining({
          source: 'apps/app',
          target: 'libs/utils',
          type: DependencyType.static,
          sourceFile: 'apps/app/Package.swift'
        })
      );
      
      // Should have dependency from utils to core (via parser fallback)
      expect(dependencies).toContainEqual(
        expect.objectContaining({
          source: 'libs/utils',
          target: 'libs/core',
          type: DependencyType.static,
          sourceFile: 'libs/utils/Package.swift'
        })
      );
    });

    it('should not create dependencies to the same project', () => {
      mockExistsSync.mockImplementation((path: string) => {
        const pathStr = path.toString();
        return pathStr.includes('/workspace/apps/app');
      });

      mockExecSync.mockImplementation((command: string, options?: { cwd?: string }) => {
        if (command.includes('swift package dump-package')) {
          const cwd = options?.cwd || '';
          if (cwd.includes('apps/app')) {
            return JSON.stringify({
              name: 'app',
              targets: [
                {
                  name: 'App',
                  type: 'executable',
                  dependencies: [
                    { byName: ['App', null] }, // Self-reference
                    { byName: ['app', null] }, // Self-reference with different case
                  ]
                }
              ]
            });
          }
        }
        return '';
      });

      const dependencies = createDependencies(undefined, mockContext);

      // Should not create self-dependencies
      expect(dependencies).toHaveLength(0);
    });

    it('should handle empty target dependencies array', () => {
      mockExistsSync.mockImplementation((path: string) => {
        const pathStr = path.toString();
        return pathStr.includes('/workspace/apps/app');
      });

      mockExecSync.mockImplementation((command: string, options?: { cwd?: string }) => {
        if (command.includes('swift package dump-package')) {
          const cwd = options?.cwd || '';
          if (cwd.includes('apps/app')) {
            return JSON.stringify({
              name: 'app',
              dependencies: [],
              targets: [
                {
                  name: 'App',
                  type: 'executable',
                  dependencies: [] // Empty dependencies array
                }
              ]
            });
          }
        }
        return '';
      });

      const dependencies = createDependencies(undefined, mockContext);
      expect(dependencies).toHaveLength(0);
    });

    it('should handle target with no dependencies property', () => {
      mockExistsSync.mockImplementation((path: string) => {
        const pathStr = path.toString();
        return pathStr.includes('/workspace/apps/app');
      });

      mockExecSync.mockImplementation((command: string, options?: { cwd?: string }) => {
        if (command.includes('swift package dump-package')) {
          const cwd = options?.cwd || '';
          if (cwd.includes('apps/app')) {
            return JSON.stringify({
              name: 'app',
              dependencies: [],
              targets: [
                {
                  name: 'App',
                  type: 'executable'
                  // No dependencies property
                }
              ]
            });
          }
        }
        return '';
      });

      const dependencies = createDependencies(undefined, mockContext);
      expect(dependencies).toHaveLength(0);
    });

    it('should handle invalid target dependency format', () => {
      mockExistsSync.mockImplementation((path: string) => {
        const pathStr = path.toString();
        return pathStr.includes('/workspace/apps/app');
      });

      mockExecSync.mockImplementation((command: string, options?: { cwd?: string }) => {
        if (command.includes('swift package dump-package')) {
          const cwd = options?.cwd || '';
          if (cwd.includes('apps/app')) {
            return JSON.stringify({
              name: 'app',
              dependencies: [],
              targets: [
                {
                  name: 'App',
                  type: 'executable',
                  dependencies: [
                    { byName: [] }, // Empty byName array
                    { byName: [null] }, // Null in byName array
                    { target: ['SomeTarget'] }, // Wrong property name
                    { product: ['SomeProduct'] }, // Different dependency type
                    {} // Empty dependency object
                  ]
                }
              ]
            });
          }
        }
        return '';
      });

      const dependencies = createDependencies(undefined, mockContext);
      expect(dependencies).toHaveLength(0);
    });

    it('should handle parser returning null manifest', () => {
      mockExistsSync.mockImplementation((path: string) => {
        const pathStr = path.toString();
        return pathStr.includes('/workspace/apps/app');
      });

      mockExecSync.mockImplementation(() => {
        throw new Error('Swift CLI failed');
      });

      mockParseSwiftPackageManifest.mockReturnValue(null);

      const dependencies = createDependencies(undefined, mockContext);
      expect(dependencies).toHaveLength(0);
    });

    it('should handle parser throwing an error', () => {
      mockExistsSync.mockImplementation((path: string) => {
        const pathStr = path.toString();
        return pathStr.includes('/workspace/apps/app');
      });

      mockExecSync.mockImplementation(() => {
        throw new Error('Swift CLI failed');
      });

      mockParseSwiftPackageManifest.mockImplementation(() => {
        throw new Error('Parser failed');
      });

      const dependencies = createDependencies(undefined, mockContext);
      expect(dependencies).toHaveLength(0);
    });
  });
});
