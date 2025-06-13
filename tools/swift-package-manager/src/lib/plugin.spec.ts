import { createNodesV2, createDependencies } from './plugin.js';
import { join } from 'path';
import { DependencyType } from '@nx/devkit';

jest.mock('child_process', () => ({
  execSync: jest.fn().mockImplementation((cmd, options) => {
    if (cmd === 'swift package dump-package') {
      return JSON.stringify({
        name: 'app',
        dependencies: [
          {
            fileSystem: [
              {
                identity: 'utils',
                path: join(options.cwd, '../../libs/utils'),
                productFilter: null,
                traits: [{ name: 'default' }]
              }
            ]
          }
        ],
        targets: [
          {
            name: 'App',
            type: 'executable',
            dependencies: [
              { byName: ['utils', null] }
            ]
          },
          {
            name: 'AppTests',
            type: 'test',
            dependencies: [
              { byName: ['App', null] }
            ]
          }
        ]
      });
    }
    throw new Error(`Command not mocked: ${cmd}`);
  })
}));

jest.mock('fs', () => ({
  existsSync: jest.fn().mockReturnValue(true)
}));

describe('swift-package-manager plugin', () => {
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

  describe('createDependencies', () => {
    it('should identify dependencies from swift package dump-package', () => {
      const mockContext = {
        workspaceRoot: '/workspaceRoot',
        projects: {
          'apps/app': { name: 'app', root: 'apps/app' },
          'libs/utils': { name: 'utils', root: 'libs/utils' }
        },
        filesToProcess: {
          projectFileMap: {
            'apps/app': [{ file: 'apps/app/Package.swift', hash: 'hash1' }]
          },
          nonProjectFiles: []
        },
        externalNodes: {},
        nxJsonConfiguration: {},
        fileMap: {
          nonProjectFiles: [],
          projectFileMap: {
            'apps/app': [{ file: 'apps/app/Package.swift', hash: 'hash1' }]
          }
        }
      };

      const dependencies = createDependencies(undefined, mockContext);
      
      expect(dependencies).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            source: 'apps/app',
            target: 'libs/utils',
            type: DependencyType.static,
            sourceFile: 'apps/app/Package.swift'
          })
        ])
      );
    });

    it('should handle errors gracefully', () => {
      // Mock console.warn to prevent test output pollution
      const originalWarn = console.warn;
      console.warn = jest.fn();
      
      const mockContextWithError = {
        workspaceRoot: '/workspaceRoot',
        projects: {},
        filesToProcess: {
          projectFileMap: {
            'invalid/project': [{ file: 'invalid/project/Package.swift', hash: 'hash2' }]
          },
          nonProjectFiles: []
        },
        externalNodes: {},
        nxJsonConfiguration: {},
        fileMap: {
          nonProjectFiles: [],
          projectFileMap: {
            'invalid/project': [{ file: 'invalid/project/Package.swift', hash: 'hash2' }]
          }
        }
      };

      // This should not throw
      const dependencies = createDependencies(undefined, mockContextWithError);
      
      expect(dependencies).toEqual([]);
      
      // Restore console.warn
      console.warn = originalWarn;
    });
  });
});
