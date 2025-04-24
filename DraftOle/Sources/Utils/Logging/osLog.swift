//
//  osLog.swift
//  DraftOle
//
//  Created by kazuyuki shimizu on 2025/04/25.
//

import os

public typealias Oslog = OSLog

public extension OSLog {
   static let debugUse = Logger(subsystem: "ZaSeeTa.com", category: "use for debug")
   static let koko_now = Logger(subsystem: "koko now", category: "now editing")
   static let info = Logger(subsystem: "ZaSeeTa.com", category: "out put log")

}
