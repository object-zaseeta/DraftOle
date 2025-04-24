
public protocol Builderable {
    var children: [Elementable] { get set }
    var siblings: [Elementable] { get set }
    
    mutating func addChild(_ element: Elementable)
    mutating func addSibling(_ element: Elementable)

}

public extension Builderable {
    mutating func addChild(_ element: Elementable) {
        children.append(element)
    }

    mutating func addSibling(_ element: Elementable) {
        siblings.append(element)
    }
}