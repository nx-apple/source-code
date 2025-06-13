import {
  extractNameFromUrl,
  dependencyExists,
  findDependency,
  isDependencyUsedInTargets,
  getTargetsUsingDependency,
  validateVersionConstraint,
  formatVersionConstraint,
  getRelativePath,
  parseDependencyString
} from './dependency-utils';
import { SwiftPackageManifest, SwiftPackageDependency } from './types';

describe('dependency-utils', () => {
  describe('extractNameFromUrl', () => {
    it('should extract name from GitHub URL', () => {
      expect(extractNameFromUrl('https://github.com/apple/swift-algorithms.git')).toBe('swift-algorithms');
      expect(extractNameFromUrl('https://github.com/apple/swift-algorithms')).toBe('swift-algorithms');
    });

    it('should handle different URL formats', () => {
      expect(extractNameFromUrl('git@github.com:apple/swift-algorithms.git')).toBe('swift-algorithms');
      expect(extractNameFromUrl('https://gitlab.com/user/my-package.git')).toBe('my-package');
    });

    it('should fallback to last path component', () => {
      expect(extractNameFromUrl('some/path/to/package')).toBe('package');
      expect(extractNameFromUrl('package')).toBe('package');
    });
  });

  describe('dependencyExists', () => {
    const manifest: SwiftPackageManifest = {
      name: 'TestPackage',
      dependencies: [
        { name: 'swift-algorithms', url: 'https://github.com/apple/swift-algorithms.git' },
        { name: 'LocalPackage', path: '../local-package' }
      ],
      targets: [],
      products: []
    };

    it('should detect existing URL dependency', () => {
      const dependency: SwiftPackageDependency = {
        name: 'swift-algorithms',
        url: 'https://github.com/apple/swift-algorithms.git'
      };
      expect(dependencyExists(manifest, dependency)).toBe(true);
    });

    it('should detect existing path dependency', () => {
      const dependency: SwiftPackageDependency = {
        name: 'LocalPackage',
        path: '../local-package'
      };
      expect(dependencyExists(manifest, dependency)).toBe(true);
    });

    it('should detect dependency by name only', () => {
      const dependency: SwiftPackageDependency = {
        name: 'swift-algorithms'
      };
      expect(dependencyExists(manifest, dependency)).toBe(true);
    });

    it('should return false for non-existing dependency', () => {
      const dependency: SwiftPackageDependency = {
        name: 'non-existing'
      };
      expect(dependencyExists(manifest, dependency)).toBe(false);
    });
  });

  describe('findDependency', () => {
    const manifest: SwiftPackageManifest = {
      name: 'TestPackage',
      dependencies: [
        { name: 'swift-algorithms', url: 'https://github.com/apple/swift-algorithms.git' },
        { name: 'LocalPackage', path: '../local-package' }
      ],
      targets: [],
      products: []
    };

    it('should find dependency by name', () => {
      const found = findDependency(manifest, 'swift-algorithms');
      expect(found).toEqual({
        name: 'swift-algorithms',
        url: 'https://github.com/apple/swift-algorithms.git'
      });
    });

    it('should find dependency by URL', () => {
      const found = findDependency(manifest, 'https://github.com/apple/swift-algorithms.git');
      expect(found).toEqual({
        name: 'swift-algorithms',
        url: 'https://github.com/apple/swift-algorithms.git'
      });
    });

    it('should find dependency by path', () => {
      const found = findDependency(manifest, '../local-package');
      expect(found).toEqual({
        name: 'LocalPackage',
        path: '../local-package'
      });
    });

    it('should return undefined for non-existing dependency', () => {
      const found = findDependency(manifest, 'non-existing');
      expect(found).toBeUndefined();
    });
  });

  describe('isDependencyUsedInTargets', () => {
    const manifest: SwiftPackageManifest = {
      name: 'TestPackage',
      dependencies: [],
      targets: [
        { name: 'Target1', type: 'library', dependencies: ['swift-algorithms', 'LocalPackage'] },
        { name: 'Target2', type: 'library', dependencies: ['LocalPackage'] },
        { name: 'Target3', type: 'test', dependencies: [] }
      ],
      products: []
    };

    it('should return true if dependency is used', () => {
      expect(isDependencyUsedInTargets(manifest, 'swift-algorithms')).toBe(true);
      expect(isDependencyUsedInTargets(manifest, 'LocalPackage')).toBe(true);
    });

    it('should return false if dependency is not used', () => {
      expect(isDependencyUsedInTargets(manifest, 'unused-dependency')).toBe(false);
    });
  });

  describe('getTargetsUsingDependency', () => {
    const manifest: SwiftPackageManifest = {
      name: 'TestPackage',
      dependencies: [],
      targets: [
        { name: 'Target1', type: 'library', dependencies: ['swift-algorithms', 'LocalPackage'] },
        { name: 'Target2', type: 'library', dependencies: ['LocalPackage'] },
        { name: 'Target3', type: 'test', dependencies: [] }
      ],
      products: []
    };

    it('should return targets using the dependency', () => {
      expect(getTargetsUsingDependency(manifest, 'swift-algorithms')).toEqual(['Target1']);
      expect(getTargetsUsingDependency(manifest, 'LocalPackage')).toEqual(['Target1', 'Target2']);
    });

    it('should return empty array for unused dependency', () => {
      expect(getTargetsUsingDependency(manifest, 'unused-dependency')).toEqual([]);
    });
  });

  describe('validateVersionConstraint', () => {
    it('should validate from: version', () => {
      expect(validateVersionConstraint('from: "1.0.0"')).toBe(true);
      expect(validateVersionConstraint('from: "1.0.0-beta.1"')).toBe(true);
    });

    it('should validate branch constraint', () => {
      expect(validateVersionConstraint('branch: "main"')).toBe(true);
      expect(validateVersionConstraint('branch: "develop"')).toBe(true);
    });

    it('should validate revision constraint', () => {
      expect(validateVersionConstraint('revision: "abc123"')).toBe(true);
    });

    it('should validate simple version', () => {
      expect(validateVersionConstraint('1.0.0')).toBe(true);
      expect(validateVersionConstraint('"1.0.0"')).toBe(true);
    });

    it('should validate range constraints', () => {
      expect(validateVersionConstraint('..<2.0.0')).toBe(true);
      expect(validateVersionConstraint('1.0.0..<2.0.0')).toBe(true);
    });

    it('should reject invalid formats', () => {
      expect(validateVersionConstraint('invalid')).toBe(false);
      expect(validateVersionConstraint('from: invalid')).toBe(false);
    });
  });

  describe('formatVersionConstraint', () => {
    it('should leave properly formatted constraints as-is', () => {
      expect(formatVersionConstraint('from: "1.0.0"')).toBe('from: "1.0.0"');
      expect(formatVersionConstraint('branch: "main"')).toBe('branch: "main"');
      expect(formatVersionConstraint('revision: "abc123"')).toBe('revision: "abc123"');
    });

    it('should format simple version numbers', () => {
      expect(formatVersionConstraint('1.0.0')).toBe('from: "1.0.0"');
      expect(formatVersionConstraint('1.0.0-beta.1')).toBe('from: "1.0.0-beta.1"');
    });

    it('should format quoted versions', () => {
      expect(formatVersionConstraint('"1.0.0"')).toBe('from: "1.0.0"');
    });
  });

  describe('getRelativePath', () => {
    it('should calculate relative path between directories', () => {
      expect(getRelativePath('packages/a', 'packages/b')).toBe('../b');
      expect(getRelativePath('packages/a/sub', 'packages/b')).toBe('../../b');
      expect(getRelativePath('packages/a', 'packages/a/sub')).toBe('sub');
    });

    it('should handle same directory', () => {
      expect(getRelativePath('packages/a', 'packages/a')).toBe('.');
    });

    it('should handle complex paths', () => {
      expect(getRelativePath('apps/mobile/ios', 'packages/shared/core')).toBe('../../../packages/shared/core');
    });
  });

  describe('parseDependencyString', () => {
    it('should parse URL dependency with version', () => {
      const result = parseDependencyString('.package(url: "https://github.com/apple/swift-algorithms.git", from: "1.0.0")');
      expect(result).toEqual({
        name: 'swift-algorithms',
        url: 'https://github.com/apple/swift-algorithms.git',
        version: '1.0.0'
      });
    });

    it('should parse URL dependency with branch', () => {
      const result = parseDependencyString('.package(url: "https://github.com/apple/swift-algorithms.git", branch: "main")');
      expect(result).toEqual({
        name: 'swift-algorithms',
        url: 'https://github.com/apple/swift-algorithms.git',
        branch: 'main'
      });
    });

    it('should parse URL dependency with revision', () => {
      const result = parseDependencyString('.package(url: "https://github.com/apple/swift-algorithms.git", revision: "abc123")');
      expect(result).toEqual({
        name: 'swift-algorithms',
        url: 'https://github.com/apple/swift-algorithms.git',
        commit: 'abc123'
      });
    });

    it('should parse path dependency', () => {
      const result = parseDependencyString('.package(path: "../local-package")');
      expect(result).toEqual({
        name: 'local-package',
        path: '../local-package'
      });
    });

    it('should return null for invalid dependency string', () => {
      const result = parseDependencyString('invalid dependency');
      expect(result).toBeNull();
    });
  });
});
