import ArgumentParser

struct DraftOleCLI: ParsableCommand {
    static let configuration = CommandConfiguration(
        abstract: "🛠️ DraftOle CLI ツール",
        subcommands: [InitCommand.self],
        defaultSubcommand: InitCommand.self
    )
}
