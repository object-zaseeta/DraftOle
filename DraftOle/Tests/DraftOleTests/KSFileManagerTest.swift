import Testing
import Foundation
@testable import DraftOle

struct KSFileManagerTests {
    @Test
    func testWrite_createsFileWithCorrectContent() throws {
        // 一時ディレクトリの作成
        let tempDir = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)
        let manager = KSFileManager(outputDirectory: tempDir)

        let fileName = "test.txt"
        let expectedContent = "Hello, Testing!"
        manager.write(expectedContent, to: fileName)

        let fileURL = tempDir.appendingPathComponent(fileName)
        let fileExists = FileManager.default.fileExists(atPath: fileURL.path)
        #expect(fileExists)

        let actualContent = try String(contentsOf: fileURL)
        #expect(actualContent == expectedContent)

        // クリーンアップ（任意）
        try? FileManager.default.removeItem(at: tempDir)
    }

    @Test
    func testWriteWithMock() {
        let mock = MockFileManager()
        let fileName = "mock.txt"
        let content = "From mock!"

        // テスト対象関数
        someLogicThatUsesFileManager(fileManager: mock, fileName: fileName, content: content)

        #expect(mock.writtenFiles.count == 1)
        #expect(mock.writtenFiles[0].fileName == fileName)
        #expect(mock.writtenFiles[0].content == content)
    }

    func someLogicThatUsesFileManager(fileManager: FileManaging, fileName: String, content: String) {
        fileManager.write(content, to: fileName)
    }
}
