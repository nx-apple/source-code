# @nx-apple/swift-package-manager

[![npm version](https://badge.fury.io/js/@nx-apple%2Fswift-package-manager.svg)](https://badge.fury.io/js/@nx-apple%2Fswift-package-manager)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![Nx](https://img.shields.io/badge/Built%20with-Nx-blue.svg)](https://nx.dev)

A professional-grade Nx plugin for seamless Swift Package Manager integration. This plugin brings first-class Swift development support to Nx workspaces, enabling teams to build, test, and manage Swift packages with the full power of Nx's build system.

## 🚀 Features

### Core Capabilities
- **🔍 Automatic Project Discovery**: Zero-configuration detection of Swift packages in your workspace
- **⚡ Intelligent Target Generation**: Automatically creates optimized build, test, and lint targets
- **📦 Dependency Management**: Smart resolution of local workspace and remote Git dependencies
- **🏗️ Code Generation**: Professional project scaffolding with modern Swift best practices
- **🔄 Workspace Integration**: Full integration with Nx's project graph and affected commands

### Advanced Features
- **🎯 Cross-Platform Support**: Native support for macOS, iOS, watchOS, and tvOS
- **📊 Performance Optimization**: Leverages Nx's computational caching for faster builds
- **🔗 Local Dependencies**: Automatic detection and management of inter-package dependencies
- **⚙️ Configurable Commands**: Customizable build, test, and lint commands per project
- **📈 CI/CD Ready**: Optimized for continuous integration workflows

## 📋 Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Generators](#generators)
- [Executors](#executors)
- [Dependency Management](#dependency-management)
- [Advanced Usage](#advanced-usage)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)
- [API Reference](#api-reference)

## 🛠️ Installation

### Prerequisites

- **Node.js** 18+ and **npm** 8+
- **Swift** 5.9 or later
- **Xcode** (for iOS/macOS development)
- **SwiftLint** (optional, for linting support)

### Install the Plugin

```bash
npm install --save-dev @nx-apple/swift-package-manager
```

### Register the Plugin

Add the plugin to your `nx.json` configuration:

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

## 🚀 Quick Start

### 1. Generate a New Swift Package

```bash
# Create a new library
npx nx g @nx-apple/swift-package-manager:swift-package MyLibrary

# Create an executable app
npx nx g @nx-apple/swift-package-manager:swift-package MyApp --type=executable --directory=apps

# Create with specific platforms
npx nx g @nx-apple/swift-package-manager:swift-package MyCrossplatform \
  --platforms="macOS(.v14),iOS(.v17),watchOS(.v10)"
```

### 2. Add Dependencies

```bash
# Add a remote dependency
npx nx g @nx-apple/swift-package-manager:add-dependency \
  --project=MyLibrary \
  --dependencyType=remote \
  --url=https://github.com/apple/swift-algorithms.git \
  --version="1.0.0"

# Add a local workspace dependency
npx nx g @nx-apple/swift-package-manager:add-dependency \
  --project=MyApp \
  --dependencyType=local \
  --localProject=MyLibrary
```

### 3. Build and Test

```bash
# Build your package
npx nx build MyLibrary

# Run tests
npx nx test MyLibrary

# Lint code (requires SwiftLint)
npx nx lint MyLibrary

# Clean build artifacts
npx nx clean MyLibrary
```

## ⚙️ Configuration

### Plugin Options

Configure the plugin behavior in your `nx.json`:

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
        "includeLintTargets": true,
        "buildOutputPath": ".build",
        "configurationOptions": {
          "release": "--configuration release",
          "debug": "--configuration debug"
        }
      }
    }
  ]
}
```

#### Configuration Reference

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `buildCommand` | `string` | `"swift build"` | Base command for building Swift packages |
| `testCommand` | `string` | `"swift test"` | Command for running tests |
| `lintCommand` | `string` | `"swiftlint"` | Command for linting Swift code |
| `includeTestTargets` | `boolean` | `true` | Generate test targets for packages with tests |
| `includeLintTargets` | `boolean` | `true` | Generate lint targets (requires SwiftLint) |
| `buildOutputPath` | `string` | `".build"` | Directory for build artifacts |
| `configurationOptions` | `object` | `{}` | Additional build configuration flags |

### Project-Level Configuration

Override plugin settings for specific projects in `project.json`:

```json
{
  "name": "my-package",
  "targets": {
    "build": {
      "executor": "@nx-apple/swift-package-manager:swift",
      "options": {
        "command": "build",
        "args": ["--configuration", "release", "--arch", "arm64"]
      }
    }
  }
}
```

## 🏗️ Generators

### Swift Package Generator

Creates new Swift packages with professional project structure.

```bash
npx nx g @nx-apple/swift-package-manager:swift-package <name> [options]
```

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `name` | `string` | - | Package name (required) |
| `directory` | `string` | - | Target directory for the package |
| `type` | `"library"` \| `"executable"` | `"library"` | Package type |
| `platforms` | `string[]` | `["macOS(.v13)", "iOS(.v16)"]` | Supported platforms |
| `dependencies` | `string[]` | `[]` | Initial external dependencies |
| `tags` | `string` | - | Project tags (comma-separated) |
| `skipFormat` | `boolean` | `false` | Skip formatting generated files |

#### Generated Project Structure

```
packages/my-library/
├── Package.swift                    # Swift package manifest
├── README.md                        # Project documentation
├── .swiftlint.yml                   # SwiftLint configuration
├── Sources/
│   └── MyLibrary/
│       └── MyLibrary.swift          # Main library file
├── Tests/
│   └── MyLibraryTests/
│       └── MyLibraryTests.swift     # Test suite
└── project.json                     # Nx project configuration
```

### Add Dependency Generator

Adds dependencies to existing Swift packages.

```bash
npx nx g @nx-apple/swift-package-manager:add-dependency [options]
```

#### Remote Dependencies

```bash
npx nx g @nx-apple/swift-package-manager:add-dependency \
  --project=MyPackage \
  --dependencyType=remote \
  --url=https://github.com/apple/swift-nio.git \
  --version="2.0.0"
```

#### Local Dependencies

```bash
npx nx g @nx-apple/swift-package-manager:add-dependency \
  --project=MyApp \
  --dependencyType=local \
  --localProject=SharedUtils
```

#### Options

| Option | Type | Description |
|--------|------|-------------|
| `project` | `string` | Target project name (required) |
| `dependencyType` | `"remote"` \| `"local"` | Dependency source type (required) |
| `url` | `string` | Git URL (required for remote) |
| `localProject` | `string` | Local project name (required for local) |
| `version` | `string` | Version constraint |
| `targets` | `string[]` | Specific targets to add dependency to |
| `productName` | `string` | Specific product name to import |

### Remove Dependency Generator

Removes dependencies from Swift packages.

```bash
npx nx g @nx-apple/swift-package-manager:remove-dependency \
  --project=MyPackage \
  --dependency=swift-algorithms
```

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `project` | `string` | - | Target project name (required) |
| `dependency` | `string` | - | Dependency name or URL (required) |
| `targets` | `string[]` | `[]` | Specific targets to remove from |
| `removeFromPackage` | `boolean` | `true` | Remove from package dependencies |

## ⚡ Executors

### Swift Executor

Executes Swift commands with enhanced Nx integration.

```json
{
  "targets": {
    "build": {
      "executor": "@nx-apple/swift-package-manager:swift",
      "options": {
        "command": "build",
        "args": ["--configuration", "release"]
      }
    }
  }
}
```

#### Options

| Option | Type | Description |
|--------|------|-------------|
| `command` | `string` | Swift command to execute |
| `args` | `string[]` | Additional command arguments |
| `cwd` | `string` | Working directory (defaults to project root) |

## 📦 Dependency Management

### Local Dependencies

The plugin automatically detects and manages dependencies between Swift packages in your workspace:

```swift
// Package.swift
let package = Package(
    name: "MyApp",
    dependencies: [
        .package(path: "../MyLibrary"),  // ← Automatically detected
        .package(path: "../SharedUtils") // ← Creates Nx dependency
    ],
    targets: [
        .executableTarget(
            name: "MyApp",
            dependencies: ["MyLibrary", "SharedUtils"]
        )
    ]
)
```

### Remote Dependencies

Support for various version specifications:

```swift
dependencies: [
    // Exact version
    .package(url: "https://github.com/apple/swift-nio.git", exact: "2.0.0"),
    
    // Version range
    .package(url: "https://github.com/apple/swift-algorithms.git", from: "1.0.0"),
    
    // Branch
    .package(url: "https://github.com/apple/swift-log.git", branch: "main"),
    
    // Revision
    .package(url: "https://github.com/vapor/vapor.git", revision: "abc123")
]
```

### Dependency Graph Integration

The plugin integrates with Nx's project graph:

```bash
# Visualize your dependency graph
npx nx graph

# Build only affected projects
npx nx affected:build

# Test affected projects
npx nx affected:test
```

## 🔧 Advanced Usage

### Custom Build Configurations

```json
{
  "targets": {
    "build-release": {
      "executor": "@nx-apple/swift-package-manager:swift",
      "options": {
        "command": "build",
        "args": ["--configuration", "release", "--arch", "arm64"]
      }
    },
    "build-debug": {
      "executor": "@nx-apple/swift-package-manager:swift",
      "options": {
        "command": "build",
        "args": ["--configuration", "debug"]
      }
    }
  }
}
```

### Platform-Specific Builds

```json
{
  "targets": {
    "build-ios": {
      "executor": "@nx-apple/swift-package-manager:swift",
      "options": {
        "command": "build",
        "args": [
          "--configuration", "release",
          "--destination", "generic/platform=iOS"
        ]
      }
    }
  }
}
```

### Integration with CI/CD

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]

jobs:
  build:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build affected projects
        run: npx nx affected:build
      
      - name: Test affected projects
        run: npx nx affected:test
      
      - name: Lint affected projects
        run: npx nx affected:lint
```

## 📚 Best Practices

### Project Organization

```
apps/
├── ios-app/                 # iOS application
├── macos-app/              # macOS application  
└── cli-tool/               # Command-line executable

libs/
├── core/                   # Core business logic
├── ui-kit/                 # Reusable UI components
├── networking/             # Network layer
├── storage/                # Data persistence
└── utilities/              # Shared utilities
```

### Naming Conventions

- **Projects**: `kebab-case` (e.g., `user-authentication`)
- **Swift packages**: `PascalCase` (e.g., `UserAuthentication`)
- **Tags**: Use consistent tagging strategy (`scope:shared`, `type:lib`, `platform:ios`)

### Dependency Strategy

1. **Local First**: Prefer local workspace dependencies over duplicated code
2. **Version Pinning**: Pin external dependencies to specific versions in production
3. **Regular Updates**: Schedule regular dependency updates and security audits
4. **Testing**: Maintain comprehensive tests for all dependencies

### Performance Optimization

- **Caching**: Leverage Nx's computation caching for faster builds
- **Incremental Builds**: Use `nx affected` commands in CI/CD
- **Parallel Execution**: Configure parallel task execution for large workspaces

## 🐛 Troubleshooting

### Common Issues

#### "Package.swift not found"
```bash
# Ensure Package.swift exists in project root
ls packages/my-project/Package.swift

# Regenerate project if needed
npx nx g @nx-apple/swift-package-manager:swift-package my-project --force
```

#### "Swift command not found"
```bash
# Verify Swift installation
swift --version

# Install Swift if needed (macOS)
xcode-select --install
```

#### "Local dependency not found"
```bash
# Verify project exists in workspace
npx nx show projects

# Check project.json configuration
cat packages/my-project/project.json
```

#### Build failures
```bash
# Clean build artifacts
npx nx clean my-project

# Reset Nx cache
npx nx reset

# Rebuild with verbose output
npx nx build my-project --verbose
```

### Debug Mode

Enable verbose logging for troubleshooting:

```bash
# Set debug environment variable
export NX_VERBOSE_LOGGING=true

# Run commands with verbose output
npx nx build my-project --verbose
```

### Getting Help

- **Documentation**: Check the [complete documentation](./DEPENDENCY_MANAGEMENT.md)
- **GitHub Issues**: [Report bugs and request features](https://github.com/nx-apple/toolkit/issues)
- **Community**: Join our [Discord server](https://discord.gg/nx-apple)
- **Stack Overflow**: Tag questions with `nx-apple`

## 📖 API Reference

### Plugin Configuration Schema

```typescript
interface SwiftPackageManagerPluginOptions {
  buildCommand?: string;
  testCommand?: string; 
  lintCommand?: string;
  includeTestTargets?: boolean;
  includeLintTargets?: boolean;
  buildOutputPath?: string;
  configurationOptions?: Record<string, string>;
}
```

### Generator Schemas

Detailed schemas are available in the plugin's `src/generators/*/schema.json` files.

### Executor Schemas

Executor options are documented in `src/executors/*/schema.json` files.

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](../../CONTRIBUTING.md) for details.

### Development Setup

```bash
# Clone the repository
git clone https://github.com/nx-apple/toolkit.git
cd toolkit

# Install dependencies
npm install

# Build the plugin
npx nx build swift-package-manager

# Run tests
npx nx test swift-package-manager

# Link for local development
cd tools/swift-package-manager
npm link
```

## 📄 License

MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Nx Team**: For building the amazing Nx platform
- **Swift Community**: For the robust Swift Package Manager
- **Contributors**: Everyone who helps make this plugin better

---

<div align="center">

**Made with ❤️ for the Swift and Nx communities**

[Documentation](./DEPENDENCY_MANAGEMENT.md) • [GitHub](https://github.com/nx-apple/toolkit) • [npm](https://www.npmjs.com/package/@nx-apple/swift-package-manager)

</div>
