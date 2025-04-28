//
//  OleExmpleTest.swift
//  OleExmpleTest
//
//  Created by 清水 一征 on 2025/04/24.
//

import Testing
import Foundation
@testable import DraftOle

struct ExamTest {

    @Test func example() async throws {
        let ksc = KsCalculator()
        #expect(ksc.ksAdd() == 3)
    }
    
    @Test
        func test_export() throws {
            // テスト対象
            var exam = Exam()
            
            // 事前に、ファイルが存在しないことを確認
            let fileManager = FileManager.default
            let baseDir = fileManager.urls(for: .documentDirectory, in: .userDomainMask).first!
            let outputDir = baseDir.appendingPathComponent(CONST.ExportFolder)
            let testFileURL = outputDir.appendingPathComponent("test")
            
            if fileManager.fileExists(atPath: testFileURL.path) {
                try fileManager.removeItem(at: testFileURL)
            }
            
            // --- テスト実行 ---
            exam.export()
            
            // --- 結果検証 ---
            #expect(fileManager.fileExists(atPath: testFileURL.path))
            
            let content = try String(contentsOf: testFileURL, encoding: .utf8)
            #expect(content == "test is test")
        }
    
}
