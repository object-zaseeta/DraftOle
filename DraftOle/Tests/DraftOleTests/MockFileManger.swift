//
//  MockFileManger.swift
//  DraftOle
//
//  Created by 清水 一征 on 2025/04/25.
//

import Foundation
@testable import DraftOle

final class MockFileManager: FileManaging {
    var writtenFiles: [(fileName: String, content: String)] = []

    func write(_ content: String, to fileName: String) {
        writtenFiles.append((fileName, content))
    }
}

