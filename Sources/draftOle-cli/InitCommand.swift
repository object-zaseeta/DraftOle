import ArgumentParser
import Foundation

struct InitCommand: ParsableCommand {
    static let configuration = CommandConfiguration(
        commandName: "init",
        abstract: "新しいプロジェクトを初期化します"
    )

    @Option(name: .shortAndLong, help: "作成するプロジェクト名")
    var name: String

    @Option(name: .shortAndLong, help: "出力ディレクトリのパス")
    var outputDir: String?

    func run() throws {
        print("🚀 プロジェクト '\(name)' を初期化します...")

        let fileManager = FileManager.default
        let currentPath = fileManager.currentDirectoryPath

        var baseOutputPath: String

        if let out = outputDir {
            baseOutputPath = URL(fileURLWithPath: out).standardizedFileURL.path
        } else {
            // DraftOle のひとつ上の階層を取得
            let currentURL = URL(fileURLWithPath: currentPath)
            let draftOleFolder = currentURL.lastPathComponent
            if draftOleFolder == "DraftOle" {
                baseOutputPath = currentURL.deletingLastPathComponent().path
            } else {
                baseOutputPath = currentPath
            }
        }

        let projectPath = "\(baseOutputPath)/\(name)"

        if fileManager.fileExists(atPath: projectPath) {
            throw RuntimeError("⚠️ プロジェクト '\(projectPath)' はすでに存在します。処理を中止しました。")
        }
        
        // Tests/プロジェクト名Tests を作成
        let testsPath = "\(projectPath)/Tests/\(name)Tests"
        try fileManager.createDirectory(atPath: testsPath, withIntermediateDirectories: true)

        try runCommand(
            "swift", "package", "init", "--type", "executable", "--name", name, in: projectPath)

        let testFile = "\(testsPath)/\(name)Tests.swift"
        let testContent = """
            import XCTest
            @testable import \(name)

            final class \(name)Tests: XCTestCase {
                func testExample() {
                    XCTAssertEqual(1, 1)
                }
            }
            """
        try testContent.write(toFile: testFile, atomically: true, encoding: .utf8)

        print("✅ 初期化完了！ \(projectPath)")
    }

    // private func runCommand(_ cmd: String, _ args: String..., in dir: String) throws {
    //     let process = Process()
    //     process.executableURL = URL(fileURLWithPath: "/usr/bin/env")
    //     process.arguments = [cmd] + args
    //     process.currentDirectoryURL = URL(fileURLWithPath: dir)
    //     try process.run()
    //     process.waitUntilExit()
    // }

    private func runCommand(_ cmd: String, _ args: String..., in dir: String) throws {
        let process = Process()
        process.executableURL = URL(fileURLWithPath: "/usr/bin/env")
        process.arguments = [cmd] + args
        process.currentDirectoryURL = URL(fileURLWithPath: dir)

        let pipe = Pipe()
        process.standardOutput = pipe
        process.standardError = pipe

        try process.run()
        process.waitUntilExit()

        if process.terminationStatus != 0 {
            let data = pipe.fileHandleForReading.readDataToEndOfFile()
            let output = String(data: data, encoding: .utf8) ?? "Unknown error"
            throw RuntimeError("Command failed: \(cmd) \(args.joined(separator: " "))\n\(output)")
        }
    }

    struct RuntimeError: Error, CustomStringConvertible {
        var description: String
        init(_ desc: String) {
            description = desc
        }
    }

}
