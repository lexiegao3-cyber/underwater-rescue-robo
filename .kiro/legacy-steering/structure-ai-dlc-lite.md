# Project Structure

## Repository Layout

```
.kiro/
  aws-aidlc-lite-rule-details/   # Rule definitions for AI-DLC Lite
    LITE-CHANGES.md              # Diff summary vs. full AI-DLC version
    common/
      core-rules.md              # Process overview, terminology, questioning philosophy, error handling
      question-format-guide.md   # How to format and manage question files
    inception/
      workspace-detection.md
      reverse-engineering.md
      requirements-analysis.md
      user-stories.md
      workflow-planning.md
      application-design.md
      units-generation.md
    construction/
      functional-design.md
      nfr-requirements.md
      nfr-design.md
      infrastructure-design.md
      code-generation.md
      build-and-test.md
    extensions/
      security/baseline/         # Security extension rules
      testing/property-based/    # Property-based testing extension rules
    operations/
      operations.md              # Placeholder for future ops workflows
  steering/
    aws-aidlc-lite-rules/        # Steering rules that reference the lite rule details
.vscode/
  settings.json
```

## Conventions

- Rule files are organized by **lifecycle phase** (inception → construction → operations)
- `common/` holds cross-cutting rules referenced by all stage files
- `extensions/` holds optional add-on rule sets (security, testing strategies)
- Steering files live in `.kiro/steering/` and are always included unless front-matter specifies otherwise

## Runtime Artifacts (generated during workflow execution)

When AI-DLC Lite runs against a target project, it produces artifacts in that project's workspace:

```
aidlc-docs/
  aidlc-state.md                 # Overall workflow state and stage progress
  audit.md                       # Complete audit trail with timestamps
  inception/
    requirements/                # requirements.md, requirement-verification-questions.md
    user-stories/                # stories.md, personas.md
    application-design/          # components.md, component-methods.md, services.md,
                                 # component-dependency.md, unit-of-work*.md
    plans/                       # application-design-plan.md, etc.
  construction/
    {unit-name}/code/            # Markdown documentation for generated code
    build-and-test/              # build-and-test-instructions.md, build-and-test-summary.md
```

Application code is always written to the **workspace root**, never inside `aidlc-docs/`.
