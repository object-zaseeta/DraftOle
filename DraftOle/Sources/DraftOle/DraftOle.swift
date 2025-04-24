// The Swift Programming Language
// https://docs.swift.org/swift-book

import Foundation

public struct DraftOle: Builderable {
    let outputDirectory: URL
    var content: String = ""
    let ksFileManager: KSFileManager
    public var children: [any Elementable] = []
    public var siblings: [any Elementable] = []
    
    public init(outputDirectory: URL? = nil) {
        let baseDir = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first!
        let finalOutput = outputDirectory ?? baseDir.appendingPathComponent(CONST.ExportFolder)
        Oslog.info.info("output directory is \(finalOutput)")
        
        self.outputDirectory = finalOutput
        self.ksFileManager = KSFileManager(outputDirectory: finalOutput)        
    }
    
    public mutating func export() {
        ksFileManager.write("test is test", to: "test")
    }

    public mutating func setContents(elements: [Elementable]) {
            elements.forEach { e  in
                content += e.render(indentLevel: 0)
            }
    }
    public mutating func setContents() {
            children.forEach { e  in
                content += e.render(indentLevel: 0)
            }
    }
    

}


public struct Calculator {
    public init() {}

    public func add(_ a: Int, _ b: Int) -> Int {
        return a + b
    }

    public func sub(_ a: Int, _ b: Int) -> Int {
        return a - b
    }
}
