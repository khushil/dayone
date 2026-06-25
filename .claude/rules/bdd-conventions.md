# BDD Conventions

## Behaviour-Driven Development

This project uses BDD with Gherkin feature files in `tests/Features/`.

### Feature File Rules

- Write features in **domain language**, not technical language
- One Feature per `.feature` file, named after the capability
- Use `Background` for shared preconditions across scenarios
- Use `Scenario Outline` with `Examples` for data-driven variations
- Keep each scenario focused on a single behaviour

### Gherkin Style

- **Given** establishes preconditions (past tense or present state)
- **When** describes the action under test (present tense)
- **Then** asserts the expected outcome (should/should be)
- **And** / **But** extend the previous step type
- Use data tables for structured input

### Step Definition Rules

- Step definitions go in `tests/Features/step_definitions/`
- One step file per feature or domain area
- Keep step implementations thin — delegate to helper functions
- Use parameterised parsers for reusable steps
- Share common steps via a `conftest.py` or shared steps file

### Test Organisation

- **Smoke tests**: Tag with `@smoke` for quick validation
- **Regression tests**: Tag with `@regression` for full suite
- **Work-in-progress**: Tag with `@wip` for incomplete scenarios
- Run by tag: `pytest -m "smoke"` or `behave --tags=@smoke`

### Category-Based Execution (from ESCALUS 12.4)

```bash
# Run only smoke tests
pytest tests/Features/ -m smoke

# Run all except WIP
pytest tests/Features/ -m "not wip"

# Run specific feature
pytest tests/Features/features/order_placement.feature
```

### Quality Checks

When reviewing BDD tests:

- Scenarios are readable by non-technical stakeholders
- No implementation details leak into Gherkin steps
- Step definitions are DRY (no duplicated step code)
- Feature files have meaningful descriptions
- Examples tables cover boundary conditions
