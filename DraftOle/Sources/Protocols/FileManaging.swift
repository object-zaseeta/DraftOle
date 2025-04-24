//
//  File.swift
//  DraftOle
//
//  Created by 清水 一征 on 2025/04/25.
//

import Foundation

public protocol FileManaging {
    func write(_ content: String, to fileName: String)
}
