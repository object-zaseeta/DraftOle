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

        let projectPath = try resolveProjectPath()
        try checkProjectNotExists(at: projectPath)
        try createTestsDirectory(in: projectPath)
        try initializeSwiftPackage(at: projectPath)
        try createTestFile(in: projectPath)
        //try copyDraftOleTemplate(to: projectPath)
        try writePackageSwift(at: projectPath)


        print("✅ 初期化完了！ \(projectPath)")
    }

    // MARK: - サブ処理

    private func resolveProjectPath() throws -> String {
        let fileManager = FileManager.default
        let currentPath = fileManager.currentDirectoryPath

        if let out = outputDir {
            return URL(fileURLWithPath: out).standardizedFileURL.appendingPathComponent(name).path
        } else {
            let currentURL = URL(fileURLWithPath: currentPath)
            if currentURL.lastPathComponent == "DraftOle" {
                return currentURL.deletingLastPathComponent().appendingPathComponent(name).path
            } else {
                return currentURL.appendingPathComponent(name).path
            }
        }
    }

    private func checkProjectNotExists(at path: String) throws {
        if FileManager.default.fileExists(atPath: path) {
            throw RuntimeError("⚠️ プロジェクト '\(path)' はすでに存在します。処理を中止しました。")
        }
    }

    private func createTestsDirectory(in path: String) throws {
        let testsPath = "\(path)/Tests/\(name)Tests"
        try FileManager.default.createDirectory(atPath: testsPath, withIntermediateDirectories: true)
    }

    private func initializeSwiftPackage(at path: String) throws {
        try runCommand("swift", "package", "init", "--type", "executable", "--name", name, in: path)
    }

    private func createTestFile(in path: String) throws {
        let testFile = "\(path)/Tests/\(name)Tests/\(name)Tests.swift"
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
    }

    // private func copyDraftOleTemplate(to projectPath: String) throws {
    //     let fileManager = FileManager.default

    //     // この Swift ファイル（InitCommand.swift）のある場所を基準に DraftOle フォルダを探す
    //     let sourceBase = URL(fileURLWithPath: #file) // /.../Sources/draftole/InitCommand.swift
    //         .deletingLastPathComponent()             // /.../Sources/draftole
    //         .deletingLastPathComponent()             // /.../Sources
    //         .deletingLastPathComponent()             // /.../DraftOle ← ← ← ここがプロジェクトルート想定

    //     let sourceURL = sourceBase.appendingPathComponent("DraftOle")

    //     let destinationURL = URL(fileURLWithPath: projectPath).appendingPathComponent("Sources/DraftOle")

    //     guard fileManager.fileExists(atPath: sourceURL.path) else {
    //         throw RuntimeError("❌ コピー元 DraftOle ディレクトリが見つかりません: \(sourceURL.path)")
    //     }

    //     if fileManager.fileExists(atPath: destinationURL.path) {
    //         throw RuntimeError("⚠️ Sources/DraftOle はすでに存在しています。処理を中止しました。")
    //     }

    //     try fileManager.createDirectory(at: destinationURL.deletingLastPathComponent(), withIntermediateDirectories: true)
    //     try fileManager.copyItem(at: sourceURL, to: destinationURL)

    //     print("📁 DraftOle をコピーしました → \(destinationURL.path)")
    // }

   private func writePackageSwift(at path: String) throws {
        let packageSwiftPath = "\(path)/Package.swift"

        let content = """
        // swift-tools-version: 5.9
        import PackageDescription

        let package = Package(
            name: "\(name)",
            platforms: [
                .macOS(.v12)
            ],
            dependencies: [
                .package(path: "../DraftOle")
            ],
            targets: [
                .executableTarget(
                    name: "\(name)",
                    dependencies: ["DraftOle"]
                ),
                .testTarget(
                    name: "\(name)Tests",
                    dependencies: ["DraftOle"]
                )
            ]
        )
        """

        try content.write(toFile: packageSwiftPath, atomically: true, encoding: .utf8)
        print("📦 Package.swift を生成しました。")
    }


    
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
