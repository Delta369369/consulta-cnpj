# Deep Explorer

Modular deep-analysis orchestrator for ChatGPT using GitHub as the source of truth.

## Usage
In a ChatGPT Project connected to GitHub, paste the content of `PROJECT-INSTRUCTIONS.md` into Project Instructions.

Commands:
- `/direto` — concise and bounded.
- `/analise` — developed analysis.
- `/profundo` — full Deep Explorer.
- No command — choose depth automatically.

## Architecture
Deep Explorer does not duplicate upstream skills. It retrieves and applies only the modules relevant to the current task.

Core flow:
Question → direct answer → decomposition → research/evidence → causes/mechanisms → systems/connections → second/third-order consequences → scenarios/counterfactuals → competing hypotheses → objections/falsification → gaps → integrated conclusion → useful informational saturation.

Files:
- `SKILL.md` — orchestrator.
- `skill-registry.md` — upstream modules and activation rules.
- `obscure-theory-mode.md` — hypothesis-heavy/obscure topics.
- `PROJECT-INSTRUCTIONS.md` — text to paste into a ChatGPT Project.

## Important
External upstream skills remain owned and maintained by their authors. This repository stores references and orchestration rules rather than copied upstream content.
