import Foundation

public struct Doctype: Elementable {
    public var tagName: String = ""
    public var children: [Elementable] = []
    public var siblings: [any Elementable] = []

    public func render(indentLevel: Int = 0) -> String {
        let selfLine = "<!DOCTYPE html>\n"
        let siblingString = siblings
            .map { $0.render(indentLevel: indentLevel) }
            .joined(separator: "\n")

        if siblingString.isEmpty {
            return selfLine
        } else {
            return "\(selfLine)\n\(siblingString)"
        }

    }
}
