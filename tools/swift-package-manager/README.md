# @nx-apple/swift-package-manager

An Nx plugin for managing Swift packages in an Nx workspace. This plugin provides automatic target inference for Swift packages and includes generators for creating new Swift packages.

## Features

- **Automatic Target Detection**: Automatically detects Swift packages and creates build, test, and lint targets
- **Dependency Management**: Resolves local Swift package dependencies for the Nx project graph
- **Swift Package Generator**: Create new Swift packages with proper structure and configuration
- **Cross-platform Support**: Works with macOS, iOS, and other Swift platforms

## Installation

```bash
npm install --save-dev @nx-apple/swift-package-manager
```

## Setup

Add the plugin to your `nx.json`:

```json
{
  "plugins": [
    {
      "plugin": "@nx-apple/swift-package-manager",
      "options": {
        "buildCommand": "swift build",
        "testCommand": "swift test", 
        "lintCommand": "swiftlint",
        "includeTestTargets": true,
        "includeLintTargets": true
      }
    }
  ]
}
```

## Plugin Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `buildCommand` | string | `"swift build"` | Command to build Swift packages |
| `testCommand` | string | `"swift test"` | Command to run tests |
| `lintCommand` | string | `"swiftlint"` | Command to lint Swift code |
| `includeTestTargets` | boolean | `true` | Whether to create test targets |
| `includeLintTargets` | boolean | `true` | Whether to create lint targets |

## Usage

### Automatic Target Inference

The plugin automatically detects `Package.swift` files in your workspace and creates the following targets:

- **build**: Builds the Swift package
- **test**: Runs the test suite (if test targets exist)
- **lint**: Lints the Swift code using SwiftLint
- **clean**: Cleans build artifacts

### Creating a New Swift Package

Use the generator to create a new Swift package:

```bash
nx g @nx-apple/swift-package-manager:swift-package my-package
```

#### Generator Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `name` | string | - | Name of the Swift package (required) |
| `directory` | string | - | Directory where the package should be created |
| `type` | `"library"` \| `"executable"` | `"library"` | Type of Swift package |
| `platforms` | string[] | `["macOS(.v13)", "iOS(.v16)"]` | Supported platforms |
| `dependencies` | string[] | `[]` | External dependencies |
| `tags` | string | - | Tags for the project (comma-separated) |

#### Examples

Create a library:
```bash
nx g @nx-apple/swift-package-manager:swift-package MyLibrary --type=library
```

Create an executable:
```bash
nx g @nx-apple/swift-package-manager:swift-package MyApp --type=executable --directory=apps
```

Create a package with specific platforms:
```bash
nx g @nx-apple/swift-package-manager:swift-package MyPackage --platforms="macOS(.v14),iOS(.v17),watchOS(.v10)"
```

### Running Targets

Once the plugin detects your Swift packages, you can run the generated targets:

```bash
# Build a Swift package
nx build my-package

# Run tests
nx test my-package

# Lint code (requires SwiftLint)
nx lint my-package

# Clean build artifacts
nx clean my-package
```

### Project Structure

The generator creates Swift packages with the following structure:

```
swift-packages/
├── my-package/
│   ├── Package.swift
│   ├── README.md
│   ├── .swiftlint.yml
│   ├── Sources/
│   │   └── MyPackage/
│   │       └── MyPackage.swift
│   └── Tests/
│       └── MyPackageTests/
│           └── MyPackageTests.swift
```

### Dependency Management

The plugin automatically detects dependencies between Swift packages in your workspace:

```swift
// Package.swift
let package = Package(
    name: "MyApp",
    dependencies: [
        .package(path: "../MyLibrary"), // Local dependency
        .package(url: "https://github.com/example/SomePackage", from: "1.0.0")
    ],
    targets: [
        .executableTarget(
            name: "MyApp",
            dependencies: ["MyLibrary"] // Dependency on local package
        )
    ]
)
```

## Requirements

- Swift 5.9 or later
- Xcode (for iOS/macOS development)
- SwiftLint (optional, for linting support)

## Development

### Building the Plugin

```bash
nx build swift-package-manager
```

### Testing

```bash
nx test swift-package-manager
```

### Linting

```bash
nx lint swift-package-manager
```

## Contributing

Contributions are welcome! Please read our contributing guidelines and submit pull requests to our repository.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
