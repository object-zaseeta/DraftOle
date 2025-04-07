//
//  Element.swift
//  DraftOle
//
//  Created by 清水 一征 on 2025/04/07.
//

import Foundation

struct Renderer {
    
    var timeStamp: String = ""
    func renderHTML(timestamp: String) -> String {
        let htmlContent = """
        <!DOCTYPE html>
        <html>
        <head>
            <title>Swift CLI</title>
        </head>
        <body>
            <h1>Hello from Swift CLI!</h1>
        <p>\(timestamp)</p>
        </body>
        </html>
        """
        return htmlContent
    }
    
    func outPut() {
        let now = Date()
        let htmlContent = renderHTML(timestamp: now.description)
        let fileName = "index.html"
        let fileURL = URL(fileURLWithPath: FileManager.default.homeDirectoryForCurrentUser.path())
            .appendingPathComponent(fileName)
        
        do {
            try htmlContent.write(to: fileURL, atomically: true, encoding: .utf8)
            print("✅ HTMLファイルを生成しました: \(fileURL.path)")
        } catch {
            print("❌ ファイルの生成に失敗: \(error)")
        }
    }
    
}

