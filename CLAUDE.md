# Claude Code Guidelines

## Project Overview

**tessellation** is a Rust library for generating triangle meshes from implicit functions (signed distance fields) using Manifold Dual Contouring. It produces guaranteed 2-manifold triangle meshes with sharp feature preservation.

- **Language**: Rust (library), TypeScript (demo), WebAssembly (bridge)
- **Build**: `cargo build`, `cargo test`
- **Demo**: `bun run dev` (builds WASM + starts Vite dev server)
- **Repository**: https://github.com/larsbrubaker/tessellation

## Philosophy

**YAGNI** - Don't build features until needed. Write the simplest code that works today.

**Circumstances alter cases** - Use judgment. There are no rigid rules—context determines the right approach.

**Quality through iterations** - Start fast and simple, then improve to meet actual needs. Code that doesn't matter can be quick and dirty. But code that matters *really* matters—treat it with respect and improve it meticulously.

## Test-First Bug Fixing (Critical Practice)

**This is the single most important practice for agent performance and reliability.**

When a bug is reported, always follow this workflow:

1. **Write a reproducing test first** - Create a test that fails, demonstrating the bug
2. **Fix the bug** - Make the minimal change needed to address the issue
3. **Verify via passing test** - The previously failing test should now pass

This approach works because:
- The failing test proves you understand the bug
- The fix is verifiable, not just "looks right"
- You can't accidentally break it again (regression protection)
- It aligns with the principle that coding is high-leverage because it's **partially verifiable**

**Do not skip the reproducing test.** Even if the fix seems obvious, the test validates your understanding and prevents regressions.

## Testing

- Run tests: `cargo test`
- Tests live in `#[cfg(test)]` modules within source files
- Tests MUST test actual production code, not copies
- Tests should run as fast as possible—fast tests get run more often
- Write tests for regressions and complex logic
- Avoid redundant tests that verify the same behavior
- All tests must pass before merging
- When test failures occur, use the fix-test-failures agent (`.claude/agents/fix-test-failures.md`) — it treats all failures as real bugs and resolves them through instrumentation and root cause analysis, never by weakening tests

## Code Quality

**Formatting** - Run `cargo fmt` before committing. Follow `rustfmt.toml` settings.

**Linting** - Run `cargo clippy` and address warnings.

**Names** - Choose carefully. Good names make code self-documenting.

**Comments** - Explain *why*, not *what*. The code shows what it does; comments should reveal intent, tradeoffs, and non-obvious reasoning.

**Refactoring** - Improve code when it serves a purpose, not for aesthetics. Refactor to fix bugs, add features, or improve clarity when you're already working in that area.

## Skills and Agents

Always check for an applicable skill or agent before starting a task. Skills (`.claude/skills/`) and agents (`.claude/agents/`) encode proven workflows and domain knowledge — use them instead of improvising from scratch.

## Shell: PowerShell on Windows

This project develops on Windows. Use PowerShell syntax, not bash. Do NOT use bash heredoc syntax (`<<'EOF'`). Use PowerShell string variables with backtick-n for newlines:

```powershell
$msg = "Subject line`n`nBody text"; git commit -m $msg
```
