# Code review validation — 30 September 2026

The current working tree was reviewed directly. Existing uncommitted work was retained; nothing was committed, stashed, or discarded. Confirmed runtime, privacy, accessibility, and CI issues were fixed. Some severity and scope claims in the original review needed qualification.

## Critical and major findings

| Finding | Validation and resolution |
| --- | --- |
| 1. Shared persistent install ID | Confirmed. The previous privacy policy explicitly documented sharing the ID, so this was documented behavior rather than an undocumented accident. Removed Sentry's user identity and the cross-vendor `identify()` call. PostHog now uses its own in-memory identity, never a persistent app install ID. The old app install ID is removed from storage during consent reconciliation. Updated the policy. |
| 2. Telemetry SDKs survive opt-out | Confirmed teardown issue. Existing wrappers and Sentry's `beforeSend` already blocked their guarded captures; they did not shut down the SDKs. Opt-out now removes access to PostHog immediately, discards its queue before shutdown, and closes/detaches Sentry and clears its scopes. Consent operations are serialized, stale initialization cannot publish a client, and retired callbacks cannot become active after a later opt-in. |
| 3. Conditional hooks and missing hook linting | Confirmed, including two more conditional calls in the shared animation hook. All hooks are now unconditional. Enabled both hook rules as errors and fixed the dependency findings throughout the app, including another stale drop-zone closure in PicnicBlanket. Tests now mock the complete hook contract. |
| 4. Small volume targets | Confirmed. Replaced individual narrow segment buttons with one adjustable track, keeping the segments decorative. The track and both buttons meet the 48px minimum. The track exposes its current value and increment/decrement accessibility actions. Its label and hint are translated. |
| 5. Silent-switch bypass | Confirmed for iOS. Set `playsInSilentMode: false`; the in-app sound setting still gates playback. [Expo documents this option's silent-mode behavior](https://docs.expo.dev/versions/v54.0.0/sdk/audio/). |
| 6. Arithmetic-only parent gate | Confirmed accessibility gap; pausing play at the caregiver's limit is intentional. Added a labelled three-second hold alternative, a corresponding screen-reader action, labelled arithmetic controls, and a polite error announcement. The screen scrolls and avoids the iOS keyboard; Back dismisses the answer attempt/keyboard without granting more play time. The fallback restarts the configured allowance. |
| 7. Stale drag validity | Confirmed. Move and release can occur before React updates state; the memoized responder also omitted the state dependency. Added a synchronous basket-overlap ref and reset it between gestures. Regression tests cover both entering and leaving the basket immediately before release. |
| 8. Glitter frame updates | Confirmed within GlitterGlobe's SVG subtree, rather than the entire application tree. Capped physics and React updates at 30 per second. Elapsed time preserves motion speed across refresh rates, and long frame gaps are bounded. Resize now remaps particles relative to the globe center and radius, including while paused. |
| 9. Missing CI lint/format checks | Confirmed. `ci:shared`, already used by the workflow, now runs lint and formatting before tests/typechecking. Local worktrees and runbook material are ignored so checks apply to this checkout. Updated README's command description. [Oxlint supports this committed rule configuration](https://oxc.rs/docs/guide/usage/linter/config.html). |
| 10. Locale drift checks | Confirmed. Validation discovers every locale JSON file, checks registration/supported-language coverage, recursively compares all string leaves (including array elements), and checks interpolation placeholders. No hand-maintained leaf list remains. |

## Minor findings and test caveats

| Finding | Validation and resolution |
| --- | --- |
| Drawing edits on unmount | Confirmed for unmounts outside the screen's existing navigation flush. Cleanup now persists the final pending payload, preserves write order, and suppresses callbacks into an unmounted screen. |
| Celebration timers | Confirmed in the hook. Replaced overlapping timers with one cancellable timer, cleared on unmount or when celebrations are disabled. Removed side effects from the state updater. |
| Glitter resize | Confirmed and fixed with finding 8. |
| Unused color-picker package | Confirmed. Removed the dependency and its unused transitive packages from the lockfile. |
| Dead game/settings analytics helpers | Confirmed. Removed unused event APIs, including the generic event wrapper and unused enable-by-default initialization helpers; production analytics now only tracks typed screen names. Removed the unused PostHog provider wrapper from App. |
| Score/duration policy contradiction | Confirmed as a latent risk, not evidence of current score collection. Deleted those unused APIs and removed score/duration from Sentry's diagnostic allowlist. |
| Retained Sentry stack frames | Retaining source locations is appropriate and was already described in the policy. The real privacy gap was retaining arbitrary frame fields. Frames now retain only filename, function, line/column, and app-frame status; local variables, source snippets, absolute paths, and URL parameters are stripped. Request/log fields, user identity, and arbitrary exception metadata are also removed. |
| Untyped language changes | Confirmed. `changeLanguage` now requires `SupportedLanguage`. |
| SelectBox backdrop role | Confirmed. Added the button role to its existing translated close label. |
| Sounds before hydration | Confirmed unnecessary loading. Sound initialization now waits for hydrated, enabled settings. Muting unloads players, pending initialization can be cancelled, and repeat initialization does not duplicate players. |
| Drawing constant aliases | Confirmed unused aliases. Removed them; the canonical limits and budget remain. |
| Possibly unused translation keys | Some legacy keys have no current consumers. This is harmless vocabulary, not a runtime failure; retained them rather than deleting translations speculatively. All are covered by the new locale validation. |
| Local runbook folder and mode 700 | The private permission mode is not a defect. Retained the folder and added it to git/lint/format ignores. |
| Permissive global i18n/settings mocks | Confirmed coverage limitation. Added an integration suite using the actual i18n instance, React i18n bindings, and SettingsProvider, checking both locales and interpolated accessible controls after hydration. Existing focused unit mocks remain. |
| Parent-gate test coverage | Timer persistence/lifecycle tests already existed. Added arithmetic success/failure tests, malformed-answer checks, and hold/screen-reader fallback coverage. Replaced sound tests that only tested mock functions with tests of the real sound implementation. |

## Validation and practical limits

- Shared CI: lint and formatting pass, 84 suites / 698 tests pass with coverage, and `tsc --noEmit` passes.
- Web, Android, and iOS exports pass. These are bundle checks, not physical-device tests.
- Regression coverage includes consent races and shutdown, gesture batching, persistence on unmount, glitter update frequency/resize, audio mode and hydration, translation parity, and parent-gate behavior.
- The collaborative preview opened, but navigation/snapshot automation failed on repeated attempts even though the local exported app served HTTP 200. A browser visual smoke check was therefore not completed.
- Sentry's supported close lifecycle closes both its JavaScript client and native SDK. Native crash reporting remains available with consent. Automated tests verify the wrapper lifecycle and JavaScript payload scrubbing; native SDK shutdown, the iOS silent switch, and assistive-technology behavior still require device verification.
- Opt-out prevents further captures/uploads through the controlled clients; a request already transmitted before withdrawal cannot be recalled.
