// import Testing
import XCTest

@testable import DraftOle

final class DraftOleTests: XCTestCase {
    func test_firstTest() {
        XCTAssertEqual(1, 1)
    }

    func test_write() {
        let draftOle = DraftOle()
        let fileName = "test.txt"
        let content = "Hello, World!"

        draftOle.write(content, to: fileName)

        let url = URL(fileURLWithPath: FileManager.default.currentDirectoryPath)
            .appendingPathComponent(fileName)

        do {
            let fileContent = try String(contentsOf: url, encoding: .utf8)
            XCTAssertEqual(fileContent, content)
        } catch {
            XCTFail("Failed to read the file: \(error)")
        }
    }

}
