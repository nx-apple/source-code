import { Tree } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import addDependencyGenerator from './generator';

describe('add-dependency generator', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });

  it('should add remote dependency to Package.swift', async () => {
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
    ],
    targets: [
        .target(
            name: "MyPackage",
            dependencies: []),
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
    await addDependencyGenerator(tree, {
      project: 'my-package',
      dependencyType: 'remote',
      url: 'https://github.com/apple/swift-algorithms.git',
      version: '1.0.0'
    });

    // Assert
    const packageSwift = tree.read('packages/my-package/Package.swift', 'utf-8');
    expect(packageSwift).toContain('.package(url: "https://github.com/apple/swift-algorithms.git", from: "1.0.0")');
    expect(packageSwift).toContain('"swift-algorithms"');
  });

  it('should add local dependency to Package.swift', async () => {
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
    ],
    targets: [
        .target(
            name: "MyPackage",
            dependencies: []),
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

    tree.write('packages/shared-package/project.json', JSON.stringify({
      name: 'shared-package',
      root: 'packages/shared-package',
      sourceRoot: 'packages/shared-package/Sources',
      projectType: 'library',
      targets: {}
    }));

    // Act
    await addDependencyGenerator(tree, {
      project: 'my-package',
      dependencyType: 'local',
      localProject: 'shared-package'
    });

    // Assert
    const packageSwift = tree.read('packages/my-package/Package.swift', 'utf-8');
    expect(packageSwift).toContain('.package(path: "../shared-package")');
    expect(packageSwift).toContain('"shared-package"');
  });

  it('should throw error if Package.swift not found', async () => {
    tree.write('packages/my-package/project.json', JSON.stringify({
      name: 'my-package',
      root: 'packages/my-package',
      sourceRoot: 'packages/my-package/Sources',
      projectType: 'library',
      targets: {}
    }));

    await expect(addDependencyGenerator(tree, {
      project: 'my-package',
      dependencyType: 'remote',
      url: 'https://github.com/apple/swift-algorithms.git'
    })).rejects.toThrow('Package.swift not found');
  });

  it('should throw error if URL is missing for remote dependency', async () => {
    tree.write('packages/my-package/Package.swift', '// content');
    tree.write('packages/my-package/project.json', JSON.stringify({
      name: 'my-package',
      root: 'packages/my-package',
      sourceRoot: 'packages/my-package/Sources',
      projectType: 'library',
      targets: {}
    }));

    await expect(addDependencyGenerator(tree, {
      project: 'my-package',
      dependencyType: 'remote'
    })).rejects.toThrow('URL is required for remote dependencies');
  });

  it('should throw error if local project is missing for local dependency', async () => {
    tree.write('packages/my-package/Package.swift', '// content');
    tree.write('packages/my-package/project.json', JSON.stringify({
      name: 'my-package',
      root: 'packages/my-package',
      sourceRoot: 'packages/my-package/Sources',
      projectType: 'library',
      targets: {}
    }));

    await expect(addDependencyGenerator(tree, {
      project: 'my-package',
      dependencyType: 'local'
    })).rejects.toThrow('Local project name is required for local dependencies');
  });
});
