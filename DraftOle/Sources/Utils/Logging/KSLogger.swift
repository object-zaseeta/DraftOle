//
//  File.swift
//  DraftOle
//
//  Created by 清水 一征 on 2025/04/28.
//

//
//  KSLogger.swift
//  DraftWriter
//
//  Created by 清水 一征 on 2025/04/26.
//

import Foundation
import os

enum LogCategory: String {
    case UI
    case Application
    case ViewController
    case View
    case Utility
    case Model
}

/// An in-memory cache of ``os.Logger`` instances based on their category.
@MainActor
final class LoggerStore {

    private var loggersByCategory: [String: os.Logger] = [:]

    func logger(for category: String) -> os.Logger {
        if let existingLogger = loggersByCategory[category] {
            return existingLogger
        } else {
            let newLogger = Self.create(for: category)
            loggersByCategory[category] = newLogger
            return newLogger
        }
    }
    private static func create(for category: String) -> os.Logger {
        return .init(subsystem: subsystem, category: category)
    }
    
    private static let subsystem = Bundle.main.bundleIdentifier ?? "com.zaseeta"

}

@MainActor
private let store = LoggerStore()

struct KSLogger {

    private static func defualtLogHander(
        category: LogCategory,
        message: String,
        level: LogLevel,
        _ file: String?,
        _ function: String?,
        _ line: UInt
    ){
        let fileContext: String
        
        if let file = file, let function = function {
            let fileName = (file as NSString)
                .lastPathComponent
                .replacingOccurrences(of: ".swift", with: "")
                .trimmingCharacters(in: CharacterSet.whitespacesAndNewlines)

            fileContext = "\t\(fileName).\(function):\(line)"
        } else {
            fileContext = "..."
        }
        
        Task.detached(priority: .background){
            await store
                .logger(for: category.rawValue)
                .log(level: level.logType, "\(level.description, privacy: .public)\(fileContext, privacy: .public): \(message, privacy: .public)"
                )
        }
    }

    static func verbose(category: LogCategory, _ message: String, file: String = #fileID, function: String = #function, line: UInt = #line) {
        defualtLogHander(category: category , message: message, level: .verbose, file, function, line)
    }

    static func debug( category: LogCategory, _ message: String, file: String = #fileID, function: String = #function, line: UInt = #line) {
        defualtLogHander(category: category , message: message, level: .debug, file, function, line)
    }

    static func info(category: LogCategory, _ message: String, file: String = #fileID, function: String = #function, line: UInt = #line) {
        defualtLogHander(category: category , message: message, level: .info, file, function, line)
    }
    static func warn(category: LogCategory, _ message: String, file: String = #fileID, function: String = #function, line: UInt = #line) {
        defualtLogHander(category: category , message: message, level: .warn, file, function, line)
    }
    static func error(category: LogCategory, _ message: String, file: String = #fileID, function: String = #function, line: UInt = #line) {
        defualtLogHander(category: category , message: message, level: .error, file, function, line)
    }

    
}

public enum LogLevel: Int, CustomStringConvertible, CaseIterable, Sendable {

    // swiftlint:disable missing_docs

    case verbose = 4
    case debug = 0
    case info = 1
    case warn = 2
    case error = 3

    public var description: String {
        switch self {
        case .verbose: return "⚙️ [VERBOSE]"
        case .debug: return "⚒️ [DEBUG]"
        case .info: return "🛈 [INFO]"
        case .warn: return "✋🏻 [WARN]"
        case .error: return "💀 [ERROR]"
        }
    }

    // swiftlint:enable missing_docs
}
private extension LogLevel {

    var logType: OSLogType {
        return Self.logTypes[self]!
    }

    private func calculateLogType() -> OSLogType {
        switch self {
        case .verbose, .debug:
            #if DEBUG
            return .debug
            #else
            return .info
            #endif

        case .info: return .info
        case .warn: return .error
        case .error: return .error
        }
    }

    private static let logTypes: [Self: OSLogType] =
        .init(uniqueKeysWithValues: Self.allCases.lazy.map {
            ($0, $0.calculateLogType())
        })

}

/// Global function
/// debugOnly {
///   print("デバッグビルドでだけ実行される！")
/// }
func EXECUTE_DEBUG_ONLY(_ block: () -> Void) {
#if DEBUG
    block()
#endif
}
