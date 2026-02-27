Add, commit, and push all pending changes. Follow these steps in order:

## 1. Clean up
- Delete any temporary scripts, scratch files, or generated artifacts that were created during this session.
- Add any files we want to keep but should never check in to `.gitignore`.

## 2. Run checks
- Run `cargo fmt --check` — if it fails, run `cargo fmt` to auto-fix.
- Run `cargo clippy -- -D warnings` — fix any warnings.
- Run `cargo test` — if tests fail, diagnose and fix the root cause (never weaken tests).

## 3. Review before staging
- Run `git status` to see all changes.
- Never stage sensitive files (`.env`, credentials, API keys, secrets).
- Stage files by name rather than using `git add -A` or `git add .`.

## 4. Commit
- Write a concise commit message that explains the *why*, not just the *what*.
- All work is done on `main`. Push directly to `origin/main`.
- If the pre-commit hook fails, fix the underlying code (not the tests), re-stage, and create a NEW commit — do not amend.

## 5. Push
- Push `main` to `origin`.
- After pushing, verify `git status` shows a clean working tree with no unstaged changes.

## 6. Monitor deployment
- Use `gh.exe run list --branch main` to find the triggered workflow run.
- Poll with `gh.exe run watch <run-id>` to monitor progress.
- If the deployment tests fail or the deployment does not succeed, investigate the failure logs with `gh.exe run view <run-id> --log-failed` and fix the issue.

## Shell: PowerShell on Windows
Do NOT use bash heredoc syntax (`<<'EOF'`). Use PowerShell string variables with backtick-n for newlines:

```powershell
$msg = "Subject line`n`nBody text"; git commit -m $msg
```
