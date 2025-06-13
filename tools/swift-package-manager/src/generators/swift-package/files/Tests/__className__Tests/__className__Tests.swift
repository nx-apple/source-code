import XCTest
<% if (type === 'library') { %>@testable import <%= className %>

final class <%= className %>Tests: XCTestCase {
    
    func testGreet() {
        let <%= propertyName %> = <%= className %>()
        let result = <%= propertyName %>.greet("World")
        XCTAssertEqual(result, "Hello, World! Welcome to <%= className %>.")
    }
    
    func testGreetWithCustomName() {
        let <%= propertyName %> = <%= className %>()
        let result = <%= propertyName %>.greet("Swift")
        XCTAssertEqual(result, "Hello, Swift! Welcome to <%= className %>.")
    }
}
<% } else { %>
// Note: Testing executables requires special setup
// For now, this is a placeholder test file

final class <%= className %>Tests: XCTestCase {
    
    func testExample() {
        // This is a placeholder test
        // In a real executable, you would test individual functions
        // that are not part of the main() function
        XCTAssertTrue(true)
    }
}
<% } %>
