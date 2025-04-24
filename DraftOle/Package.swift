// swift-tools-version: 6.1
// The swift-tools-version declares the minimum version of Swift required to build this package.

import PackageDescription

let package = Package(
    name: "DraftOle",
    platforms: [
           .macOS(.v11)  // ← ここで11以上に制限
       ],
    products: [
        // Products define the executables and libraries a package produces, making them visible to other packages.
        .library(
            name: "DraftOle",
            targets: ["DraftOle"]),
    ],
    targets: [
        // Targets are the basic building blocks of a package, defining a module or a test suite.
        // Targets can depend on other targets in this package and products from dependencies.
        .target(
            name: "DraftOle",
            path: "Sources",                         // メインコードは DraftOle ディレクトリ内
            sources: [
                "DraftOle",
                "Elements",
                "Protocols",
                "Utils",
                ]
        ),
        .testTarget(
            name: "DraftOleTests",
            dependencies: ["DraftOle"]
        ),
    ]
)
