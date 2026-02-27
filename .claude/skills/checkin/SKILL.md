---
name: checkin
description: "Automates the full commit workflow: analyzes changes, runs cargo fmt/clippy/test, stages files, commits, and handles failures by fixing issues until the commit succeeds. Use when the user wants to commit their changes."
---

# Checkin Skill

Automates the full commit workflow: analyzes changes, runs checks, stages files, commits, and handles failures until the commit succeeds.

## Workflow

### Step 1: Analyze Changes

Run these commands in parallel to understand the current state:

```bash
git status
git diff
git diff --staged
```

From this analysis:
- Identify what files changed and why
- Determine which files should be staged (exclude secrets, generated files, etc.)

### Step 2: Run Checks First

**CRITICAL: Always run all checks before committing.** This catches issues early and prevents failed commits.

```bash
# Check formatting
cargo fmt --check

# Run linting
cargo clippy -- -D warnings

# Run all tests
cargo test
```

If **formatting issues** are found:
1. Auto-fix with `cargo fmt`
2. Re-check

If **clippy warnings** are found:
1. Fix the reported issues
2. Re-run `cargo clippy -- -D warnings` to confirm

If **tests fail**:
1. **Do NOT proceed with the commit**
2. Use the `fix-test-failures` skill to diagnose and fix the failures
3. Re-run tests after fixes
4. Only proceed to staging when all checks pass

### Step 3: Stage and Commit

1. Stage relevant files using `git add` (stage by name, not `git add .`)
2. Write a commit message following this format:
   - **Subject line**: Imperative mood, max 50 chars, no period
   - **Body** (if needed): Blank line after subject, wrap at 72 chars, explain *why* not *what*
3. Commit using PowerShell syntax:

```powershell
$msg = "Subject line`n`nBody explaining why"; git commit -m $msg
```

### Step 4: Handle Failures

If the commit fails:

1. **Identify the failure type** from the output
2. **Fix the underlying issue** — never bypass with `--no-verify`
3. Re-stage and try again

### Step 5: Iterate Until Success

Repeat until the commit succeeds. Each iteration:
- Run the commit
- If it fails, fix the issues
- Try again

### Step 6: Confirm Success

After a successful commit:
- Run `git status` to verify the commit succeeded
- Report the commit hash and summary to the user

## Important Notes

- Do NOT push to remote — the user will handle that
- Do NOT commit files that contain secrets (.env, credentials, etc.)
- Do NOT use `--no-verify` to bypass hooks
- Do NOT weaken tests to make them pass — fix the actual bugs
- All work is done on `main`. Push directly to `origin/main`.
- Use PowerShell syntax (not bash) for commit messages

## Quality Commitment

**Fix every single error. No exceptions.**

When errors occur during the commit process:
- Do NOT skip errors or mark them as "known issues"
- Do NOT disable tests to make them pass
- Do NOT add workarounds that hide problems

Take the hard path — investigate root causes, fix underlying bugs, ensure correctness. Quality matters.
