//
//  main.swift
//  OleExample
//
//  Created by 清水 一征 on 2025/04/24.
//

import Foundation
import DraftOle

struct Exam {
    var ole = DraftOle()
    mutating func export_test () {
        self.ole.export()
    }
    
}

struct KsCalculator {
    
    func ksAdd() -> Int {
       let dr = Calculator()
       return dr.add(1, 2)

    }
}
