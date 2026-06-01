# Copilot instructions for PicoBlaze_in_JavaScript

## Quick commands
- Run the test suite: `npm test` (package.json uses `jest --verbose`).
- Run a single test file: `npx jest __tests__/parser.test.js` or `npm test -- __tests__/parser.test.js`.
- Run a single test case by name: `npx jest -t "test name substring"` or `npm test -- -t "test name substring"`.
- Node/npm compatibility: Node >= 16, npm >= 8 (see package.json `engines`).
- There are no dedicated `build` or `lint` scripts in package.json; tests use Babel and jsdom (babel-jest, jest-environment-jsdom).

## High-level architecture (big picture)
- Assembler pipeline follows a pipe-and-filter style: tokenizer → parser → preprocessor → assembler → machine code output.
- The parser constructs one large abstract syntax tree (AST) composed of TreeNode instances rather than many small trees.
- TreeNode.interpretAsArithmeticExpression(...) is a central API used by both the assembler and the preprocessor — changing its signature or semantics has wide ripple effects.
- The tokenizer is responsible for disambiguating `:` (label) vs `:` in the ternary operator `?:` — parser relies on that behavior.
- Emulator (simulator + viewer) uses a repository-like architecture for state, but the UI uses the DOM as authoritative state for coloring registers/flags. UI code is in `viewer.js` / `simulator.js` and interacts directly with DOM elements.
- Front-end usage: `PicoBlaze.html` contains URL configuration variables (`URL_of_JSON_with_examples` and `URL_prefix_of_the_examples`) that control where example programs are loaded from.

## Key conventions and gotchas
- Core modules are top-level JS files (e.g., `tokenizer.js`, `parser.js`, `preprocessor.js`, `assembler.js`, `TreeNode.js`, `simulator.js`, `viewer.js`). Tests live in `__tests__/` and expect a Jest + jsdom environment.
- AST is a single large tree. Refactors that break the expectation of a single-tree AST (or the presence of specific child node shapes) will likely break many tests and runtime flows.
- `TreeNode.interpretAsArithmeticExpression(constants, labels)` is used widely. When adding constants/labels handling, keep backward-compatible parameter semantics.
- Tokenizer-driven colon disambiguation: don't move that responsibility to the parser without verifying existing code paths — tests assume current behavior.
- UI/Viewer uses DOM-as-state patterns (elements and classes reflect recent changes). If extracting UI state into a separate data model, update viewer/simulator integration carefully.
- Tests use Babel transforms (babel-jest) and may rely on top-level exports/rewiring plugins present in devDependencies.
- Compatibility note: README highlights a desire to maintain compatibility with older Firefox (52). Some manual testing may be required for browser-facing changes.

## CI workflows
- GitHub Actions workflows present:
  - `.github/workflows/bun.yml` — Bun CI: sets up Bun, runs `bun install` and `bun test --timeout 60000` on push/PR to master.
  - `.github/workflows/master_picoblaze-simulator.yml` — Azure: builds and deploys the app to Azure Web Apps (PHP setup + artifact upload/deploy).
- Authoritative CI: `.github/workflows/bun.yml` is the authoritative CI for running tests. Prefer Bun when changing or adding tests; ensure tests pass under Bun for CI parity.
- Recommended local commands for parity with CI:
  - With Bun (preferred for CI parity): `bun install` then `bun test --timeout 60000`
  - With npm (fallback): `npm install` then `npm test` (uses jest)
- Note: CI uses Bun; if new tests rely on Node-specific features incompatible with Bun, update CI or provide a Node-based workflow.

## Existing documentation and AI configs
- Main project README contains architecture notes and historical context; consult it for diagrams and hosting notes (`PicoBlaze.html` config lines).
- No repository-specific AI assistant configs were found (CLAUDE.md, AGENTS.md, .cursorrules, .windsurfrules, CONVENTIONS.md, etc.).

---
If you'd like, configure an MCP server for browser testing (e.g., Playwright) or CI test automation. Would you like me to add a Playwright MCP server setup or a CI workflow for running tests? 

(End of file)
