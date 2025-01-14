# MegaParser

MegaParser is a powerful code analysis tool that helps you understand your codebase through various metrics and visualizations. It supports multiple programming languages and provides both CLI and web interfaces for easy usage.

## 📦 Repository Structure

```
mega-parser/
├── apps/
│   └── web/          # Web interface for MegaParser
├── packages/
│   ├── cli/          # Command-line interface
│   ├── mega-parser/  # Core analysis engine
│   └── mega-parser-perf/ # Performance testing utilities
```

## 🚀 Features

- Multi-language support (Java, TypeScript, Kotlin, and more)
- Multiple analysis metrics:
  - Real Lines of Code (RLOC)
  - Sonar Complexity
- Multiple export formats:
  - Simple JSON
  - CodeCharta JSON (for visualization)
- File filtering capabilities:
  - Respect .gitignore rules
  - Custom exclude patterns
- Both CLI and web interfaces
- Real-time language statistics and file analysis

## 📋 Prerequisites

- [Bun](https://bun.sh/) >= 1.0.0
- Node.js >= 18

## 🛠️ Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/mega-parser.git
cd mega-parser
```

2. Install dependencies:
```bash
bun install
```

3. Build all packages:
```bash
bun run build
```

## 📦 Packages

### Core Package (`packages/mega-parser`)
The core analysis engine that powers both the CLI and web interface.

Features:
- Language detection
- Metric calculation
- Export generation
- File processing

### CLI Tool (`packages/cli`)
A command-line interface for running MegaParser.

Usage:
```bash
# Interactive mode
bun run dev

# Direct command mode
bun run dev --path "./src" --metrics RealLinesOfCode,SonarComplexity --exporters SimpleJson,CodeChartaJson
```

Options:
- `--path`: Path to file or directory to analyze
- `--metrics`: Comma-separated list of metrics (RealLinesOfCode, SonarComplexity)
- `--exporters`: Comma-separated list of exporters (SimpleJson, CodeChartaJson)
- `--no-ignore`: Disable .gitignore functionality
- `--exclude`: Comma-separated list of glob patterns to exclude

### Web Interface (`apps/web`)
A modern web application for using MegaParser with a graphical interface.

Features:
- File/directory selection
- Real-time statistics
- Language distribution visualization
- Configurable file filtering
- Multiple export formats
- Interactive metric selection

To run the web interface:
```bash
cd apps/web
bun run dev
```

## 🧪 Development

1. Start all packages in development mode:
```bash
bun run dev
```

2. Run style checks:
```bash
bun run style
```

3. Fix style issues:
```bash
bun run style:fix
```

## 🔧 Configuration

### File Filtering
Both CLI and web interface support:
- .gitignore rules (enabled by default)
- Custom exclude patterns
- Default ignores: node_modules, .git, etc.

### Supported Languages
- Java
- TypeScript
- Kotlin
- CSS
- HTML
- SCSS
- JSON
- YAML
- XML
- Markdown
- Text files

## 📄 License

[Add your license here]

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
