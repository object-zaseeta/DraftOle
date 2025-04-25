# DraftOle

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

