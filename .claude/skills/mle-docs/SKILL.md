---
name: mle-docs
description: 'Surface MLE documentation and wiki references by topic.'
type: rigid
archetype: reference
priority: medium
maturity: L2
keywords:
  - 'documentation'
  - 'docs'
  - 'wiki'
  - 'where is'
  - 'how does'
  - 'reference'
  - 'learn about'
  - 'find the guide'
  - 'mle docs'
intent_patterns:
  - "(where|how)\\s+(is|does|can I find)\\s+"
  - "(show|find|get)\\s+(me\\s+)?(the\\s+)?(docs|documentation|wiki|guide)"
  - "(learn|read)\\s+about\\s+"
---

# MLE Docs

Surface the right documentation or wiki URL for any MLE topic.

## When to Use

Invoke this skill when the user asks about documentation, wiki pages, "where is X",
"how does X work", or wants a reference link for any MLE feature.

## Wiki Base URL

`https://dev.azure.com/project-troy/ai-sdlc-tooling/_wiki/wikis/ai-sdlc-tooling.wiki`

Append the wiki path below to construct the full URL.

## Wiki Map

### Getting Started

| Topic           | Wiki Path                                  |
| --------------- | ------------------------------------------ |
| Installation    | `/MLE-CLI/Getting-Started/Installation`    |
| Quick Start     | `/MLE-CLI/Getting-Started/Quick-Start`     |
| Onboarding      | `/MLE-CLI/Getting-Started/Onboarding`      |
| Which Command   | `/MLE-CLI/Getting-Started/Which-Command`   |
| Maturity Levels | `/MLE-CLI/Getting-Started/Maturity-Levels` |

### User Guides

| Topic               | Wiki Path                                  |
| ------------------- | ------------------------------------------ |
| Requirements Engine | `/MLE-CLI/User-Guides/Requirements-Engine` |
| Design Engine       | `/MLE-CLI/User-Guides/Design-Engine`       |
| Design Coverage     | `/MLE-CLI/User-Guides/Design-Coverage`     |
| Estimation          | `/MLE-CLI/User-Guides/Estimation`          |
| Traceability        | `/MLE-CLI/User-Guides/Traceability`        |
| Test Generation     | `/MLE-CLI/User-Guides/Test-Generation`     |
| Security Scanning   | `/MLE-CLI/User-Guides/Security-Scanning`   |
| Phase Gates         | `/MLE-CLI/User-Guides/Phase-Gates`         |
| Feedback Loops      | `/MLE-CLI/User-Guides/Feedback-Loops`      |
| Impact and Risk     | `/MLE-CLI/User-Guides/Impact-Risk`         |
| End-to-End Workflow | `/MLE-CLI/User-Guides/End-to-End-Workflow` |
| Seeds               | `/MLE-CLI/User-Guides/Seeds`               |
| Evolve              | `/MLE-CLI/User-Guides/Evolve`              |

### Workspace

| Topic                     | Wiki Path                                    |
| ------------------------- | -------------------------------------------- |
| Developer Workflow        | `/MLE-CLI/Workspace/Developer-Workflow`      |
| Strategy Engine           | `/MLE-CLI/Workspace/Strategy-Engine`         |
| Config Reference          | `/MLE-CLI/Workspace/Config-Reference`        |
| Claude Code Integration   | `/MLE-CLI/Workspace/Claude-Code-Integration` |
| Workspace Troubleshooting | `/MLE-CLI/Workspace/Troubleshooting`         |

### Reference

| Topic           | Wiki Path                            |
| --------------- | ------------------------------------ |
| CLI Reference   | `/MLE-CLI/Reference/CLI-Reference`   |
| Architecture    | `/MLE-CLI/Reference/Architecture`    |
| Configuration   | `/MLE-CLI/Reference/Configuration`   |
| Skills Overview | `/MLE-CLI/Reference/Skills-Overview` |

### Token Tracking

| Topic               | Wiki Path                                     |
| ------------------- | --------------------------------------------- |
| ADR                 | `/MLE-CLI/Token-Tracking/ADR-Token-Tracking`  |
| CLI Usage Guide     | `/MLE-CLI/Token-Tracking/CLI-Usage-Guide`     |
| Configuration Guide | `/MLE-CLI/Token-Tracking/Configuration-Guide` |
| MLE HUD Guide       | `/MLE-CLI/Token-Tracking/MLE-HUD-Guide`       |

### QuintGov

| Topic                            | Wiki Path                                            |
| -------------------------------- | ---------------------------------------------------- |
| Introduction                     | `/MLE-CLI/QuintGov/Introduction`                     |
| Governance Overview              | `/MLE-CLI/QuintGov/Governance-Overview`              |
| Formal Verification Fundamentals | `/MLE-CLI/QuintGov/Formal-Verification-Fundamentals` |
| Quint Language Guide             | `/MLE-CLI/QuintGov/Quint-Language-Guide`             |
| Eight Governance Patterns        | `/MLE-CLI/QuintGov/Eight-Governance-Patterns`        |
| DORA Regulatory Mapping          | `/MLE-CLI/QuintGov/DORA-Regulatory-Mapping`          |
| EU AI Act Regulatory Mapping     | `/MLE-CLI/QuintGov/EU-AI-Act-Regulatory-Mapping`     |
| Solvency II Regulatory Mapping   | `/MLE-CLI/QuintGov/Solvency-II-Regulatory-Mapping`   |
| Three-Layer Verification Stack   | `/MLE-CLI/QuintGov/Three-Layer-Verification-Stack`   |
| MLE Integration Architecture     | `/MLE-CLI/QuintGov/MLE-Integration-Architecture`     |
| Design Document                  | `/MLE-CLI/QuintGov/Design-Document`                  |

### Watcher

| Topic                   | Wiki Path                                  |
| ----------------------- | ------------------------------------------ |
| Overview                | `/MLE-CLI/Watcher/Overview`                |
| Configuration Reference | `/MLE-CLI/Watcher/Configuration-Reference` |
| Plugins                 | `/MLE-CLI/Watcher/Plugins`                 |
| Watcher Troubleshooting | `/MLE-CLI/Watcher/Troubleshooting`         |

### Troubleshooting

| Topic         | Wiki Path                                |
| ------------- | ---------------------------------------- |
| Common Issues | `/MLE-CLI/Troubleshooting/Common-Issues` |
| Installation  | `/MLE-CLI/Troubleshooting/Installation`  |

## Local Docs Map

| Topic                                 | Local Path              |
| ------------------------------------- | ----------------------- |
| Getting started                       | `docs/getting-started/` |
| User guides                           | `docs/user-guides/`     |
| Workspace strategy                    | `docs/workspace/`       |
| Token tracking                        | `docs/token-tracking/`  |
| QuintGov                              | `docs/quintgov/`        |
| Watcher plugins                       | `docs/watcher/`         |
| Reference (CLI, arch, config, skills) | `docs/reference/`       |
| Troubleshooting                       | `docs/troubleshooting/` |

## Instructions

1. Identify the topic from the user's question (keyword or intent match).
2. Match to the closest section and row in the wiki map above.
3. Construct the full URL: `<base URL><wiki path>`.
4. Provide the URL and a one-sentence description of what the page covers.
5. If the topic spans multiple sections, list all relevant pages.
6. For local exploration, point to the `docs/` path alongside the wiki URL.
