# Swift Package Dependency Management

The Swift Package Manager plugin for Nx provides generators to easily manage dependencies in your Swift packages.

## Adding Dependencies

Use the `add-dependency` generator to add dependencies to your Swift packages.

### Adding Remote Dependencies

Add a dependency from a Git repository (like GitHub):

```bash
nx generate @your-org/swift-package-manager:add-dependency --project=my-package --dependencyType=remote --url=https://github.com/apple/swift-algorithms.git --version="1.0.0"
```

#### Options for Remote Dependencies

- `--project`: The name of your Swift package project
- `--dependencyType`: Set to `remote`
- `--url`: Git URL of the dependency
- `--version`: (Optional) Version constraint. Can be:
  - Simple version: `"1.0.0"`
  - From constraint: `from: "1.0.0"`
  - Branch: `branch: "main"`
  - Revision: `revision: "abc123"`
- `--targets`: (Optional) Specific targets to add the dependency to
- `--productName`: (Optional) Specific product name to import

#### Examples

```bash
# Add with simple version
nx g @your-org/swift-package-manager:add-dependency --project=my-package --dependencyType=remote --url=https://github.com/apple/swift-algorithms.git --version="1.0.0"

# Add with branch
nx g @your-org/swift-package-manager:add-dependency --project=my-package --dependencyType=remote --url=https://github.com/apple/swift-nio.git --version='branch: "main"'

# Add to specific targets only
nx g @your-org/swift-package-manager:add-dependency --project=my-package --dependencyType=remote --url=https://github.com/apple/swift-algorithms.git --targets=MyTarget,AnotherTarget
```

### Adding Local Dependencies

Add a dependency on another Swift package in your Nx workspace:

```bash
nx generate @your-org/swift-package-manager:add-dependency --project=my-package --dependencyType=local --localProject=shared-package
```

#### Options for Local Dependencies

- `--project`: The name of your Swift package project
- `--dependencyType`: Set to `local`
- `--localProject`: The name of the local Nx project to depend on
- `--targets`: (Optional) Specific targets to add the dependency to
- `--productName`: (Optional) Specific product name to import

#### Examples

```bash
# Add local dependency
nx g @your-org/swift-package-manager:add-dependency --project=my-app --dependencyType=local --localProject=shared-utils

# Add to specific targets
nx g @your-org/swift-package-manager:add-dependency --project=my-app --dependencyType=local --localProject=shared-utils --targets=MyApp
```

## Removing Dependencies

Use the `remove-dependency` generator to remove dependencies from your Swift packages.

```bash
nx generate @your-org/swift-package-manager:remove-dependency --project=my-package --dependency=swift-algorithms
```

#### Options

- `--project`: The name of your Swift package project
- `--dependency`: Name or URL of the dependency to remove
- `--targets`: (Optional) Specific targets to remove the dependency from (if not specified, removes from all targets)
- `--removeFromPackage`: (Optional, default: true) Whether to remove the dependency from the package dependencies array

#### Examples

```bash
# Remove dependency completely
nx g @your-org/swift-package-manager:remove-dependency --project=my-package --dependency=swift-algorithms

# Remove by URL
nx g @your-org/swift-package-manager:remove-dependency --project=my-package --dependency=https://github.com/apple/swift-algorithms.git

# Remove from specific targets only (keep in package dependencies)
nx g @your-org/swift-package-manager:remove-dependency --project=my-package --dependency=swift-algorithms --targets=MyTarget --removeFromPackage=false

# Remove from specific targets and from package if not used elsewhere
nx g @your-org/swift-package-manager:remove-dependency --project=my-package --dependency=swift-algorithms --targets=MyTarget,AnotherTarget
```

## How It Works

### Package.swift Structure

The generators parse and modify your `Package.swift` file to:

1. **Add/Remove Package Dependencies**: Modify the `dependencies` array in the package declaration
2. **Add/Remove Target Dependencies**: Modify the `dependencies` array in individual target declarations

### Example Package.swift Before:

```swift
// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "MyPackage",
    platforms: [
        .macOS(.v10_15),
        .iOS(.v13)
    ],
    products: [
        .library(name: "MyPackage", targets: ["MyPackage"]),
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
```

### After Adding Remote and Local Dependencies:

```swift
// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "MyPackage",
    platforms: [
        .macOS(.v10_15),
        .iOS(.v13)
    ],
    products: [
        .library(name: "MyPackage", targets: ["MyPackage"]),
    ],
    dependencies: [
        .package(url: "https://github.com/apple/swift-algorithms.git", from: "1.0.0"),
        .package(path: "../shared-utils")
    ],
    targets: [
        .target(
            name: "MyPackage",
            dependencies: ["swift-algorithms", "shared-utils"]),
        .testTarget(
            name: "MyPackageTests",
            dependencies: ["MyPackage"]),
    ]
)
```

## Smart Dependency Management

The generators include smart features:

### Automatic Path Resolution
- Local dependencies automatically calculate relative paths between packages
- Supports complex workspace structures

### Target Management
- By default, adds dependencies to all applicable targets (non-test targets for libraries)
- Allows fine-grained control with `--targets` option
- When removing, can remove from specific targets or all targets

### Cleanup
- When removing a dependency, automatically removes it from package dependencies if it's no longer used by any target
- Can optionally keep in package dependencies with `--removeFromPackage=false`

### Validation
- Validates that projects exist before adding local dependencies
- Checks for existing Package.swift files
- Provides clear error messages for missing required options

## After Making Changes

After adding or removing dependencies, you should run Swift Package Manager's resolve command to update the resolved dependencies:

```bash
cd packages/my-package
swift package resolve
```

The generators will remind you to do this in their output messages.

## Integration with Nx

These generators work seamlessly with Nx's project graph and dependency tracking:

- Local dependencies create implicit dependencies between Nx projects
- The plugin automatically detects Swift package dependencies for the project graph
- Changes are reflected in `nx graph` visualization

## Troubleshooting

### Common Issues

1. **"Package.swift not found"**: Ensure your project has a `Package.swift` file in the project root
2. **"Project not found"**: Verify the project name exists in your workspace
3. **"URL is required"**: Remote dependencies must include a `--url` parameter
4. **"Local project name is required"**: Local dependencies must include a `--localProject` parameter

### Manual Verification

After running the generators, you can verify the changes by:

1. Checking the `Package.swift` file content
2. Running `swift package dump-package` to validate the manifest
3. Running `swift package resolve` to ensure dependencies can be resolved
4. Building your project with `swift build` or `nx build`
