# Testing Standards

**Path scope**: `tests/**`

## Coverage

- Coverage target: **90% fail_under** (configured in `pyproject.toml [tool.coverage.report]`)
- Run coverage: `python -m pytest --cov=mle --cov-report=term-missing tests/`

## Test Markers

| Marker                    | Purpose                              | Example                           |
| ------------------------- | ------------------------------------ | --------------------------------- |
| `@pytest.mark.unit`       | Pure unit tests                      | Logic in core/ modules            |
| `@pytest.mark.git`        | Tests needing real git repos         | Clone creation, branch operations |
| `@pytest.mark.ado`        | Tests with mocked ADO API            | Work item operations              |
| `@pytest.mark.cli`        | CLI integration tests                | Click CliRunner invocations       |
| `@pytest.mark.e2e`        | End-to-end lifecycle tests           | Full create-sync-complete flow    |
| `@pytest.mark.functional` | Functional tests with real git repos | Validated output assertions       |
| `@pytest.mark.slow`       | Tests taking >5 seconds              | Large repo operations             |

## Shared Fixtures (tests/conftest.py)

| Fixture               | Purpose                                             |
| --------------------- | --------------------------------------------------- |
| `tmp_bare_repo`       | Bare git repo acting as origin                      |
| `tmp_git_repo`        | Git repo with initial commit and origin             |
| `tmp_home_clone`      | Directory structure mimicking a home clone          |
| `tmp_clones_dir`      | Clones directory alongside home clone               |
| `tmp_task_clone`      | Task clone with feature branch                      |
| `mock_ado_auth`       | Mocks ADO authentication (PAT via env)              |
| `mock_ado_wit_client` | Mocks ADO Work Item Tracking client                 |
| `prepare_clone`       | Disables hooks and sets git identity in test clones |
| `write_mle_metadata`  | Writes .mle-metadata.json into a directory          |
| `cli_runner`          | Click CliRunner instance                            |

## Key Rules

- Test clones set `core.hooksPath = /dev/null` to avoid hook interference
- No real ADO calls in unit/functional tests — mock via fixtures
- Use `CliRunner` (Click test runner) for CLI integration tests
- All new features require tests before merge

## Memory Management and Batch Execution

**CRITICAL**: The full test suite is large. Running `pytest tests/` in one go can exceed available memory and get OOM-killed. Always follow these rules:

### Before Running Tests

Kill stale pytest processes that leak memory from prior runs or crashed clones:

```bash
ps aux | grep pytest | grep -v grep | awk '{print $2}' | xargs -r kill 2>/dev/null
```

Check available memory before starting:

```bash
free -h | grep Mem
```

### Run in Batches

Never run the entire suite in one command. Use these batches:

```bash
# Batch 1: Unit tests
.venv/bin/python -m pytest tests/unit/ -q

# Batch 2: Functional tests
.venv/bin/python -m pytest tests/functional/ -q

# Batch 3: CLI tests
.venv/bin/python -m pytest tests/cli/ -q

# Batch 4: E2E tests
.venv/bin/python -m pytest tests/e2e/ -q
```

For coverage, run per-batch and combine:

```bash
.venv/bin/python -m pytest tests/unit/ tests/functional/ --cov=mle --cov-report=term-missing -q
```

### Avoid Pipe Buffering

Do NOT pipe pytest output through `| tail` or `| tee` when debugging — it buffers all output and you can't see progress. Use direct output or write to a file with `--result-log`.
