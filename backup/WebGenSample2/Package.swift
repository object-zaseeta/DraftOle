// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "WebGenSample2",
    platforms: [
        .macOS(.v12)
    ],
    targets: [
        .executableTarget(
            name: "WebGenSample2",
            path: "Sources/draftole" // 任意の実ソースフォルダ
        ),
        .testTarget(
            name: "WebGenSample2Tests",
            dependencies: ["WebGenSample2"]
        )
    ]
)
