import Foundation

public struct KSFileManager {
    let outputDirectory: URL

    public init(outputDirectory: URL? = nil) {
        let baseDir = URL(fileURLWithPath: FileManager.default.currentDirectoryPath)
        self.outputDirectory = outputDirectory ?? baseDir.appendingPathComponent("dist")
    }

    public func write(_ content: String, to fileName: String) {
        let fileManager = FileManager.default
        let distPath = outputDirectory.path

        if !fileManager.fileExists(atPath: distPath) {
            try? fileManager.createDirectory(
                atPath: distPath, withIntermediateDirectories: true, attributes: nil)
        }

        let url = URL(fileURLWithPath: distPath).appendingPathComponent(fileName)
        try? content.write(to: url, atomically: true, encoding: .utf8)
        print("Generated: \(fileName)")
    }
}
