# Game UI/UX audit — 29 September 2026

Reviewed the eight released games at https://games.gentlegames.org/ and implemented the fixes in the existing React Native application. Number Picnic remains experimental and was not included in the released-game review. These changes have not been deployed.

## Findings and fixes

| Area | Finding | Change |
| --- | --- | --- |
| Shared navigation | On short screens, scrolling the game also moved Back out of reach. | Game headers stay outside the scroll area. All eight games retain a visible Back button; Memory Snap and Drawing Pad can now scroll when needed. |
| Readability | White labels on pastel buttons and selected options were difficult to read in the light theme. Secondary instructions were also too pale. | Shared accent text and secondary text colours now pass automated 4.5:1 contrast checks against the tested theme fills and game surfaces. Small buttons retain 48-pixel targets with less surrounding padding. |
| Dialogs | Dismissed difficulty dialogs could remain as invisible modal portals, exposing old controls to assistive technology while waiting for an animation-end event. | Dismissal immediately removes the modal host. Entry animations respect the app and system motion preference. |
| Memory Snap | No initial instruction; landscape sizing shrank cards below comfortable touch sizes. | Added a short instruction. Cards retain a 48-pixel minimum where width permits, with vertical scrolling on short screens. |
| Drawing Pad | Icon-only tools, horizontally hidden colours, bright white controls in dark mode. A larger toolbar could crop older drawings. | Named tool buttons, wrapping tool and colour rows, 48-pixel colour targets, themed controls, and a scrollable canvas that preserves the vertical extent of saved marks. |
| Glitter Fall | Long button labels were left-aligned and produced uneven control heights; wide layouts spread controls excessively. | Centred labels, equal minimum action heights, more compact preset controls, and a bounded content width. |
| Bubble Pop | Some bubbles nearly disappeared into the light background. Movement choices were difficult to discover. | Added a visible outline and minimum fill opacity, plus a single motion switch above the play area. Still bubbles remain playable with pointer and keyboard input. Reduced-motion preferences take precedence. |
| Category Match | Selecting a picture had no distinct visual state. The help button promised speech even though it only repeated text. | Added a selection border, corrected the help label, improved shared control contrast, and bounded the board width. |
| Keepy Uppy | No immediate way to pause movement; the instruction implied urgency. | Added pause/resume beside Add Balloon and a calmer instruction. |
| Breathing Garden | Pausing left “Breathe In” or “Breathe Out” on screen. | Shows an explicit paused message. Shared navigation and contrast improvements apply to session choices and activity controls. |
| Pattern Train | Instructions, difficulty text, a repeated pattern description, and help controls pushed answer choices below the first screen on a small phone. Train scaling used the window width rather than the card width. Successful first attempts had no visible feedback text. | Choices appear directly beneath the train, redundant text is removed, train scaling follows measured space, success feedback is shown, and the replay label describes its visual behaviour. |

## Validation

- Walked through all eight released production games using the collaborative browser, including game selection and return navigation. Inspected recordings of every game in the light theme and additional dark-theme views.
- Repeated all eight game launches and return navigation in the optimized local web export at 320×568. No inspected control extended horizontally beyond the viewport. Back remained at the top of the screen after scrolling each scrollable game.
- Inspected 390×844 phone layouts, 568×320 landscape Memory Snap, and 1280×800 desktop layouts. Confirmed landscape memory cards measure 48×48 and that the hint and Back remain reachable.
- Completed a six-pair Memory Snap board and restarted it. Placed a drawing shape and undid it. Exercised Glitter Fall's add/settle controls. Popped and replenished still bubbles, switched motion modes, and activated a bubble with Enter. Selected and correctly sorted a Category Match item. Paused Keepy Uppy, verified the balloon bounds stayed unchanged, added a second balloon, and resumed. Started and paused Breathing Garden. Completed a Pattern Train choice and checked Next.
- Added regression coverage for card sizing, stationary bubble controls, fixed navigation, modal-host removal, saved drawing extent, and colour contrast. Updated existing layout-sensitive tests.
- Validation passed: 678 tests across 83 Jest suites, TypeScript, optimized web export, changed-source formatting, and whitespace checks. Source lint reported no errors and two existing unused-variable warnings in the experimental Picnic drag hook and its test.
- After the dialog fix, checked the optimized export again: selecting a Memory Snap board or a Pattern Train level leaves zero modal portals in the page. Breathing Garden displays its paused message correctly.

The browser snapshot tool failed during this session. Visual inspection used frames extracted from collaborative-browser recordings instead. Automated interaction checks used live DOM measurements and the browser's controls.

## Limits

This is a browser review and code validation, not a physical Android/iOS device test or a study with children and caregivers. Screen-reader operation, real touch dragging, offline installation, and audio quality were not comprehensively evaluated. Existing homepage edits and the separate runbook kit were preserved. Production remains unchanged until these changes are reviewed and deployed.

## Second pass: mixed ages, including non-readers

The user clarified that the app should serve mixed ages, including non-readers. This pass focuses on recognisable controls, continuity, and fewer required decisions.

- Added a consistent illustrated Home button and a global sound switch to all eight released games. Both stay visible while scrolling, have 68×56 touch targets at the tested phone sizes, and pair icons with short labels. The sound state is exposed to native accessibility and the web accessibility tree.
- New installs start with sound and in-game mascot interruptions off. Existing saved preferences remain respected. Opening a game no longer triggers a celebration.
- Memory Snap now opens immediately with its saved board size, including the two-pair starter board. Previously, Home forced a choice among six, ten, or fifteen pairs and overwrote the saved size. All six supported sizes remain available through Change cards inside the game.
- Memory completion stays beneath the finished cards, with voluntary replay and Home actions. There is no blocking completion dialog. Changing global sound no longer regenerates an unfinished board.
- Pattern Train opens at the saved level. Change pattern opens the optional level selector; cancelling preserves the current puzzle. Removed the initial letter-code heading and shortened the main instruction. Choices remain pictures and support tapping as well as dragging.
- Category Match accepts a direct group tap without first selecting the item. Dragging remains available, and feedback gives a gentle next action.
- Drawing reopens saved work directly without a welcome dialog. The existing Clear action still provides its confirmation. Mirror off, Mirror ×2, and Mirror ×4 are visible states.
- Added familiar play, pause, stop, replay, next, add, look, and motion symbols beside relevant labels. Kept explanatory labels for readers and assistive technology. Removed the duplicate Breathing Garden sound control in favour of the persistent shared switch.
- Allowed the Home title to wrap and reduced its size to avoid truncation on narrow screens.

Validation for this pass:

- 674 tests passed across 83 suites. Updated tests cover direct launch, optional setup, cancellation, one-tap sorting, uninterrupted saved drawings, inline completion, and sound changes preserving memory cards. Superseded forced-setup tests were replaced. TypeScript, source lint (two existing Picnic warnings), changed-file formatting, and whitespace checks passed.
- Optimized web export succeeded. Revisited all eight games at 390×844 and 320×568. No inspected control overflowed horizontally; Home and sound remained fixed after scrolling every screen. Reviewed recorded game frames in light mode and Pattern Train in dark mode.
- In the browser, completed a two-pair Memory board with no modal, toggled sound while a card was turned without losing it, verified the sound switch's web checked state, changed Drawing's mirror state, sorted an item through one direct group tap, completed a Pattern Train answer, and cancelled its level selector without leaving the puzzle.

These remain local, undeployed changes. The physical-device and child/caregiver validation limits above still apply; icons and simplified copy have not been comprehension-tested with children.
