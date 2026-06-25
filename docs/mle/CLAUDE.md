# MLE — Knowledge Index

MLE installs a complete knowledge layer into this project. Use this file
as a map to everything MLE provides and where to learn more.

## What MLE Provides

| Component | Location                | Purpose                                                     |
| --------- | ----------------------- | ----------------------------------------------------------- |
| Rules     | `.claude/rules/`        | Code standards, testing, security, git policy (path-scoped) |
| Skills    | `.claude/skills/`       | Workflow automation for SDLC phases (intent-triggered)      |
| Agents    | `.claude/agents/`       | Specialist agents for review, analysis, infrastructure      |
| Hooks     | `.claude/settings.json` | Post-write linting, skill activation hooks                  |
| Git hooks | `.githooks/`            | Pre-push branch protection, commit message validation       |
| Settings  | `.claude/settings.json` | Claude Code harness configuration                           |

## Key Skills

These are the most-used MLE skills. Invoke them by describing what you
want to do — Claude Code matches by intent.

| Skill          | When to use                                           |
| -------------- | ----------------------------------------------------- |
| `mle-work`     | Start work on an ADO work item end-to-end             |
| `mle-sync`     | Commit and push work from current workspace           |
| `mle-pr`       | Create or check the status of a pull request          |
| `mle-complete` | Clean up a workspace after PR merge                   |
| `mle-doctor`   | Health check all workspaces for staleness or drift    |
| `mle-req`      | Generate user stories from a PRD or requirements doc  |
| `mle-design`   | Generate ADRs, architecture diagrams, threat models   |
| `mle-test-gen` | Generate unit, integration, and BDD tests             |
| `mle-capture`  | Save a key decision or milestone to the ADO work item |
| `forge`        | Run a multi-agent FORGE orchestrator                  |

## Wiki Documentation

Base URL: `https://dev.azure.com/project-troy/ai-sdlc-tooling/_wiki/wikis/ai-sdlc-tooling.wiki`

### Getting Started

| Topic                   | Wiki path                                  |
| ----------------------- | ------------------------------------------ |
| Installation            | `/MLE-CLI/Getting-Started/Installation`    |
| Quick start             | `/MLE-CLI/Getting-Started/Quick-Start`     |
| Onboarding              | `/MLE-CLI/Getting-Started/Onboarding`      |
| Which command to use    | `/MLE-CLI/Getting-Started/Which-Command`   |
| Maturity levels (L1–L5) | `/MLE-CLI/Getting-Started/Maturity-Levels` |

### User Guides

| Topic               | Wiki path                                  |
| ------------------- | ------------------------------------------ |
| Requirements engine | `/MLE-CLI/User-Guides/Requirements-Engine` |
| Design engine       | `/MLE-CLI/User-Guides/Design-Engine`       |
| Design coverage     | `/MLE-CLI/User-Guides/Design-Coverage`     |
| Estimation          | `/MLE-CLI/User-Guides/Estimation`          |
| Traceability        | `/MLE-CLI/User-Guides/Traceability`        |
| Test generation     | `/MLE-CLI/User-Guides/Test-Generation`     |
| Security scanning   | `/MLE-CLI/User-Guides/Security-Scanning`   |
| Phase gates         | `/MLE-CLI/User-Guides/Phase-Gates`         |
| Feedback loops      | `/MLE-CLI/User-Guides/Feedback-Loops`      |
| Impact and risk     | `/MLE-CLI/User-Guides/Impact-Risk`         |
| End-to-end workflow | `/MLE-CLI/User-Guides/End-to-End-Workflow` |
| Seeds               | `/MLE-CLI/User-Guides/Seeds`               |
| Evolve              | `/MLE-CLI/User-Guides/Evolve`              |

### Workspace

| Topic                     | Wiki path                                    |
| ------------------------- | -------------------------------------------- |
| Developer workflow        | `/MLE-CLI/Workspace/Developer-Workflow`      |
| Strategy engine           | `/MLE-CLI/Workspace/Strategy-Engine`         |
| Config reference          | `/MLE-CLI/Workspace/Config-Reference`        |
| Claude Code integration   | `/MLE-CLI/Workspace/Claude-Code-Integration` |
| Workspace troubleshooting | `/MLE-CLI/Workspace/Troubleshooting`         |

### Reference

| Topic                 | Wiki path                                  |
| --------------------- | ------------------------------------------ |
| CLI reference         | `/MLE-CLI/Reference/CLI-Reference`         |
| Architecture          | `/MLE-CLI/Reference/Architecture`          |
| Configuration         | `/MLE-CLI/Reference/Configuration`         |
| Skills overview       | `/MLE-CLI/Reference/Skills-Overview`       |
| Progressive discovery | `/MLE-CLI/Reference/Progressive-Discovery` |
| Knowledge rules       | `/MLE-CLI/Reference/Knowledge-Rules`       |
| Wiki sync             | `/MLE-CLI/Reference/Wiki-Sync`             |

### Token Tracking

| Topic               | Wiki path                                     |
| ------------------- | --------------------------------------------- |
| ADR                 | `/MLE-CLI/Token-Tracking/ADR-Token-Tracking`  |
| CLI usage guide     | `/MLE-CLI/Token-Tracking/CLI-Usage-Guide`     |
| Configuration guide | `/MLE-CLI/Token-Tracking/Configuration-Guide` |
| MLE HUD guide       | `/MLE-CLI/Token-Tracking/MLE-HUD-Guide`       |

### QuintGov

| Topic                            | Wiki path                                                 |
| -------------------------------- | --------------------------------------------------------- |
| Overview                         | `/MLE-CLI/QuintGov/Overview`                              |
| Getting started                  | `/MLE-CLI/QuintGov/Getting-Started`                       |
| Integration architecture         | `/MLE-CLI/QuintGov/Integration-Architecture`              |
| Design document                  | `/MLE-CLI/QuintGov/Design-Document`                       |
| Governance overview              | `/MLE-CLI/QuintGov/Wiki/Governance-Overview`              |
| Formal verification fundamentals | `/MLE-CLI/QuintGov/Wiki/Formal-Verification-Fundamentals` |
| Quint language guide             | `/MLE-CLI/QuintGov/Wiki/Quint-Language-Guide`             |
| DORA regulatory mapping          | `/MLE-CLI/QuintGov/Wiki/DORA-Regulatory-Mapping`          |
| EU AI Act regulatory mapping     | `/MLE-CLI/QuintGov/Wiki/EU-AI-Act-Regulatory-Mapping`     |
| Solvency II regulatory mapping   | `/MLE-CLI/QuintGov/Wiki/Solvency-II-Regulatory-Mapping`   |
| Eight governance patterns        | `/MLE-CLI/QuintGov/Wiki/Eight-Governance-Patterns`        |
| Three-layer verification stack   | `/MLE-CLI/QuintGov/Wiki/Three-Layer-Verification-Stack`   |
| MLE integration architecture     | `/MLE-CLI/QuintGov/Wiki/MLE-Integration-Architecture`     |

### Watcher

| Topic                   | Wiki path                                  |
| ----------------------- | ------------------------------------------ |
| Overview                | `/MLE-CLI/Watcher/Overview`                |
| Configuration reference | `/MLE-CLI/Watcher/Configuration-Reference` |
| Plugins                 | `/MLE-CLI/Watcher/Plugins`                 |
| Watcher troubleshooting | `/MLE-CLI/Watcher/Troubleshooting`         |

### Troubleshooting

| Topic                 | Wiki path                                |
| --------------------- | ---------------------------------------- |
| Common issues         | `/MLE-CLI/Troubleshooting/Common-Issues` |
| Installation problems | `/MLE-CLI/Troubleshooting/Installation`  |

## For More

| If you want to understand…          | Read…                                      |
| ----------------------------------- | ------------------------------------------ |
| How rules are loaded by Claude Code | `/MLE-CLI/Reference/Progressive-Discovery` |
| All 13 scaffold rules documented    | `/MLE-CLI/Reference/Knowledge-Rules`       |
| All 46 skills with commands         | `/MLE-CLI/Reference/Skills-Overview`       |
| How `mle init` scaffolds a project  | `/MLE-CLI/Reference/Architecture`          |
| Clone vs worktree decision logic    | `/MLE-CLI/Workspace/Strategy-Engine`       |
| Cost attribution for AI sessions    | `/MLE-CLI/Token-Tracking/CLI-Usage-Guide`  |
| Formal verification (Quint / DORA)  | `/MLE-CLI/QuintGov/Overview`               |
| Background file monitoring          | `/MLE-CLI/Watcher/Overview`                |

---

_Generated by `mle init` — edit freely._
