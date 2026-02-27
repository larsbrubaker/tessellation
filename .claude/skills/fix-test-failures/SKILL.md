---
name: fix-test-failures
description: "This skill should be used after running cargo test when failures occur. It ensures test failures are properly diagnosed through instrumentation and root cause analysis until the root cause is found and fixed. The skill treats all test failures as real bugs that must be resolved, never skipped."
---

# Fix Test Failures

This skill provides a systematic approach to diagnosing and fixing test failures. The core philosophy is that **test failures are real bugs** — they must be understood and fixed, never ignored or worked around.

## NO CHEATING

**Every test exists because it validates behavior that users depend on. Bypassing tests means shipping broken software.**

**Forbidden actions (no exceptions):**
- Weakening assertions to make tests pass
- Changing expected values to match broken behavior
- Increasing epsilon tolerances to hide precision bugs
- Adding `#[ignore]` to skip failing tests
- Removing tests to make the suite pass
- Using `unwrap_or_default()` to silently swallow errors

**The only acceptable outcome is fixing the actual bug in the production code.**

## When to Use This Skill

Use this skill when:
- `cargo test` fails and the cause isn't immediately obvious
- A test is intermittently failing
- You need to understand why a test is failing before fixing it
- You've made changes and tests are now failing

## Test Failure Resolution Process

### Step 1: Run Tests and Capture Failures

Run the failing test(s) to see the current error:

```bash
# Run all tests
cargo test

# Run a specific test
cargo test test_name -- --nocapture

# Run tests in a specific module with full output
cargo test module_name -- --nocapture

# Run with backtrace for panics
RUST_BACKTRACE=1 cargo test test_name -- --nocapture
```

Record the exact error message and stack trace. This is your starting point.

### Step 2: Analyze the Failure

Before adding instrumentation:
1. Read the test code carefully
2. Identify what assertion is failing
3. Note what values were expected vs. received
4. Form a hypothesis about what might be wrong

### Step 3: Add Strategic Instrumentation

Add `println!` or `dbg!` statements to expose state at key points.

**For value-related failures:**
```rust
println!("Value at point: {}", function.value(&point));
println!("Expected: {}, Got: {}", expected, actual);
```

**For mesh-related failures:**
```rust
println!("Vertices: {}, Faces: {}", mesh.vertices.len(), mesh.faces.len());
dbg!(&mesh.vertices[0..5.min(mesh.vertices.len())]);
```

**For algorithm flow:**
```rust
println!("Entering octree node at depth {}", depth);
println!("Edge crossings found: {}", crossings.len());
```

### Step 4: Run Instrumented Tests

Run the test again with output capture disabled:

```bash
cargo test test_name -- --nocapture
```

Analyze the output to understand:
- What values are actually present
- Where the execution diverges from expectations
- What state is incorrect and when it became incorrect

### Step 5: Identify Root Cause

Based on instrumentation output, determine:
- Is the test wrong (rare — only if test assumptions were incorrect)?
- Is the code under test wrong (common)?
- Is there a floating-point precision issue?
- Is there a concurrency issue with Rayon parallel processing?

### Step 6: Fix the Bug

Fix the actual bug in the production code, not by modifying the test.

Common fixes in this project:
- **Numerical precision**: Use appropriate epsilon values, avoid catastrophic cancellation
- **Algorithm errors**: Fix octree traversal, QEF minimization, or edge crossing logic
- **Topology issues**: Ensure manifold guarantees are maintained
- **Bounding box errors**: Verify SDF bounding boxes contain the entire shape

### Step 7: Verify and Clean Up

1. Run the test again to confirm it passes
2. Run the full test suite to ensure no regressions: `cargo test`
3. **Remove all instrumentation** (`println!`, `dbg!`) — they were for debugging only
4. Report the fix

## Iterative Debugging

If the first round of instrumentation doesn't reveal the issue:

1. Add more instrumentation at earlier points in execution
2. Log intermediate values, not just final state
3. Check for side effects from parallel processing (try running with `RAYON_NUM_THREADS=1`)
4. Verify that SDF primitives return correct values at boundary points
5. Check for off-by-one errors in grid indexing

Keep iterating until the root cause is clear. The goal is understanding, then fixing.
