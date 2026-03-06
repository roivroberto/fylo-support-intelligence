# Docs Organization Design

## Goal
Reorganize repository documentation by lifecycle so contributors can find artifacts in working order, while keeping team discussion materials isolated.

## Scope
- Move top-level markdown docs into lifecycle folders under `docs/`.
- Keep `12_TEAM_REVIEW_PACKET.md`, `13_TEAM_DECISION_MEETING.md`, and `14_TEAM_DECISION_BOARD.md` together in a dedicated team discussion folder.
- Add a lightweight `docs/README.md` index to explain structure.
- Preserve existing filenames to avoid unnecessary content edits.

## Proposed Structure
```
docs/
  01-foundation/
    00_README.md
    01_IDEA_DRAFT.md
  02-role-briefs/
    02_ROLE_PRODUCT_LEAD.md
    03_ROLE_TECH_LEAD.md
    04_ROLE_FRONTEND_DESIGN.md
    05_ROLE_BACKEND_DATA_AI.md
    06_ROLE_PITCH_OPS.md
  03-research-validation/
    08_VALIDATION_RESEARCH.md
    09_COMPETITOR_AND_ANALOGS.md
    10_MENTOR_SPONSOR_MAP.md
  04-risks-decisions/
    07_OPEN_QUESTIONS_AND_DECISIONS.md
    11_TECH_RISK_AND_PLAN_B.md
  05-team-discussion/
    12_TEAM_REVIEW_PACKET.md
    13_TEAM_DECISION_MEETING.md
    14_TEAM_DECISION_BOARD.md
  plans/
    2026-03-06-docs-organization-design.md
  README.md
```

## Rationale
- Lifecycle grouping creates a predictable reading path from concept to execution risks.
- Dedicated team discussion folder protects active meeting artifacts from accidental mixing with research or role docs.
- Keeping original filenames reduces edit risk and maintains recognizable references.

## Risks And Mitigations
- Broken internal links after moves: search and update moved-path references.
- User confusion after structure change: add `docs/README.md` with map and guidance.

## Validation
- Confirm all 15 markdown docs exist in new locations.
- Confirm `12-14` are only under `docs/05-team-discussion/`.
- Confirm git status shows expected renames/moves.
