# Child-Centred Validation

Status: **participant validation evidence is pending**. This package records how to run and report review sessions; it does not claim that sessions have happened.

Use this package for usability and accessibility review of the redesigned games. Keep the child in control, treat communication broadly, and test whether the child can use the experience without an adult translating it.

## Use The Package

1. Read the [facilitator protocol](facilitator-protocol.md) and [consent and stop criteria](consent-and-stop.md).
2. Prepare the [device and input matrix](device-input-matrix.md).
3. Record only what is needed on the [observation sheet](observation-sheet.md).
4. Classify findings and write reproducible reports using [severity and issue reporting](severity-and-issue-reporting.md).
5. Do not release a redesigned game until its [release checklist](release-checklist.md) has real reviewed evidence.

The [usability finding issue template](../../.github/ISSUE_TEMPLATE/usability-finding.md) turns one completed observation into a reviewable issue.

## Non-Negotiable Status

- No participant sessions are represented as completed here. All evidence fields begin as `Pending`.
- Number Picnic is **not releasable** and must remain hidden/disabled until both its interaction and learning-mode checklist entries have real, reviewed participant evidence. Documentation alone cannot clear that gate.
- Do not commit names, contact details, dates of birth, recordings, diagnoses, health information, or other identifying data. Use an anonymous session code and store consent records outside this repository under the approved study process.

## Scope And Outcome Reference

The release checklist covers the requested redesigned issues:

| Issue | Game or scope |
| --- | --- |
| #56 | Glitter Fall |
| #57 | Breathing Garden |
| #58 | Pattern Train |
| #59 | Memory Snap |
| #60 | Category Match |
| #61 | Number Picnic interaction |
| #62 | Number Picnic learning modes |
| #63 | Bubble Pop |
| #64 | Drawing |
| #65 | Keepy Uppy |

The mode and immediate-target wording in the checklist is copied from [`src/games/outcomes.ts`](../../src/games/outcomes.ts). A `null` immediate target is recorded as `None (null)`, not replaced with a performance goal.
