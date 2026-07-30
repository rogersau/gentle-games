# Severity And Issue Reporting

## Severity

Choose the highest applicable level:

- **S0 Safety or dignity blocker:** distress, unsafe stimulus, consent failure, forced continuation, or no reliable way to stop/leave. Stop testing and block release.
- **S1 Access blocker:** a child cannot start, understand, control, pause, stop, skip, or leave through an available access path; a task is drag-only where an alternative is promised; essential meaning is unavailable without adult explanation. Block the affected release.
- **S2 Major usability barrier:** repeated confusion, frustration, avoidance, loss of autonomy, or sensory discomfort that prevents the intended child-centred use for a meaningful group or setup. Fix before release or document a reviewed risk decision.
- **S3 Minor barrier:** recoverable wording, layout, label, or feedback issue that does not remove control. Prioritize with evidence and fix before the next relevant release.

Priority is separate from severity: `P0` release blocker, `P1` fix before affected game release, `P2` fix next iteration, `P3` backlog. Any S0 is P0. A single clear child stop signal is sufficient to stop a session, but severity of the product issue still needs review.

## Reproducible Finding Format

Use one anonymous finding per issue. Do not include identifying or health data.

```markdown
## [S?-P?] Short child-centred finding

**Game / redesigned issue:** [name / #56-#65]
**Outcome mode:** [exact value from outcomes.ts]
**Immediate target:** [exact string, or None (null)]
**Setup:** [device class, OS, input path, sensory settings]
**Evidence status:** Pending / Reviewed / Re-test needed

### Preconditions
- [settings, stage, level, or starting state]

### Steps to reproduce
1. [launch path]
2. [child action or available input path]
3. [new example or autonomy action]

### Expected child-centred result
[The child can understand, choose, control, adjust, pause, stop, skip, or leave without pressure; state the game-specific result.]

### Observed result
[Observable behaviour and product response only. No participant identity, diagnosis, or health information.]

### Impact and stop action
[Comfort, frustration, avoidance, access, or autonomy impact. State whether testing stopped.]

### Smallest useful change
[Concrete product change, not a judgement of the child.]

### Review
- Severity: [S0-S3]
- Priority: [P0-P3]
- Reviewer: [team handle or study role, not participant information]
- Retest evidence: [pending]
```

Screenshots, recordings, and logs require separate ethical approval and secure handling. Do not attach them to a public issue by default.
