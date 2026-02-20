# Untested Known Bugs

Documentation for potential v3 issues derived from v2 bug reports that cannot be covered by automated e2e tests.
Testable cases are covered in `reported-issues.test.ts`.

## Require Real Mobile Devices

| Issue | Concern                                                                                 | Why untestable                                                                     |
| ----- | --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| #789  | iOS Safari momentum scroll may not fire IO callbacks reliably during fast flings        | Needs real iOS device; Playwright chromium can't reproduce momentum scroll physics |
| #479  | iOS momentum scrolling + toolbar resize compounding viewport measurement issues         | Same as #789 — real iOS Safari + physical momentum scrolling required              |
| #381  | Android virtual keyboard popup resizes viewport, may cause unexpected IO recalculations | Can't simulate keyboard appearance in headless/automated browsers                  |

## Require External Libraries or Specific Browser Features

| Issue | Concern                                                                                                      | Why untestable                                                                                                                                        |
| ----- | ------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| #652  | Smooth scrollbar libraries using CSS transforms (no native scroll) bypass both IO and scroll events entirely | Known architectural limitation — transform-based scrolling is fundamentally incompatible with IO. Would need an actual smooth-scroll library to test. |
| #470  | Shadow DOM containers — IO `root` compatibility varies by browser                                            | Requires cross-browser testing (Shadow DOM IO root support is inconsistent). Single-browser Playwright test wouldn't catch the real issue.            |

## Not Assertable in Automated Tests

| Issue | Concern                                                                                                                 | Why untestable                                                                                                                                  |
| ----- | ----------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| #817  | Sub-pixel rendering differences across browsers may cause jitter in progress-driven transform animations                | Visual/rendering concern — no pass/fail assertion possible. Users applying scroll-driven transforms should use `Math.round()` or `will-change`. |
| #503  | Background tab throttling: rAF-driven progress events stall when tab is suspended, may cause state jumps on tab refocus | Can't suspend own tab programmatically. Inherent browser behavior outside library control.                                                      |
