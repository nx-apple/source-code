<% if (type === 'library') { %>// <%= className %>.swift
// A Swift library module

import Foundation

/// <%= className %> provides functionality for <%= name %>
public struct <%= className %> {
    
    /// Create a new instance of <%= className %>
    public init() {}
    
    /// A sample function that returns a greeting
    /// - Parameter name: The name to greet
    /// - Returns: A greeting string
    public func greet(_ name: String) -> String {
        return "Hello, \(name)! Welcome to <%= className %>."
    }
}
<% } else { %>// main.swift
// <%= className %> executable entry point

import Foundation

/// Main entry point for the <%= className %> executable
@main
struct <%= className %> {
    static func main() {
        print("Hello from <%= className %>!")
        
        // Add your application logic here
        let arguments = CommandLine.arguments
        if arguments.count > 1 {
            print("Arguments passed: \(arguments[1...])")
        }
    }
}
<% } %>
