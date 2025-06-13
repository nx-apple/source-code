# Contributing to Nx Apple Development Toolkit

Thank you for your interest in contributing to the Nx Apple Development Toolkit! This guide will help you get started with contributing to our collection of Nx plugins for Apple ecosystem development.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Making Contributions](#making-contributions)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Documentation](#documentation)
- [Community](#community)

## 📜 Code of Conduct

This project adheres to a [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to the project maintainers.

## 🚀 Getting Started

### Prerequisites

Before contributing, ensure you have:

- **Node.js** 18+ and **npm** 8+
- **Swift** 5.9 or later
- **Xcode** (for testing iOS/macOS functionality)
- **Git** with SSH keys configured
- Basic understanding of Nx concepts and Swift Package Manager

### Areas for Contribution

We welcome contributions in several areas:

- **🐛 Bug Fixes**: Fix issues reported in GitHub Issues
- **✨ New Features**: Implement new functionality for existing plugins
- **📚 Documentation**: Improve guides, API docs, and examples
- **🧪 Testing**: Add test coverage or improve existing tests
- **🎨 Developer Experience**: Enhance tooling and workflow
- **🔌 New Plugins**: Create plugins for other Apple development tools

## 🛠️ Development Setup

### 1. Fork and Clone

```bash
# Fork the repository on GitHub, then clone your fork
git clone git@github.com:YOUR_USERNAME/nx-apple-toolkit.git
cd nx-apple-toolkit

# Add upstream remote
git remote add upstream git@github.com:nx-apple/toolkit.git
```

### 2. Install Dependencies

```bash
# Install all workspace dependencies
npm install

# Verify setup
npx nx --version
swift --version
```

### 3. Build the Workspace

```bash
# Build all plugins
npx nx run-many -t build

# Verify build succeeded
npx nx build swift-package-manager
```

### 4. Run Tests

```bash
# Run all tests
npx nx run-many -t test

# Run tests for specific plugin
npx nx test swift-package-manager

# Run with coverage
npx nx test swift-package-manager --coverage
```

### 5. Set Up Local Testing

```bash
# Link plugin for local testing
cd tools/swift-package-manager
npm link

# Test in a separate project
cd /path/to/test-project
npm link @nx-apple/swift-package-manager
```

## 🤝 Making Contributions

### 1. Choose an Issue

- Browse [GitHub Issues](https://github.com/nx-apple/toolkit/issues)
- Look for issues labeled `good first issue` or `help wanted`
- Comment on the issue to indicate you're working on it
- For major features, discuss the approach in the issue first

### 2. Create a Branch

```bash
# Sync with upstream
git checkout main
git pull upstream main

# Create feature branch
git checkout -b feature/your-feature-name

# Or for bug fixes
git checkout -b fix/issue-number-description
```

### 3. Make Your Changes

#### For Bug Fixes:
1. Write a failing test that reproduces the bug
2. Fix the bug
3. Ensure the test passes
4. Update documentation if needed

#### For New Features:
1. Design the API and discuss with maintainers
2. Implement the feature with comprehensive tests
3. Update schemas and type definitions
4. Add documentation and examples
5. Update relevant README files

#### For Documentation:
1. Follow the established style and structure
2. Include practical examples
3. Ensure code examples are tested and work
4. Update table of contents if needed

### 4. Test Your Changes

```bash
# Run affected tests
npx nx affected:test

# Run affected builds
npx nx affected:build

# Lint your changes
npx nx affected:lint

# Format code
npx nx format:write
```

### 5. Manual Testing

Test your changes with real Swift projects:

```bash
# Create a test Swift package
mkdir test-project && cd test-project
npm init -y

# Install your local plugin
npm link @nx-apple/swift-package-manager

# Test the functionality
npx nx g @nx-apple/swift-package-manager:swift-package TestPackage
npx nx build TestPackage
```

## 📝 Pull Request Process

### 1. Pre-submission Checklist

- [ ] All tests pass (`npx nx affected:test`)
- [ ] Code is properly formatted (`npx nx format:check`)
- [ ] Linting passes (`npx nx affected:lint`)
- [ ] Documentation is updated
- [ ] Changelog entry added (if applicable)
- [ ] Manual testing completed

### 2. Submit Pull Request

```bash
# Push your branch
git push origin feature/your-feature-name

# Open pull request on GitHub
# Use the provided template and fill in all sections
```

### 3. Pull Request Template

When creating a PR, include:

```markdown
## Description
Brief description of changes and motivation.

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Code refactoring
- [ ] Performance improvement

## Testing
- [ ] Added new tests
- [ ] Updated existing tests
- [ ] Manual testing completed
- [ ] All tests pass

## Documentation
- [ ] Updated README
- [ ] Updated API documentation
- [ ] Added examples

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Breaking changes documented
- [ ] Backward compatibility maintained
```

### 4. Review Process

1. **Automated Checks**: CI will run tests and linting
2. **Maintainer Review**: Core team will review your changes
3. **Feedback**: Address any requested changes
4. **Approval**: Once approved, your PR will be merged

## 🎨 Coding Standards

### TypeScript Guidelines

```typescript
// Use explicit types for public APIs
export interface SwiftPackageOptions {
  name: string;
  type: 'library' | 'executable';
  platforms?: string[];
}

// Use descriptive function names
export function generateSwiftPackage(
  tree: Tree,
  options: SwiftPackageOptions
): void {
  // Implementation
}

// Document complex functions
/**
 * Parses a Swift Package.swift manifest file and extracts dependency information.
 * 
 * @param packagePath - Absolute path to the Package.swift file
 * @returns Parsed manifest object or null if parsing fails
 */
export function parseSwiftPackageManifest(
  packagePath: string
): SwiftPackageManifest | null {
  // Implementation
}
```

### Code Style

- **Naming**: Use `camelCase` for variables/functions, `PascalCase` for types
- **Imports**: Group and sort imports (Node built-ins, npm packages, local)
- **Error Handling**: Use explicit error handling with descriptive messages
- **Comments**: Use JSDoc for public APIs, inline comments for complex logic

### File Organization

```
src/
├── generators/
│   └── feature-name/
│       ├── generator.ts          # Main implementation
│       ├── generator.spec.ts     # Tests
│       ├── schema.json          # JSON schema
│       └── files/               # Template files
├── executors/
│   └── executor-name/
│       ├── executor.ts
│       ├── executor.spec.ts
│       └── schema.json
├── lib/
│   ├── feature.ts              # Shared utilities
│   └── feature.spec.ts         # Utility tests
└── index.ts                    # Main exports
```

## 🧪 Testing Guidelines

### Unit Tests

```typescript
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { Tree, readProjectConfiguration } from '@nx/devkit';
import swiftPackageGenerator from './generator';

describe('swift-package generator', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });

  it('should create a Swift package with correct structure', async () => {
    await swiftPackageGenerator(tree, {
      name: 'test-package',
      type: 'library'
    });

    expect(tree.exists('packages/test-package/Package.swift')).toBe(true);
    expect(tree.exists('packages/test-package/Sources/TestPackage/TestPackage.swift')).toBe(true);
  });

  it('should generate correct Package.swift content', async () => {
    await swiftPackageGenerator(tree, {
      name: 'test-package',
      type: 'library',
      platforms: ['iOS(.v15)', 'macOS(.v12)']
    });

    const packageSwift = tree.read('packages/test-package/Package.swift', 'utf-8');
    expect(packageSwift).toContain('name: "TestPackage"');
    expect(packageSwift).toContain('.iOS(.v15)');
    expect(packageSwift).toContain('.macOS(.v12)');
  });
});
```

### Integration Tests

Create integration tests for end-to-end scenarios:

```typescript
describe('swift-package integration', () => {
  it('should work with real Swift Package Manager', async () => {
    // Test with actual swift commands
    const result = await exec('swift package init --type library');
    expect(result.code).toBe(0);
  });
});
```

### Testing Best Practices

- **Isolation**: Each test should be independent
- **Descriptive Names**: Test names should clearly describe what's being tested
- **Edge Cases**: Test error conditions and edge cases
- **Mock External Dependencies**: Mock file system, network calls, etc.
- **Performance**: Consider test execution time for CI

## 📚 Documentation

### README Updates

When adding features, update relevant README files:

- Main repository README for new plugins
- Plugin-specific README for new features
- Update table of contents and examples

### API Documentation

Use JSDoc for all public APIs:

```typescript
/**
 * Generates a new Swift package in the workspace.
 * 
 * @param tree - Virtual file system tree
 * @param options - Generator options
 * @param options.name - Name of the Swift package
 * @param options.type - Type of package (library or executable)
 * @param options.platforms - Supported platforms
 * @returns Promise that resolves when generation is complete
 * 
 * @example
 * ```typescript
 * await swiftPackageGenerator(tree, {
 *   name: 'my-library',
 *   type: 'library',
 *   platforms: ['iOS(.v15)', 'macOS(.v12)']
 * });
 * ```
 */
export async function swiftPackageGenerator(
  tree: Tree,
  options: SwiftPackageGeneratorSchema
): Promise<void> {
  // Implementation
}
```

### Examples and Guides

- Provide working code examples
- Include command-line examples
- Show expected output and project structure
- Cover common use cases and advanced scenarios

## 🌟 Community

### Getting Help

- **GitHub Discussions**: For questions and general discussion
- **Discord**: Real-time community chat
- **Issues**: For bug reports and feature requests
- **Stack Overflow**: Tag questions with `nx-apple`

### Staying Updated

- **Watch** the repository for notifications
- Follow our **blog** for announcements
- Join our **newsletter** for updates
- Follow us on **Twitter** @nx-apple

### Recognition

Contributors are recognized in:

- **CONTRIBUTORS.md**: List of all contributors
- **Release Notes**: Major contributions highlighted
- **README**: Special thanks section
- **Community Highlights**: Blog posts and social media

## 🏆 Maintainer Guidelines

For core maintainers, additional guidelines:

### Code Review

- Provide constructive feedback
- Focus on code quality, performance, and maintainability
- Ensure backward compatibility
- Verify test coverage

### Release Process

1. **Version Bump**: Update version in package.json
2. **Changelog**: Update CHANGELOG.md with new features and fixes
3. **Documentation**: Ensure docs are up to date
4. **Testing**: Run comprehensive test suite
5. **Publishing**: Use `npx nx release` for consistent releases

### Issue Triage

- Label issues appropriately
- Respond to questions promptly
- Close resolved issues
- Prioritize critical bugs and security issues

---

Thank you for contributing to the Nx Apple Development Toolkit! Your contributions help make Swift development with Nx better for everyone. 🎉

<div align="center">

**Questions?** Reach out in [GitHub Discussions](https://github.com/nx-apple/toolkit/discussions) or [Discord](https://discord.gg/nx-apple)

</div>
