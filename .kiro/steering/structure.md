---
inclusion: always
---

# Project Structure: Underwater Rescue MVP

## Current repository layout

The application code belongs at the repository root. Kiro planning artifacts belong under `.kiro/`.

```text
.
├── .kiro/
│   ├── specs/underwater-rescue-mvp/
│   │   ├── requirements.md
│   │   ├── design.md
│   │   └── tasks.md
│   ├── steering/
│   │   ├── product.md
│   │   ├── tech.md
│   │   ├── structure.md
│   │   └── safety-and-data.md
│   ├── legacy-steering/
│   └── aws-aidlc-lite-rule-details/
├── frontend/
├── backend/
├── data/
├── tests/
├── README.md
├── .gitignore
└── docker-compose.yml
```

## Conventions

- Kiro spec files are the source of truth for product behavior and implementation tasks.
- Steering files define persistent product, technology, structure, and data-safety constraints.
- Application code is separated into frontend and backend modules.
- Synthetic data and permitted derived artifacts belong under `data/`.
- Confidential source data must never be committed.
- Legacy AI-DLC files are retained for reference but are not the application architecture.
