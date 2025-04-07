//
//  Element.swift
//  DraftOle
//
//  Created by 清水 一征 on 2025/04/07.
//

import Foundation

class Element {
    var tagName: String
    var attributes: [String: String]
    var children: [Element]

    init(tagName: String, attributes: [String: String] = [:], children: [Element] = []) {
        self.tagName = tagName
        self.attributes = attributes
        self.children = children
    }

    func render() -> String {
        let attributesString = attributes.map { "\($0.key)=\"\($0.value)\"" }.joined(separator: " ")
        let openingTag = "<\(tagName)\(attributesString.isEmpty ? "" : " " + attributesString)>"
        let closingTag = "</\(tagName)>"
        
        let childrenString = children.map { $0.render() }.joined()
        
        return "\(openingTag)\(childrenString)\(closingTag)"
    }
}

class HTMLDocument {
    var root: Element

    init(root: Element) {
        self.root = root
    }

    func render() -> String {
        return "<!DOCTYPE html>\n" + root.render()
    }
}

