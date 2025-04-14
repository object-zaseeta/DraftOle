// swift-tools-version: 6.1
// The swift-tools-version declares the minimum version of Swift required to build this package.

import PackageDescription

let package = Package(
    name: "DraftOle",
    platforms: [
        .macOS(.v12)
    ],
    products: [
        .library(
            name: "DraftOle",
            targets: ["DraftOle"]
        ),
        .executable(
            name: "draftole",  // コマンド名として使われる
            targets: ["draftOle-cli"]
        ),
    ],
    dependencies: [
        .package(url: "https://github.com/apple/swift-argument-parser", from: "1.2.0")
    ],
    targets: [
        .target(
            name: "DraftOle",
            dependencies: []
        ),
        .executableTarget(
            name: "draftOle-cli",
            dependencies: [
                "DraftOle",
                .product(name: "ArgumentParser", package: "swift-argument-parser"),
            ]
        ),
        .testTarget(
            name: "DraftOleTests",
            dependencies: ["DraftOle"]
        ),
    ]
)
