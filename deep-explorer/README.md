# Deep Explorer

Always-on modular deep-analysis orchestrator for ChatGPT using GitHub as the source of truth.

## Operating mode
Inside the Deep Explorer project, **every question runs in full deep mode**.

There is no:
- `/direto`;
- `/analise`;
- short mode;
- intermediate mode;
- automatic depth selection.

A simple question may produce a naturally shorter answer only when deep analysis confirms that no material additional branches exist.

## Usage
In a ChatGPT Project connected to GitHub, paste the content of `PROJECT-INSTRUCTIONS.md` into Project Instructions.

Then ask normally. No activation command is required.

Examples:
- `Analise este caso.`
- `Por que isso aconteceu?`
- `Investigue as teorias sobre este evento.`
- `Examine esta empresa e suas conexões.`

All automatically invoke the full Deep Explorer workflow.

## Architecture
Deep Explorer retrieves and applies only the upstream reasoning/research modules relevant to the task, but the **deep exploration engine itself is always active**.

Core flow:
Question → substantive answer → decomposition → research/evidence → causes/mechanisms → systems/connections → patterns/anomalies → second/third-order consequences → scenarios/counterfactuals → implications → competing hypotheses → objections/falsification → gaps → integrated conclusion → useful informational saturation.

Files:
- `SKILL.md` — always-on orchestrator.
- `skill-registry.md` — upstream modules and activation rules.
- `obscure-theory-mode.md` — hypothesis-heavy/obscure topics.
- `PROJECT-INSTRUCTIONS.md` — instructions for the ChatGPT Project.

## Important
External upstream skills remain owned and maintained by their authors. This repository stores references and orchestration rules rather than copied upstream content.
