# <%= className %>

<%= name %> is a Swift package generated with the Nx Swift Package Manager plugin.

## Overview

<% if (type === 'library') { %>This package provides a Swift library with the following features:

- Reusable Swift components
- Comprehensive test coverage
- Cross-platform support for <%= platforms.join(', ') %>

## Usage

```swift
import <%= className %>

let <%= propertyName %> = <%= className %>()
let greeting = <%= propertyName %>.greet("World")
print(greeting) // "Hello, World! Welcome to <%= className %>."
```
<% } else { %>This package provides a Swift executable application.

## Usage

To run the application:

```bash
swift run <%= name %>
```

To build the application:

```bash
swift build
```
<% } %>

## Development

### Building

```bash
swift build
```

### Testing

```bash
swift test
```

### Using with Nx

This package is managed by Nx. You can use the following commands:

```bash
# Build the package
nx build <%= projectName %>

# Run tests
nx test <%= projectName %>

# Lint the code (if SwiftLint is available)
nx lint <%= projectName %>
```

## Requirements

- Swift 5.9 or later
- Supported platforms: <%= platforms.join(', ') %>

## License

<!-- Add your license information here -->
