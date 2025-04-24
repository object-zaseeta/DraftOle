// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "WebGenSample3",
    platforms: [
        .macOS(.v12)
    ],
    dependencies: [
        .package(path: "../DraftOle")
    ],
    targets: [
        .executableTarget(
            name: "WebGenSample3",
            dependencies: ["DraftOle"]
        ),
        .testTarget(
            name: "WebGenSample3Tests",
            dependencies: ["DraftOle"]
        )
    ]
)