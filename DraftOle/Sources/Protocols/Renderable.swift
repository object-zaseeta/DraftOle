//
//  Untitled.swift
//  DraftOle
//
//  Created by 清水 一征 on 2025/04/22.
//


public protocol Renderable {
    var tagName: String { get }
    var children: [Elementable] { get }
    var siblings: [Elementable] { get }
    func render(indentLevel: Int) -> String
}

public extension Renderable {
    func render(indentLevel: Int = 0) -> String {
        let indent = String(repeating: "    ", count: indentLevel) // 4スペース
        let nextIndent = indentLevel + 1

        let openingTag = "\(indent)<\(tagName)>"
        let closingTag = "\(indent)</\(tagName)>"

        let childrenString = children
            .map { $0.render(indentLevel: nextIndent) }
            .joined(separator: "\n")

        let siblingString = siblings
            .map { $0.render(indentLevel: indentLevel) }
            .joined(separator: "\n")

        var result = openingTag

        if !children.isEmpty {
            result += "\n\(childrenString)\n\(closingTag)"
        } else {
            result += "\(closingTag)"
        }

        if !siblingString.isEmpty {
            result += "\n\(siblingString)"
        }

        return result
    }
}
