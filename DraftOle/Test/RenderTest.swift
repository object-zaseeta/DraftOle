//
//  RenderTest.swift
//  DraftOle
//
//  Created by kazuyuki shimizu on 2025/04/09.
//

import XCTest
@testable import DraftOle

final class RenderTest: XCTestCase {

    override func setUpWithError() throws {
        // Put setup code here. This method is called before the invocation of each test method in the class.
    }

    override func tearDownWithError() throws {
        // Put teardown code here. This method is called after the invocation of each test method in the class.
    }


    func test_i () {
        let r = Renderer()
        XCTAssertEqual(r.addSample() , 11)
    }
    
    
}
