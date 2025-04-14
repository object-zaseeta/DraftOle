# DraftOle
swift to {js, html, css } = web

  
DraftOle is a Swift-based CLI tool and library designed to generate project templates with optional HTML, CSS, and JS files. It's ideal for kickstarting web-based Swift projects.

---

## Features
- Swift CLI to initialize a new project structure
- Optional HTML template generation
- Reusable as a Swift library in other projects
- Clean integration with Swift Package Manager (SPM)

---

## Getting Started

### Prerequisites
- Swift 5.9+
- macOS 12 or later

### 1. Clone DraftOle
```bash
cd ~/Projects
git clone https://github.com/MY_REPO_NAME/DraftOle.git
```

### 2. Run the CLI
```bash
cd DraftOle
swift run draftole init --name YOUR_PROJECT_NAME [--output-dir PATH]
```

#### Example:
```bash
swift run draftole init --name YOUR_PROJECT_NAME --with-html-template
```

This will create a new SwiftPM project named `YOUR_PROJECT_NAME`, with an optional `dist/` folder containing `index.html`, `style.css`, and `script.js`.

---

## Using DraftOle as a Library

1. Move or keep the `DraftOle` directory outside of the consuming project:
```
Projects/
├── DraftOle/
└── YOUR_PROJECT_NAME/
```

2. In `YOUR_PROJECT_NAME/Package.swift`, add:
```swift
.package(path: "../DraftOle")
```

And in the target dependencies:
```swift
.dependencies: ["DraftOle"]
```

3. Use it in your `main.swift`:
```swift
import DraftOle

let ole = DraftOle()
ole.write("<h1>Hello!</h1>", to: "index.html")
```

4. To build and run:
 ```bash
swift build
swift run
```

---

## Editor Support

### Xcode
Use `xed .` inside the project directory to open it correctly as a Swift Package:
```bash
cd YOUR_PROJECT_NAME
xed .
```

### Visual Studio Code (VSCode)
To enable Swift support in VSCode:

1. Install the extension:
   - Name: `SourceKit-LSP - Unofficial CI build`
   - Publisher: Pavel Vasek

2. Create or update `.vscode/settings.json`:
```json
{
  "sourcekit-lsp.serverPath": "/usr/bin/sourcekit-lsp"
}
```

3. Restart VSCode and open your project folder (`YOUR_PROJECT_NAME`).

---

## Troubleshooting

### Problem: `No such module 'DraftOle'`
- Ensure DraftOle is outside the client project directory
- Use `xed .` to open Xcode correctly
- VSCode users must ensure SourceKit-LSP is installed and configured

### Problem: Build succeeds but no files are generated
- Confirm `DraftOleGenerator` is being called in `main.swift`
- Use `print()` statements for verification

---

## License
MIT

