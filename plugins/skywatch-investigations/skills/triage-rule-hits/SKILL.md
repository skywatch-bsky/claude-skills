---
name: triage-rule-hits
description: >-
  Rule hit triage methodology for Osprey rules. Samples recent hits, classifies
  each as TP/FP/novel/uncertain, and produces aggregate rule health assessment
  with actionable recommendations. Use when evaluating rule performance during
  Phase 5 (Rule Validation) or as a standalone rule maintenance check.
user-invocable: false
---

# Triage Rule Hits

This skill guides the triage of Osprey rule hits — sampling recent hits for a given rule, classifying each as true positive, false positive, novel pattern, or uncertain, and producing an aggregate assessment of rule health. The goal is to surface what needs human attention: false positives that indicate rule drift, novel patterns worth adding to rule design, and overall rule performance.

Use this skill when you need to evaluate whether a rule is performing as intended, during Phase 5 (Rule Validation) of an investigation, or as a standalone rule maintenance workflow.
