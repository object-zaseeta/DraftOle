import Foundation

public struct KSFileManager: FileManaging {
    let outputDirectory: URL

    public init(outputDirectory: URL) {
        self.outputDirectory = outputDirectory
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
        print("path is \(url)")
    }
}
