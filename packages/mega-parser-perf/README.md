# Mega-Parser Performance Comparison

This tool compares the performance of mega-parser and sonar-analysis on a set of test files in TypeScript and Kotlin.

## Prerequisites

- [Bun](https://bun.sh/) installed
- mega-parser CLI installed globally (`bun install -g mega-parser`)
- sonar-analysis CLI installed globally (`bun install -g sonar-analysis`)

## Installation

1. Install dependencies:
```bash
bun install
```

## Usage

Run the performance comparison:
```bash
bun start
```

The script will:
1. Run mega-parser and sonar-analysis on each test file
2. Compare and display the performance results

## Test Files

The comparison uses the following test files:

### TypeScript
- `test-files/typescript/simple.ts`: Basic functions (add, multiply)
- `test-files/typescript/complex.ts`: Generic LinkedList implementation

### Kotlin
- `test-files/kotlin/simple.kt`: Basic functions (add, multiply)
- `test-files/kotlin/complex.kt`: Generic LinkedList implementation

## Output

The script provides:
- Progress updates for each analysis
- Execution time for each tool and file
- Average execution time comparison
- Error reporting for failed analyses 