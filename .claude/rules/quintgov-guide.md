# QuintGov Guide

**Path scope**: `specs/**`, `patterns/**`, `.quintgov/**`, `**/*.qnt`

QuintGov applies Quint temporal logic specifications to verify that governance processes satisfy regulatory requirements. MLE integrates by reading QuintGov state (`.quintgov/`) and providing enhanced lifecycle management.

## Quint Language Quick Reference

| Concept        | Syntax                                | Purpose                                          |
| -------------- | ------------------------------------- | ------------------------------------------------ |
| Module         | `module Name { ... }`                 | Top-level container for specifications           |
| Constant       | `const DEADLINE: int`                 | Parameterises modules for reuse                  |
| Type           | `type Phase = Idle \| Active \| Done` | Sum types enumerate valid states                 |
| Variable       | `var phase: Phase`                    | Mutable state tracked across transitions         |
| Action         | `action activate = all { ... }`       | State transition with guards and updates         |
| Invariant      | `val safetyInv = ...`                 | Property that must hold in every reachable state |
| Prime notation | `phase' = Active`                     | Denotes the value in the next step               |
| Combinators    | `all { ... }` / `any { ... }`         | Conjunction (all guards) / disjunction (choice)  |
| Temporal       | `always(inv)` / `eventually(prop)`    | Safety and liveness properties                   |

## Eight Governance Patterns

| #   | Pattern                 | Parameters                                                   | When to use                              | Regulatory example                        |
| --- | ----------------------- | ------------------------------------------------------------ | ---------------------------------------- | ----------------------------------------- |
| 1   | Timed Workflow          | `DEADLINE`, `ESCALATION_THRESHOLD`                           | Steps with statutory time bounds         | DORA Art. 19 notification deadlines       |
| 2   | Approval Chain          | `REQUIRED_APPROVALS`                                         | Multi-party sign-off, four-eyes          | DORA Art. 5 management body approval      |
| 3   | Classification Cascade  | `THRESHOLD_COUNT`, `MANDATORY_CRITERION`                     | Multi-criteria categorisation            | DORA Art. 18 incident classification      |
| 4   | Continuous Monitoring   | `WARNING_THRESHOLD`, `CRITICAL_THRESHOLD`, `SAMPLE_INTERVAL` | Ongoing surveillance, metric tracking    | DORA Art. 8-12 ICT risk monitoring        |
| 5   | Trigger-Response        | `RESPONSE_DEADLINE`, `CASCADES`                              | Event-triggered mandatory response       | EU AI Act Art. 73 incident notification   |
| 6   | Documentation Gate      | `REQUIRED_DOCS`                                              | Evidence required before progression     | DORA Art. 28(4) pre-contractual artefacts |
| 7   | Concentration Threshold | `MAX_CONCENTRATION`, `PER_ENTITY_LIMIT`                      | Aggregate exposure limits                | DORA Art. 28-30 third-party ICT risk      |
| 8   | Review Cycle            | `STANDARD_PERIOD`, `ACCELERATED_PERIOD`                      | Periodic reviews with event acceleration | DORA Art. 5-7 annual ICT risk review      |

Patterns are parameterised and composable via Quint's `import` mechanism. Real workflows combine 2-4 patterns.

## Verification Commands

| Command                       | Purpose                                                     |
| ----------------------------- | ----------------------------------------------------------- |
| `quint typecheck specs/*.qnt` | Type-check specifications (fast, catches structural errors) |
| `quint run specs/main.qnt`    | Simulate random execution traces                            |
| `quint verify specs/main.qnt` | Exhaustive model checking via Apalache                      |

## MLE Commands

| Command                   | Purpose                                                         |
| ------------------------- | --------------------------------------------------------------- |
| `mle quintgov status`     | Show QuintGov project status (regulations, specs, verification) |
| `mle quintgov verify`     | Run Quint typecheck/verify and update status                    |
| `mle quintgov audit-pack` | Generate compliance audit package                               |

## Regulatory Frameworks

| Framework   | Key concern                                | Quint focus                                                   |
| ----------- | ------------------------------------------ | ------------------------------------------------------------- |
| DORA        | ICT risk management for financial entities | Incident lifecycle, third-party oversight, resilience testing |
| EU AI Act   | AI system risk management                  | Classification, conformity assessment, post-market monitoring |
| Solvency II | Insurance capital adequacy                 | ORSA continuous compliance, capital threshold monitoring      |

## Integration Principle

MLE reads, QuintGov writes. The QuintGov Claude Code plugin owns `.quintgov/status.json` and `.quintgov/config.toml`. MLE is a consumer only — it reads state to enhance the HUD, watcher, and strategy decisions.

## Detection Heuristics

MLE detects QuintGov projects at three levels (priority order):

1. **Canonical** — `.quintgov/config.toml` exists (full QuintGov plugin project)
2. **Simplified** — `quintgov.toml` in project root (lightweight config)
3. **Fallback** — any `.qnt` files found in the repository (minimal context)

Detection feeds into the Strategy Engine (factor 7: worktree nudge), the HUD (line 5: verification status), and the watcher (auto-typecheck on `.qnt` file changes).
