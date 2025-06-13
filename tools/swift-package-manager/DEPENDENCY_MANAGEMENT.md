# Swift Package Dependency Management

The **@nx-apple/swift-package-manager** plugin provides sophisticated dependency management capabilities for Swift packages within Nx workspaces. This guide covers all aspects of adding, removing, and managing dependencies with professional best practices.

## 📋 Table of Contents

- [Overview](#overview)
- [Adding Dependencies](#adding-dependencies)
- [Removing Dependencies](#removing-dependencies)
- [Dependency Types](#dependency-types)
- [Version Management](#version-management)
- [Workspace Integration](#workspace-integration)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)
- [Examples](#examples)

## 🎯 Overview

The dependency management system supports:

- **🔗 Local Dependencies**: Packages within your Nx workspace
- **🌐 Remote Dependencies**: Git repositories (GitHub, GitLab, etc.)
- **📦 Smart Resolution**: Automatic path calculation and validation
- **🎯 Target-Specific**: Fine-grained control over which targets use dependencies
- **🔄 Workspace Sync**: Integration with Nx's project graph and affected commands

## ➕ Adding Dependencies

### Command Syntax

```bash
npx nx generate @nx-apple/swift-package-manager:add-dependency [options]
```

### Remote Dependencies

Add dependencies from Git repositories with flexible version constraints.

#### Basic Remote Dependency

```bash
npx nx g @nx-apple/swift-package-manager:add-dependency \
  --project=MyPackage \
  --dependencyType=remote \
  --url=https://github.com/apple/swift-algorithms.git \
  --version="1.0.0"
```

#### Advanced Version Constraints

```bash
# From version (semantic versioning)
npx nx g @nx-apple/swift-package-manager:add-dependency \
  --project=MyPackage \
  --dependencyType=remote \
  --url=https://github.com/apple/swift-nio.git \
  --version='from: "2.0.0"'

# Specific branch
npx nx g @nx-apple/swift-package-manager:add-dependency \
  --project=MyPackage \
  --dependencyType=remote \
  --url=https://github.com/vapor/vapor.git \
  --version='branch: "main"'

# Exact revision
npx nx g @nx-apple/swift-package-manager:add-dependency \
  --project=MyPackage \
  --dependencyType=remote \
  --url=https://github.com/swift-server/swift-aws-lambda-runtime.git \
  --version='revision: "abc123def456"'

# Version range
npx nx g @nx-apple/swift-package-manager:add-dependency \
  --project=MyPackage \
  --dependencyType=remote \
  --url=https://github.com/apple/swift-collections.git \
  --version='"1.0.0"..<"2.0.0"'
```

#### Target-Specific Dependencies

```bash
# Add to specific targets only
npx nx g @nx-apple/swift-package-manager:add-dependency \
  --project=MyPackage \
  --dependencyType=remote \
  --url=https://github.com/apple/swift-log.git \
  --version="1.0.0" \
  --targets=MyLibrary,MyUtilities

# Specify product name (for packages with multiple products)
npx nx g @nx-apple/swift-package-manager:add-dependency \
  --project=MyPackage \
  --dependencyType=remote \
  --url=https://github.com/apple/swift-crypto.git \
  --version="2.0.0" \
  --productName=Crypto
```

### Local Dependencies

Add dependencies on other Swift packages within your Nx workspace.

#### Basic Local Dependency

```bash
npx nx g @nx-apple/swift-package-manager:add-dependency \
  --project=MyApp \
  --dependencyType=local \
  --localProject=SharedUtilities
```

#### Advanced Local Dependencies

```bash
# Add to specific targets
npx nx g @nx-apple/swift-package-manager:add-dependency \
  --project=MyApp \
  --dependencyType=local \
  --localProject=CoreLogic \
  --targets=MyAppTarget

# Specify product name for multi-product packages
npx nx g @nx-apple/swift-package-manager:add-dependency \
  --project=MyApp \
  --dependencyType=local \
  --localProject=UIComponents \
  --productName=CommonUI
```

### Generator Options Reference

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `project` | `string` | ✅ | Target project name |
| `dependencyType` | `"remote"` \| `"local"` | ✅ | Source type of dependency |
| `url` | `string` | ✅ (remote) | Git repository URL |
| `localProject` | `string` | ✅ (local) | Local project name in workspace |
| `version` | `string` | - | Version constraint (see [Version Management](#version-management)) |
| `targets` | `string[]` | - | Specific targets to add dependency to |
| `productName` | `string` | - | Specific product name to import |

## ➖ Removing Dependencies

### Command Syntax

```bash
npx nx generate @nx-apple/swift-package-manager:remove-dependency [options]
```

### Basic Removal

```bash
# Remove by dependency name
npx nx g @nx-apple/swift-package-manager:remove-dependency \
  --project=MyPackage \
  --dependency=swift-algorithms

# Remove by URL
npx nx g @nx-apple/swift-package-manager:remove-dependency \
  --project=MyPackage \
  --dependency=https://github.com/apple/swift-algorithms.git
```

### Advanced Removal Options

```bash
# Remove from specific targets only
npx nx g @nx-apple/swift-package-manager:remove-dependency \
  --project=MyPackage \
  --dependency=swift-algorithms \
  --targets=MyTarget,AnotherTarget

# Keep in package dependencies (don't remove from dependencies array)
npx nx g @nx-apple/swift-package-manager:remove-dependency \
  --project=MyPackage \
  --dependency=swift-algorithms \
  --targets=MyTarget \
  --removeFromPackage=false

# Remove completely (from all targets and package dependencies)
npx nx g @nx-apple/swift-package-manager:remove-dependency \
  --project=MyPackage \
  --dependency=swift-algorithms \
  --removeFromPackage=true
```

### Generator Options Reference

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `project` | `string` | - | Target project name (required) |
| `dependency` | `string` | - | Dependency name or URL (required) |
| `targets` | `string[]` | `[]` | Specific targets to remove from |
| `removeFromPackage` | `boolean` | `true` | Remove from package dependencies array |

## 🔄 Dependency Types

### Remote Dependencies

External packages hosted in Git repositories.

**Supported Platforms:**
- GitHub, GitLab, Bitbucket
- Self-hosted Git servers
- SSH and HTTPS URLs

**Example Package.swift Output:**
```swift
dependencies: [
    .package(url: "https://github.com/apple/swift-algorithms.git", from: "1.0.0"),
    .package(url: "https://github.com/vapor/vapor.git", branch: "main"),
    .package(url: "git@github.com:myorg/private-repo.git", exact: "2.1.0")
]
```

### Local Dependencies

Packages within the same Nx workspace.

**Benefits:**
- Automatic path resolution
- Nx project graph integration
- Affected command support
- Type-safe refactoring

**Example Package.swift Output:**
```swift
dependencies: [
    .package(path: "../CoreUtilities"),
    .package(path: "../NetworkLayer"),
    .package(path: "../../libs/SharedUI")
]
```

## 📦 Version Management

### Semantic Versioning

```bash
# Exact version
--version="1.2.3"

# From version (allows compatible updates)
--version='from: "1.2.0"'

# Up to next major version
--version='"1.2.0"..<"2.0.0"'

# Up to next minor version  
--version='"1.2.0"..<"1.3.0"'
```

### Branch and Revision Tracking

```bash
# Track a specific branch
--version='branch: "develop"'

# Use exact commit
--version='revision: "abc123def456789"'

# Use tag
--version='revision: "v2.1.0"'
```

### Version Strategy Recommendations

| Scenario | Strategy | Example |
|----------|----------|---------|
| **Production** | Exact versions | `"1.2.3"` |
| **Development** | From versions | `from: "1.2.0"` |
| **Beta Testing** | Branch tracking | `branch: "beta"` |
| **Hotfixes** | Revision pinning | `revision: "abc123"` |

## 🔗 Workspace Integration

### Nx Project Graph

Local dependencies automatically create edges in the Nx project graph:

```bash
# Visualize dependencies
npx nx graph

# Show dependencies for a specific project
npx nx show project MyApp --json | jq '.implicitDependencies'
```

### Affected Commands

The plugin integrates with Nx's affected commands:

```bash
# Build only affected projects
npx nx affected:build

# Test affected projects after changes
npx nx affected:test

# Check what would be affected
npx nx print-affected --target=build
```

### Dependency Analysis

```bash
# List all project dependencies
npx nx list

# Show detailed project information
npx nx show project MyPackage

# Analyze workspace structure
npx nx report
```

## 🏆 Best Practices

### Dependency Organization

**Project Structure Recommendations:**

```
workspace/
├── apps/
│   ├── ios-app/              # End-user applications
│   └── macos-app/
├── libs/
│   ├── core/                 # Core business logic (no external deps)
│   ├── shared/               # Shared utilities (minimal deps)
│   ├── ui-components/        # Reusable UI (platform-specific deps)
│   └── integrations/         # Third-party integrations (external deps)
└── tools/
    └── build-utilities/      # Build and development tools
```

### Version Management Strategy

1. **Pin Production Dependencies**: Use exact versions for stability
2. **Allow Development Flexibility**: Use `from:` constraints for development
3. **Regular Updates**: Schedule quarterly dependency reviews
4. **Security Audits**: Monitor for security vulnerabilities

### Local Dependency Guidelines

1. **Single Responsibility**: Each package should have a clear, focused purpose
2. **Minimal Dependencies**: Avoid transitive dependency bloat
3. **API Stability**: Maintain stable APIs between local packages
4. **Documentation**: Document all public interfaces

### Remote Dependency Best Practices

1. **Due Diligence**: Research package quality, maintenance, and community
2. **License Compatibility**: Ensure license compatibility with your project
3. **Size Considerations**: Monitor package size impact on app bundles
4. **Alternative Evaluation**: Consider multiple options before choosing

## 📚 Examples

### Complete Workspace Setup

Let's walk through setting up a complete iOS application with shared libraries:

#### 1. Create the Workspace Structure

```bash
# Core shared library
npx nx g @nx-apple/swift-package-manager:swift-package CoreLogic \
  --directory=libs \
  --type=library \
  --platforms="iOS(.v15),macOS(.v12)"

# UI components library
npx nx g @nx-apple/swift-package-manager:swift-package UIComponents \
  --directory=libs \
  --type=library \
  --platforms="iOS(.v15)"

# Networking library  
npx nx g @nx-apple/swift-package-manager:swift-package NetworkLayer \
  --directory=libs \
  --type=library \
  --platforms="iOS(.v15),macOS(.v12)"

# iOS application
npx nx g @nx-apple/swift-package-manager:swift-package MyiOSApp \
  --directory=apps \
  --type=executable \
  --platforms="iOS(.v15)"
```

#### 2. Add External Dependencies

```bash
# Add networking framework to NetworkLayer
npx nx g @nx-apple/swift-package-manager:add-dependency \
  --project=NetworkLayer \
  --dependencyType=remote \
  --url=https://github.com/Alamofire/Alamofire.git \
  --version="5.8.0"

# Add UI framework to UIComponents
npx nx g @nx-apple/swift-package-manager:add-dependency \
  --project=UIComponents \
  --dependencyType=remote \
  --url=https://github.com/SnapKit/SnapKit.git \
  --version="5.6.0"
```

#### 3. Set Up Local Dependencies

```bash
# NetworkLayer depends on CoreLogic
npx nx g @nx-apple/swift-package-manager:add-dependency \
  --project=NetworkLayer \
  --dependencyType=local \
  --localProject=CoreLogic

# UIComponents depends on CoreLogic
npx nx g @nx-apple/swift-package-manager:add-dependency \
  --project=UIComponents \
  --dependencyType=local \
  --localProject=CoreLogic

# iOS app depends on all libraries
npx nx g @nx-apple/swift-package-manager:add-dependency \
  --project=MyiOSApp \
  --dependencyType=local \
  --localProject=CoreLogic

npx nx g @nx-apple/swift-package-manager:add-dependency \
  --project=MyiOSApp \
  --dependencyType=local \
  --localProject=NetworkLayer

npx nx g @nx-apple/swift-package-manager:add-dependency \
  --project=MyiOSApp \
  --dependencyType=local \
  --localProject=UIComponents
```

#### 4. Verify Setup

```bash
# Visualize the dependency graph
npx nx graph

# Build all affected projects
npx nx affected:build

# Test the setup
npx nx affected:test
```

### Advanced Configuration Examples

#### Multi-Platform Package

```swift
// Package.swift for a cross-platform library
let package = Package(
    name: "CrossPlatformUtils",
    platforms: [
        .macOS(.v12),
        .iOS(.v15),
        .watchOS(.v8),
        .tvOS(.v15)
    ],
    products: [
        .library(name: "CrossPlatformUtils", targets: ["CrossPlatformUtils"])
    ],
    dependencies: [
        .package(url: "https://github.com/apple/swift-log.git", from: "1.0.0")
    ],
    targets: [
        .target(
            name: "CrossPlatformUtils",
            dependencies: [
                .product(name: "Logging", package: "swift-log")
            ]
        )
    ]
)
```

#### Complex Dependency Relationships

```bash
# Feature-based architecture
npx nx g @nx-apple/swift-package-manager:swift-package AuthenticationFeature --directory=features
npx nx g @nx-apple/swift-package-manager:swift-package PaymentFeature --directory=features
npx nx g @nx-apple/swift-package-manager:swift-package UserProfileFeature --directory=features

# Shared dependencies
npx nx g @nx-apple/swift-package-manager:add-dependency \
  --project=AuthenticationFeature \
  --dependencyType=local \
  --localProject=CoreLogic

npx nx g @nx-apple/swift-package-manager:add-dependency \
  --project=AuthenticationFeature \
  --dependencyType=local \
  --localProject=NetworkLayer

# Cross-feature dependencies
npx nx g @nx-apple/swift-package-manager:add-dependency \
  --project=PaymentFeature \
  --dependencyType=local \
  --localProject=AuthenticationFeature
```

## 🛠️ Troubleshooting

### Common Issues and Solutions

#### Issue: "Package.swift not found"

**Symptoms:**
```
Error: Package.swift not found at packages/my-package/Package.swift
```

**Solutions:**
```bash
# Verify project exists
npx nx show projects | grep my-package

# Check project root directory
ls -la packages/my-package/

# Regenerate Package.swift if needed
npx nx g @nx-apple/swift-package-manager:swift-package my-package --force
```

#### Issue: "Local project not found"

**Symptoms:**
```
Error: Local project "shared-utils" not found in workspace
```

**Solutions:**
```bash
# List all projects in workspace
npx nx show projects

# Check exact project name
npx nx show project shared-utils

# Verify project.json exists
cat packages/shared-utils/project.json
```

#### Issue: "URL is required for remote dependencies"

**Symptoms:**
```
Error: URL is required when dependencyType is "remote"
```

**Solutions:**
```bash
# Ensure --url is provided for remote dependencies
npx nx g @nx-apple/swift-package-manager:add-dependency \
  --project=my-package \
  --dependencyType=remote \
  --url=https://github.com/example/package.git \
  --version="1.0.0"
```

#### Issue: "Dependency not removed from Package.swift"

**Symptoms:**
Dependency still appears in Package.swift after removal command

**Solutions:**
```bash
# Check if dependency is used in other targets
npx nx g @nx-apple/swift-package-manager:remove-dependency \
  --project=my-package \
  --dependency=swift-algorithms \
  --removeFromPackage=true

# Remove from all targets first
npx nx g @nx-apple/swift-package-manager:remove-dependency \
  --project=my-package \
  --dependency=swift-algorithms
  # (no --targets specified removes from all)
```

### Validation Commands

```bash
# Validate Package.swift syntax
cd packages/my-package
swift package dump-package

# Resolve dependencies
swift package resolve

# Clean and rebuild
swift package clean
swift package build

# Check for circular dependencies
npx nx graph --affected
```

### Debug Mode

Enable verbose logging for detailed troubleshooting:

```bash
export NX_VERBOSE_LOGGING=true
npx nx g @nx-apple/swift-package-manager:add-dependency \
  --project=my-package \
  --dependencyType=remote \
  --url=https://github.com/example/package.git \
  --version="1.0.0" \
  --verbose
```

## 🔄 Migration and Maintenance

### Updating Dependencies

```bash
# Update to latest compatible versions
cd packages/my-package
swift package update

# Update specific dependency
swift package update swift-algorithms

# Pin to specific version after testing
npx nx g @nx-apple/swift-package-manager:remove-dependency \
  --project=my-package \
  --dependency=swift-algorithms

npx nx g @nx-apple/swift-package-manager:add-dependency \
  --project=my-package \
  --dependencyType=remote \
  --url=https://github.com/apple/swift-algorithms.git \
  --version="1.2.0"
```

### Dependency Auditing

```bash
# List all dependencies across workspace
npx nx report

# Check for outdated dependencies
for project in $(npx nx show projects); do
  echo "=== $project ==="
  cd "packages/$project" 2>/dev/null || cd "apps/$project" 2>/dev/null || continue
  swift package show-dependencies 2>/dev/null || echo "No Package.swift"
  cd - > /dev/null
done
```

### Automated Dependency Management

Create scripts for regular maintenance:

```bash
#!/bin/bash
# scripts/update-dependencies.sh

echo "🔍 Checking for outdated dependencies..."

for project_dir in packages/* apps/*; do
  if [[ -f "$project_dir/Package.swift" ]]; then
    project_name=$(basename "$project_dir")
    echo "📦 Updating $project_name..."
    
    cd "$project_dir"
    swift package update
    cd - > /dev/null
  fi
done

echo "✅ Dependency update complete"
echo "🧪 Running tests to verify compatibility..."
npx nx affected:test
```

## 📖 API Reference

### Add Dependency Schema

```typescript
interface AddDependencySchema {
  project: string;                    // Target project name
  dependencyType: 'remote' | 'local'; // Dependency source
  url?: string;                       // Git URL (required for remote)
  localProject?: string;              // Local project name (required for local)
  version?: string;                   // Version constraint
  targets?: string[];                 // Specific targets
  productName?: string;               // Specific product name
}
```

### Remove Dependency Schema

```typescript
interface RemoveDependencySchema {
  project: string;           // Target project name  
  dependency: string;        // Dependency name or URL
  targets?: string[];        // Specific targets
  removeFromPackage?: boolean; // Remove from dependencies array
}
```

### Version Constraint Formats

```typescript
type VersionConstraint = 
  | string                    // "1.2.3"
  | `from: "${string}"`      // from: "1.2.0"
  | `branch: "${string}"`    // branch: "main"
  | `revision: "${string}"   // revision: "abc123"
  | `"${string}"..<"${string}"` // "1.0.0"..<"2.0.0"
```

## 🤝 Contributing

Found an issue or want to contribute? Please see our [Contributing Guide](../../CONTRIBUTING.md).

### Reporting Issues

When reporting dependency management issues, please include:

1. **Nx version**: `npx nx --version`
2. **Swift version**: `swift --version`
3. **Plugin version**: Check `package.json`
4. **Project structure**: `npx nx show projects`
5. **Package.swift content**: The relevant Package.swift file
6. **Error output**: Full error messages with stack traces
7. **Steps to reproduce**: Minimal reproduction case

### Feature Requests

For new dependency management features, consider:

1. **Use case**: Describe the specific problem you're solving
2. **Current workaround**: How do you handle this today?
3. **Proposed solution**: Your ideal solution
4. **Alternative solutions**: Other approaches you've considered
5. **Impact**: Who would benefit from this feature?

---

<div align="center">

**🎯 Professional Swift Package Management for Nx Workspaces**

[Main Documentation](./README.md) • [GitHub Issues](https://github.com/nx-apple/toolkit/issues) • [Discord Community](https://discord.gg/nx-apple)

</div>
