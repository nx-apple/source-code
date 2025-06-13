# Nx Apple Development Toolkit

<div align="center">

[![Nx](https://img.shields.io/badge/Built%20with-Nx-blue?style=flat-square&logo=nx)](https://nx.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-ready-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org)
[![Swift](https://img.shields.io/badge/Swift-compatible-orange?style=flat-square&logo=swift)](https://swift.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=flat-square)](https://opensource.org/licenses/MIT)

**Professional-grade Nx plugins for Apple ecosystem development**

[Documentation](./tools/swift-package-manager/README.md) • [Getting Started](#getting-started) • [Contributing](#contributing)

</div>

## Overview

The **Nx Apple Development Toolkit** is a comprehensive collection of Nx plugins designed to streamline iOS, macOS, watchOS, and tvOS development within Nx monorepos. This toolkit empowers Apple developers to leverage Nx's powerful build system, dependency management, and workspace organization capabilities while maintaining native Swift development workflows.

### Why Nx for Apple Development?

- **Unified Toolchain**: Manage Swift packages, iOS apps, and shared libraries in a single workspace
- **Intelligent Caching**: Nx's computational caching dramatically reduces build times
- **Dependency Management**: Automatic detection and management of cross-project dependencies
- **Developer Experience**: Consistent tooling across platforms with integrated VS Code support
- **Scalability**: Proven architecture for large-scale development teams and complex projects

## Architecture

This monorepo contains several specialized Nx plugins:

### 🧩 @nx-apple/swift-package-manager

The flagship plugin providing comprehensive Swift Package Manager integration:

- **Automatic Project Detection**: Seamlessly discovers Swift packages in your workspace
- **Target Generation**: Automatically creates build, test, and lint targets
- **Dependency Management**: Smart local and remote dependency resolution
- **Code Generation**: Scaffolds new Swift packages with best practices
- **Cross-Platform Support**: Full support for macOS, iOS, watchOS, and tvOS

**Key Features:**
- Zero-configuration setup for existing Swift packages
- Intelligent target inference with customizable commands
- Local workspace dependency graph integration
- Professional project scaffolding with modern Swift standards

[📖 **Complete Documentation**](./tools/swift-package-manager/README.md)

## Getting Started

### Prerequisites

- **Node.js** 18.x or later
- **npm** 8.x or later  
- **Swift** 5.9 or later
- **Xcode** (for iOS/macOS development)

### Installation

1. **Clone the workspace:**
```bash
git clone <repository-url>
cd nx-apple-toolkit
```

2. **Install dependencies:**
```bash
npm install
```

3. **Verify setup:**
```bash
npx nx graph
```

### Quick Start: Adding Swift Package Manager Plugin

1. **Install the plugin:**
```bash
npm install --save-dev @nx-apple/swift-package-manager
```

2. **Configure in your workspace:**
```json
// nx.json
{
  "plugins": [
    {
      "plugin": "@nx-apple/swift-package-manager",
      "options": {
        "buildCommand": "swift build",
        "testCommand": "swift test",
        "lintCommand": "swiftlint"
      }
    }
  ]
}
```

3. **Generate your first Swift package:**
```bash
npx nx generate @nx-apple/swift-package-manager:swift-package MyLibrary
```

4. **Build and test:**
```bash
npx nx build MyLibrary
npx nx test MyLibrary
```

## Development Workflow

### Building Plugins

Build all plugins in the workspace:
```bash
npx nx run-many -t build
```

Build a specific plugin:
```bash
npx nx build swift-package-manager
```

### Testing

Run comprehensive test suites:
```bash
npx nx run-many -t test
```

Test with coverage reporting:
```bash
npx nx test swift-package-manager --coverage
```

### Linting and Code Quality

Maintain code quality across the workspace:
```bash
npx nx run-many -t lint
npx nx format:check
```

### Local Development and Testing

Test plugin changes locally before publishing:

1. **Build the plugin:**
```bash
npx nx build swift-package-manager
```

2. **Link locally:**
```bash
cd tools/swift-package-manager
npm link
```

3. **Test in a sample project:**
```bash
cd /path/to/test-project
npm link @nx-apple/swift-package-manager
```

### Publishing

When ready to release:

1. **Version and publish:**
```bash
npx nx release
```

2. **Dry run to preview changes:**
```bash
npx nx release --dry-run
```

## Project Structure

```
nx-apple-toolkit/
├── tools/                          # Nx plugin implementations
│   └── swift-package-manager/       # Swift Package Manager plugin
│       ├── src/
│       │   ├── executors/           # Task executors
│       │   ├── generators/          # Code generators
│       │   └── lib/                 # Core utilities
│       ├── README.md                # Plugin documentation
│       └── package.json             # Plugin configuration
├── packages/                        # Future: Additional packages
├── docs/                           # Comprehensive documentation
├── nx.json                         # Nx workspace configuration
├── package.json                    # Workspace dependencies
└── README.md                       # This file
```

## Advanced Features

### Workspace Integration

The plugins integrate seamlessly with Nx's advanced features:

- **Project Graph**: Visualize dependencies between Swift packages
- **Affected Commands**: Build only what changed
- **Distributed Task Execution**: Scale builds across multiple machines
- **CI/CD Integration**: Optimized for modern CI providers

### VS Code Integration

Enhanced developer experience with:
- **Nx Console**: Visual interface for running tasks and generators
- **Swift Language Support**: Full Swift IntelliSense and debugging
- **Integrated Terminal**: Run Nx commands directly in VS Code
- **Workspace Management**: Navigate large codebases efficiently

## Best Practices

### Workspace Organization

```
apps/
├── ios-app/                 # iOS application
├── macos-app/              # macOS application
└── shared-cli/             # Command-line tools

libs/
├── core/                   # Core business logic
├── ui-components/          # Reusable UI components
├── networking/             # Network layer
└── utilities/              # Shared utilities
```

### Dependency Management

- Use **local dependencies** for packages within the workspace
- Leverage **semantic versioning** for external dependencies
- Maintain **dependency graphs** for clear project relationships
- Regular **dependency audits** for security and performance

### Testing Strategy

- **Unit tests** for individual components
- **Integration tests** for cross-package functionality  
- **E2E tests** for complete application flows
- **Performance tests** for critical paths

## Contributing

We welcome contributions from the community! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Setup

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and add tests
4. Ensure all tests pass: `npx nx run-many -t test`
5. Commit your changes: `git commit -m 'Add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Submit a pull request

### Code Standards

- **TypeScript**: Strict mode enabled with comprehensive type coverage
- **ESLint**: Enforced code style and best practices
- **Prettier**: Consistent code formatting
- **Jest**: Comprehensive test coverage (>90%)
- **Documentation**: TSDoc comments for all public APIs

## Community and Support

### Resources

- **Documentation**: Comprehensive guides and API references
- **Examples**: Real-world usage examples and templates
- **Blog Posts**: Technical deep-dives and best practices
- **Video Tutorials**: Step-by-step development guides

### Getting Help

- **GitHub Issues**: Bug reports and feature requests
- **Discussions**: Community Q&A and general discussion
- **Discord**: Real-time community support
- **Stack Overflow**: Tag questions with `nx-apple`

## Roadmap

### Upcoming Features

- **Xcode Project Integration**: Native Xcode project generation
- **CocoaPods Support**: Legacy dependency management
- **Carthage Integration**: Additional dependency manager support
- **SwiftUI Previews**: Integrated preview support
- **Performance Monitoring**: Build time optimization tools

### Long-term Vision

- **Complete Apple Ecosystem**: Support for all Apple platforms
- **Enterprise Features**: Advanced team collaboration tools
- **Cloud Integration**: Seamless CI/CD and deployment
- **Developer Tools**: Enhanced debugging and profiling

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Built with ❤️ by the Nx Apple Community**

[Website](https://nx.dev) • [Twitter](https://twitter.com/nxdevtools) • [Discord](https://go.nx.dev/community)

</div>
