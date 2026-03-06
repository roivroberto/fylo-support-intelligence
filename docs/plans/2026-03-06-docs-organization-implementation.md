# Docs Organization Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Reorganize markdown documentation into lifecycle-based folders and isolate team discussion docs 12-14 in their own directory.

**Architecture:** Create a `docs/` hierarchy grouped by lifecycle stage, then move existing markdown files into target folders while preserving filenames. Add a central `docs/README.md` index that explains where each doc lives and why. Verify paths and git rename detection before commit.

**Tech Stack:** Markdown, git CLI, shell file operations

---

### Task 1: Create lifecycle folder structure

**Files:**
- Create: `docs/01-foundation/`
- Create: `docs/02-role-briefs/`
- Create: `docs/03-research-validation/`
- Create: `docs/04-risks-decisions/`
- Create: `docs/05-team-discussion/`

**Step 1: Verify current top-level markdown files exist**

Run: `ls`
Expected: Shows `00_README.md` through `14_TEAM_DECISION_BOARD.md`.

**Step 2: Create target directories**

Run: `mkdir -p docs/01-foundation docs/02-role-briefs docs/03-research-validation docs/04-risks-decisions docs/05-team-discussion`
Expected: Directories created with no errors.

**Step 3: Verify directory creation**

Run: `ls docs`
Expected: Lists all five lifecycle directories plus `plans`.

**Step 4: Commit**

```bash
git add docs
git commit -m "chore: scaffold lifecycle docs structure"
```

### Task 2: Move markdown docs into lifecycle folders

**Files:**
- Modify (move): `00_README.md` -> `docs/01-foundation/00_README.md`
- Modify (move): `01_IDEA_DRAFT.md` -> `docs/01-foundation/01_IDEA_DRAFT.md`
- Modify (move): `02_ROLE_PRODUCT_LEAD.md` -> `docs/02-role-briefs/02_ROLE_PRODUCT_LEAD.md`
- Modify (move): `03_ROLE_TECH_LEAD.md` -> `docs/02-role-briefs/03_ROLE_TECH_LEAD.md`
- Modify (move): `04_ROLE_FRONTEND_DESIGN.md` -> `docs/02-role-briefs/04_ROLE_FRONTEND_DESIGN.md`
- Modify (move): `05_ROLE_BACKEND_DATA_AI.md` -> `docs/02-role-briefs/05_ROLE_BACKEND_DATA_AI.md`
- Modify (move): `06_ROLE_PITCH_OPS.md` -> `docs/02-role-briefs/06_ROLE_PITCH_OPS.md`
- Modify (move): `08_VALIDATION_RESEARCH.md` -> `docs/03-research-validation/08_VALIDATION_RESEARCH.md`
- Modify (move): `09_COMPETITOR_AND_ANALOGS.md` -> `docs/03-research-validation/09_COMPETITOR_AND_ANALOGS.md`
- Modify (move): `10_MENTOR_SPONSOR_MAP.md` -> `docs/03-research-validation/10_MENTOR_SPONSOR_MAP.md`
- Modify (move): `07_OPEN_QUESTIONS_AND_DECISIONS.md` -> `docs/04-risks-decisions/07_OPEN_QUESTIONS_AND_DECISIONS.md`
- Modify (move): `11_TECH_RISK_AND_PLAN_B.md` -> `docs/04-risks-decisions/11_TECH_RISK_AND_PLAN_B.md`
- Modify (move): `12_TEAM_REVIEW_PACKET.md` -> `docs/05-team-discussion/12_TEAM_REVIEW_PACKET.md`
- Modify (move): `13_TEAM_DECISION_MEETING.md` -> `docs/05-team-discussion/13_TEAM_DECISION_MEETING.md`
- Modify (move): `14_TEAM_DECISION_BOARD.md` -> `docs/05-team-discussion/14_TEAM_DECISION_BOARD.md`

**Step 1: Move files**

Run: `mv <source> <target>` for each mapping above.
Expected: All files moved successfully.

**Step 2: Verify 12-14 are isolated**

Run: `ls docs/05-team-discussion`
Expected: Only files 12, 13, and 14 are present.

**Step 3: Verify no legacy top-level markdown remains**

Run: `ls *.md`
Expected: No matches, or only intentionally retained root markdown if any.

**Step 4: Commit**

```bash
git add -A
git commit -m "chore: reorganize docs by lifecycle and isolate team discussion"
```

### Task 3: Add documentation index and validate links

**Files:**
- Create: `docs/README.md`

**Step 1: Write docs index**

Create `docs/README.md` containing:
- lifecycle folder purpose
- quick map of where each original numbered file now lives
- note that files 12-14 are team discussion artifacts

**Step 2: Verify key files are readable**

Run: `test -f docs/01-foundation/00_README.md && test -f docs/05-team-discussion/12_TEAM_REVIEW_PACKET.md && echo OK`
Expected: `OK`.

**Step 3: Verify git status and rename detection**

Run: `git status --short`
Expected: Rename/add entries matching folder moves and README additions.

**Step 4: Commit**

```bash
git add -A
git commit -m "docs: add docs index for lifecycle navigation"
```

### Task 4: Push branch

**Files:**
- No file changes

**Step 1: Check branch and remote**

Run: `git branch --show-current && git remote -v`
Expected: Current branch and configured remote shown.

**Step 2: Push commit(s)**

Run: `git push -u origin <current-branch>`
Expected: Push succeeds and upstream tracking is set.
