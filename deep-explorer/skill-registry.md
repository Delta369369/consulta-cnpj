# Deep Explorer — Skill Registry

This registry points to the original upstream skills. Deep Explorer is the orchestrator; do not copy or pretend these skills are active without consulting their source when applicable.

## REASONING

### Thinking Toolkit
Repository: `ponomr/thinking-toolkit`
Path: `SKILL.md`
URL: https://github.com/ponomr/thinking-toolkit/blob/main/SKILL.md
Use for: problem decomposition, diagnostic reasoning, reframing, selecting reasoning frameworks.
Activation: complex or poorly framed problems; skip for simple factual questions.

### Systems Thinking
Repository: `d-wwei/systems-thinking`
Path: `SKILL.md`
URL: https://github.com/d-wwei/systems-thinking/blob/main/SKILL.md
Use for: causal structure, feedback loops, dependencies, system boundaries, delays, emergent effects.
Activation: multi-actor or dynamic systems, recurring patterns, non-linear effects.

### Second-Order Thinking
Repository: `d-wwei/second-order-thinking`
Path: `SKILL.md`
URL: https://github.com/d-wwei/second-order-thinking/blob/main/SKILL.md
Use for: downstream effects, "and then what?", second/third-order consequences, counterfactuals, tipping points.
Activation: decisions, interventions, scenarios, forecasts, consequences.

### Critical Thinking
Repository: `tronghieu/agent-skills`
Path: `skills/critical-thinking/SKILL.md`
URL: https://github.com/tronghieu/agent-skills/blob/main/skills/critical-thinking/SKILL.md
Use for: claims, evidence, assumptions, logical gaps, falsification, competing hypotheses.
Activation: disputed claims, documents, theories, important conclusions, red-team pass.

## RESEARCH

### Research Agent
Repository: `krispuckett/starter-skill-kit`
Path: `research-agent/SKILL.md`
URL: https://github.com/krispuckett/starter-skill-kit/blob/main/research-agent/SKILL.md
Use for: multi-source research, source quality, cross-verification, contradictions, synthesis, confidence.
Activation: current/external facts, obscure subjects, source disputes, questions requiring verification.
Note: adapt its source-count guidance to the task; prioritize source independence and primary sources over mechanical counts.

## EPISTEMIC CONTROL

### Ground Truth
Repository: `glichtenthal/ground-truth`
Path: `SKILL.md`
URL: https://github.com/glichtenthal/ground-truth/blob/main/SKILL.md
Use for: calibrated honesty, false-premise detection, evidence-first conclusions, resisting framing bias.
Activation: always as a lightweight epistemic check; full pass when the user proposes a conclusion or seeks confirmation.

### Anti-Sycophancy
Repository: `0xcjl/anti-sycophancy`
Path: `SKILL.md`
URL: https://github.com/0xcjl/anti-sycophancy/blob/main/SKILL.md
Use for: resisting unsupported agreement and pressure-driven position changes.
Activation: only when confirmation-seeking, leading premises, or repeated pressure could distort analysis. Do not force disagreement merely to appear rigorous.

## OUTPUT CONTROL

### Anti-Defensive Writing
Repository: `Kiterlin/anti-defensive-writing`
Path: `SKILL.md`
URL: https://github.com/Kiterlin/anti-defensive-writing/blob/main/SKILL.md
Use for: remove unnecessary caveats, hedging, defensive framing, apology-like filler and repetitive disclaimers while preserving necessary accuracy, legal, methodological and safety limits.
Activation: final answer pass whenever Deep Explorer is active.

## ORCHESTRATION RULE
Read only the upstream skills materially relevant to the current problem. Never claim to have applied an upstream skill unless its instructions were retrieved or its relevant rules are already available in current context. If an upstream source is unavailable, use the fallback description in this registry and disclose only if the missing source materially limits the result.
