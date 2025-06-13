import { Tree } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import removeDependencyGenerator from './generator';

describe('remove-dependency generator', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });

  it('should remove dependency from Package.swift', async () => {
    // Setup
    tree.write('packages/my-package/Package.swift', `// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "MyPackage",
    platforms: [
        .macOS(.v10_15),
        .iOS(.v13)
    ],
    products: [
        .library(
            name: "MyPackage",
            targets: ["MyPackage"]),
    ],
    dependencies: [
        .package(url: "https://github.com/apple/swift-algorithms.git", from: "1.0.0"),
        .package(path: "../shared-package")
    ],
    targets: [
        .target(
            name: "MyPackage",
            dependencies: ["swift-algorithms", "shared-package"]),
        .testTarget(
            name: "MyPackageTests",
            dependencies: ["MyPackage"]),
    ]
)
`);

    tree.write('packages/my-package/project.json', JSON.stringify({
      name: 'my-package',
      root: 'packages/my-package',
      sourceRoot: 'packages/my-package/Sources',
      projectType: 'library',
      targets: {}
    }));

    // Act
    await removeDependencyGenerator(tree, {
      project: 'my-package',
      dependency: 'swift-algorithms'
    });

    // Assert
    const packageSwift = tree.read('packages/my-package/Package.swift', 'utf-8');
    expect(packageSwift).not.toContain('swift-algorithms.git');
    expect(packageSwift).not.toContain('"swift-algorithms"');
    expect(packageSwift).toContain('shared-package'); // Other dependency should remain
  });

  it('should remove dependency by URL', async () => {
    // Setup
    tree.write('packages/my-package/Package.swift', `// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "MyPackage",
    dependencies: [
        .package(url: "https://github.com/apple/swift-algorithms.git", from: "1.0.0")
    ],
    targets: [
        .target(
            name: "MyPackage",
            dependencies: ["swift-algorithms"]),
    ]
)
`);

    tree.write('packages/my-package/project.json', JSON.stringify({
      name: 'my-package',
      root: 'packages/my-package',
      sourceRoot: 'packages/my-package/Sources',
      projectType: 'library',
      targets: {}
    }));

    // Act
    await removeDependencyGenerator(tree, {
      project: 'my-package',
      dependency: 'https://github.com/apple/swift-algorithms.git'
    });

    // Assert
    const packageSwift = tree.read('packages/my-package/Package.swift', 'utf-8');
    expect(packageSwift).not.toContain('swift-algorithms.git');
    expect(packageSwift).not.toContain('"swift-algorithms"');
  });

  it('should remove dependency from specific targets only', async () => {
    // Setup
    tree.write('packages/my-package/Package.swift', `// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "MyPackage",
    dependencies: [
        .package(url: "https://github.com/apple/swift-algorithms.git", from: "1.0.0")
    ],
    targets: [
        .target(
            name: "MyPackage",
            dependencies: ["swift-algorithms"]),
        .target(
            name: "AnotherTarget",
            dependencies: ["swift-algorithms"]),
        .testTarget(
            name: "MyPackageTests",
            dependencies: ["MyPackage"]),
    ]
)
`);

    tree.write('packages/my-package/project.json', JSON.stringify({
      name: 'my-package',
      root: 'packages/my-package',
      sourceRoot: 'packages/my-package/Sources',
      projectType: 'library',
      targets: {}
    }));

    // Act
    await removeDependencyGenerator(tree, {
      project: 'my-package',
      dependency: 'swift-algorithms',
      targets: ['MyPackage'],
      removeFromPackage: false
    });

    // Assert
    const packageSwift = tree.read('packages/my-package/Package.swift', 'utf-8');
    expect(packageSwift).toContain('swift-algorithms.git'); // Should still be in package dependencies
    expect(packageSwift).toContain('name: "AnotherTarget",\n            dependencies: ["swift-algorithms"]'); // Should still be in other target
    expect(packageSwift).toContain('name: "MyPackage",\n            dependencies: []'); // Should be removed from this target
  });

  it('should throw error if Package.swift not found', async () => {
    tree.write('packages/my-package/project.json', JSON.stringify({
      name: 'my-package',
      root: 'packages/my-package',
      sourceRoot: 'packages/my-package/Sources',
      projectType: 'library',
      targets: {}
    }));

    await expect(removeDependencyGenerator(tree, {
      project: 'my-package',
      dependency: 'some-dependency'
    })).rejects.toThrow('Package.swift not found');
  });
});
