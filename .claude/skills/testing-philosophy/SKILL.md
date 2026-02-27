---
name: testing-philosophy
description: "This skill provides guidance on writing and running tests in this project. It should be used when writing new tests, understanding the test infrastructure, or making decisions about what to test. Covers Rust unit tests with cargo test and testing best practices."
---

# Testing Philosophy

This skill documents the testing approach and infrastructure for the tessellation project.

## Test Runner: cargo test

```bash
# Run all tests
cargo test

# Run with verbose output
cargo test -- --nocapture

# Run a specific test by name
cargo test test_sphere_mesh

# Run tests in a specific module
cargo test manifold_dual_contouring::tests

# Run tests matching a pattern
cargo test qef

# Run only doc tests
cargo test --doc

# Run tests with all features
cargo test --all-features
```

## Test Organization

Tests live alongside production code in `#[cfg(test)]` modules:

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_feature_works() {
        // Arrange, Act, Assert
    }
}
```

**Test files with tests:**
- `src/lib.rs` — Integration tests for the public API
- `src/manifold_dual_contouring.rs` — Core algorithm tests
- `src/qef.rs` — Quadratic Error Function tests
- `src/mesh.rs` — Mesh data structure tests
- `src/vertex_index.rs` — Vertex indexing tests
- `src/cell_configs.rs` — Cell configuration tests
- `src/bitset.rs` — Bit manipulation tests

## Core Testing Principles

### Speed Matters

Tests should run as fast as possible. Fast tests get run more often, which means faster feedback and fewer bugs reaching production.

- Use small resolutions and simple shapes for mesh generation tests
- Avoid testing with unnecessarily high-resolution grids
- Keep test data minimal

### Test What Matters

Write tests for:
- Regressions (bugs that were fixed — prevent them from returning)
- Complex logic (QEF minimization, octree traversal, edge cases)
- SDF primitive correctness (sign, distance, normal accuracy)
- CSG operation correctness
- Mesh topology guarantees (manifold, watertight)

Avoid:
- Redundant tests that verify the same behavior
- Tests for trivial code
- Tests that just verify library behavior (nalgebra, etc.)

### Test Failures Are Real Bugs (No Cheating)

**Every test failure indicates a real bug in the production code.** There are no workarounds.

When a test fails:

1. Investigate the failure
2. Add `println!` or `dbg!` statements to understand what's happening
3. Find and fix the root cause in production code
4. Never weaken or skip tests to make them pass

**Forbidden actions:**
- Weakening assertions or changing expected values
- Using `#[ignore]` as a permanent solution
- Removing tests to make the suite pass
- Increasing epsilon tolerances to hide precision bugs

See the `fix-test-failures` skill for the detailed debugging process.

## Rust Testing Patterns

### Using `approx` for floating-point comparisons

```rust
use approx::assert_relative_eq;

#[test]
fn test_sphere_distance() {
    let sphere = Sphere::new(1.0);
    let point = na::Point3::new(2.0, 0.0, 0.0);
    assert_relative_eq!(sphere.value(&point), 1.0, epsilon = 1e-10);
}
```

### Testing mesh properties

```rust
#[test]
fn test_mesh_is_manifold() {
    let sphere = sdf::Sphere::new(1.0);
    let mut mdc = ManifoldDualContouring::new(&sphere, 0.1, 0.1);
    let mesh = mdc.tessellate().unwrap();

    assert!(!mesh.vertices.is_empty());
    assert!(!mesh.faces.is_empty());
    // Verify all face indices are valid
    for face in &mesh.faces {
        assert!(face.x < mesh.vertices.len());
        assert!(face.y < mesh.vertices.len());
        assert!(face.z < mesh.vertices.len());
    }
}
```

## Bug Fix Workflow: Failing Test First

**When fixing a bug, always write a failing test before writing the fix.**

This approach:
1. Proves the bug exists and is reproducible
2. Ensures you understand the actual problem
3. Verifies your fix actually works
4. Prevents the bug from returning (regression protection)

**The process:**
1. Reproduce the bug manually to understand it
2. Write a test that fails because of the bug
3. Run the test to confirm it fails (red)
4. Fix the bug in production code
5. Run the test to confirm it passes (green)
6. Commit both the test and the fix together
