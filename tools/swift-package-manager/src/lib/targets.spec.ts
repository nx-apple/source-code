import { createSwiftTargets } from './targets';
import { SwiftPackageManifest, SwiftPackageManagerOptions } from './types';

// Mock fs
jest.mock('fs', () => ({
  existsSync: jest.fn()
}));

import { existsSync } from 'fs';
const mockExistsSync = existsSync as jest.MockedFunction<typeof existsSync>;

describe('createSwiftTargets', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockExistsSync.mockReturnValue(false);
  });

  const defaultManifest: SwiftPackageManifest = {
    name: 'TestPackage',
    dependencies: [],
    targets: [
      { name: 'TestPackage', type: 'library', dependencies: [] }
    ],
    products: [
      { name: 'TestPackage', type: 'library', targets: ['TestPackage'] }
    ]
  };

  describe('build target', () => {
    it('should create a build target with default options', () => {
      const targets = createSwiftTargets('libs/test-package', defaultManifest);

      expect(targets.build).toEqual({
        command: 'swift build',
        options: {
          cwd: 'libs/test-package',
        },
        cache: true,
        inputs: [
          '{projectRoot}/Package.swift',
          '{projectRoot}/Sources/**/*',
          '{projectRoot}/Package.resolved',
        ],
        outputs: ['{projectRoot}/.build'],
      });
    });

    it('should use custom build command', () => {
      const options: SwiftPackageManagerOptions = {
        buildCommand: 'custom build command'
      };

      const targets = createSwiftTargets('libs/test-package', defaultManifest, options);

      expect(targets.build.command).toBe('custom build command');
    });
  });

  describe('test target', () => {
    it('should create test target when Tests directory exists', () => {
      mockExistsSync.mockImplementation((path: string) => {
        return path.includes('/Tests');
      });

      const targets = createSwiftTargets('libs/test-package', defaultManifest, {}, '/workspace');

      expect(targets.test).toEqual({
        command: 'swift test',
        options: {
          cwd: 'libs/test-package',
        },
        cache: true,
        inputs: [
          '{projectRoot}/Package.swift',
          '{projectRoot}/Sources/**/*',
          '{projectRoot}/Tests/**/*',
          '{projectRoot}/Package.resolved',
        ],
        outputs: ['{projectRoot}/.build'],
        dependsOn: ['^build'],
      });
    });

    it('should create test target when manifest has test targets', () => {
      mockExistsSync.mockReturnValue(false); // No Tests directory
      
      const manifestWithTestTarget: SwiftPackageManifest = {
        ...defaultManifest,
        targets: [
          { name: 'TestPackage', type: 'library', dependencies: [] },
          { name: 'TestPackageTests', type: 'test', dependencies: ['TestPackage'] }
        ]
      };

      const targets = createSwiftTargets('libs/test-package', manifestWithTestTarget);

      expect(targets.test).toBeDefined();
      expect(targets.test.command).toBe('swift test');
      expect(targets.test.dependsOn).toEqual(['^build']);
    });

    it('should not create test target when includeTestTargets is false', () => {
      mockExistsSync.mockImplementation((path: string) => {
        return path.includes('/Tests');
      });

      const options: SwiftPackageManagerOptions = {
        includeTestTargets: false
      };

      const targets = createSwiftTargets('libs/test-package', defaultManifest, options, '/workspace');

      expect(targets.test).toBeUndefined();
    });

    it('should not create test target when no Tests directory and no test targets in manifest', () => {
      mockExistsSync.mockReturnValue(false);

      const targets = createSwiftTargets('libs/test-package', defaultManifest);

      expect(targets.test).toBeUndefined();
    });

    it('should use custom test command', () => {
      mockExistsSync.mockImplementation((path: string) => {
        return path.includes('/Tests');
      });

      const options: SwiftPackageManagerOptions = {
        testCommand: 'custom test command'
      };

      const targets = createSwiftTargets('libs/test-package', defaultManifest, options, '/workspace');

      expect(targets.test?.command).toBe('custom test command');
    });
  });

  describe('lint target', () => {
    it('should create lint target by default', () => {
      const targets = createSwiftTargets('libs/test-package', defaultManifest);

      expect(targets.lint).toEqual({
        command: 'swiftlint',
        options: {
          cwd: 'libs/test-package',
        },
        cache: true,
        inputs: [
          '{projectRoot}/Sources/**/*.swift',
          '{projectRoot}/Tests/**/*.swift',
          '{projectRoot}/.swiftlint.yml',
        ],
      });
    });

    it('should not create lint target when includeLintTargets is false', () => {
      const options: SwiftPackageManagerOptions = {
        includeLintTargets: false
      };

      const targets = createSwiftTargets('libs/test-package', defaultManifest, options);

      expect(targets.lint).toBeUndefined();
    });

    it('should use custom lint command', () => {
      const options: SwiftPackageManagerOptions = {
        lintCommand: 'custom lint command'
      };

      const targets = createSwiftTargets('libs/test-package', defaultManifest, options);

      expect(targets.lint?.command).toBe('custom lint command');
    });
  });

  describe('clean target', () => {
    it('should always create clean target', () => {
      const targets = createSwiftTargets('libs/test-package', defaultManifest);

      expect(targets.clean).toEqual({
        command: 'swift package clean',
        options: {
          cwd: 'libs/test-package',
        },
      });
    });
  });

  describe('integration', () => {
    it('should create all targets with default options', () => {
      mockExistsSync.mockImplementation((path: string) => {
        return path.includes('/Tests');
      });

      const targets = createSwiftTargets('libs/test-package', defaultManifest, {}, '/workspace');

      expect(Object.keys(targets)).toEqual(['build', 'test', 'lint', 'clean']);
      expect(targets.build).toBeDefined();
      expect(targets.test).toBeDefined();
      expect(targets.lint).toBeDefined();
      expect(targets.clean).toBeDefined();
    });

    it('should create minimal targets when features are disabled', () => {
      const options: SwiftPackageManagerOptions = {
        includeTestTargets: false,
        includeLintTargets: false
      };

      const targets = createSwiftTargets('libs/test-package', defaultManifest, options);

      expect(Object.keys(targets)).toEqual(['build', 'clean']);
      expect(targets.build).toBeDefined();
      expect(targets.clean).toBeDefined();
      expect(targets.test).toBeUndefined();
      expect(targets.lint).toBeUndefined();
    });

    it('should handle complex manifest with multiple targets', () => {
      const complexManifest: SwiftPackageManifest = {
        name: 'ComplexPackage',
        dependencies: [
          { name: 'external-dep', url: 'https://github.com/external/dep.git' }
        ],
        targets: [
          { name: 'ComplexPackage', type: 'library', dependencies: ['external-dep'] },
          { name: 'ComplexPackageApp', type: 'executable', dependencies: ['ComplexPackage'] },
          { name: 'ComplexPackageTests', type: 'test', dependencies: ['ComplexPackage'] }
        ],
        products: [
          { name: 'ComplexPackage', type: 'library', targets: ['ComplexPackage'] },
          { name: 'ComplexPackageApp', type: 'executable', targets: ['ComplexPackageApp'] }
        ]
      };

      mockExistsSync.mockImplementation((path: string) => {
        return path.includes('/Tests');
      });

      const targets = createSwiftTargets('libs/complex-package', complexManifest, {}, '/workspace');

      expect(targets.build).toBeDefined();
      expect(targets.test).toBeDefined();
      expect(targets.lint).toBeDefined();
      expect(targets.clean).toBeDefined();
      
      // Test target should depend on build
      expect(targets.test.dependsOn).toEqual(['^build']);
    });
  });
});
