//
//  OleExmpleTest.swift
//  OleExmpleTest
//
//  Created by 清水 一征 on 2025/04/24.
//

import Testing

struct OleExmpleTest {

    @Test func example() async throws {
        let ksc = KsCalculator()
        #expect(ksc.ksAdd() == 3)
    }
    
    @Test func test_export() {
        var exam = Exam()
        exam.export_test()
        
    }

}
