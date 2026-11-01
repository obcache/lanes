# Visual and workflow verification — 2026-10-31

The primary library implementation was compared directly with `library-concept.png`
using `view_image` on the concept and latest browser screenshot. Native reference
size: 1586×992. Also checked 390×844 browser layout and 1440×950 packaged Windows
startup. Browser/IAB inventory was empty and the native computer-use pipe unavailable;
Playwright Chromium and Playwright's Electron launcher were the supported fallback.

| Comparison | Observation and action |
| --- | --- |
| Layout/containers | Preserved left rail, open library table, full banner and right track inspector. Adjusted desktop columns to 254 px sidebar / 455 px inspector and aligned table/banner positions to the reference. No card-grid substitution. |
| Typography | Increased initial heading/nav/table/control sizes after first comparison; locally bundled Manrope/DM Sans. Heading hierarchy, compact metadata and touch-sized main actions are deliberate. |
| Palette/selected states | Ink background, lime primary control/selection, muted blue-gray secondary text and colored note bars match the working reference. |
| Media | Generated a standalone original aurora asset, used in banner and covers. Production ribbon detail differs from the concept screenshot; it is the documented matching standalone art pass. No screenshot-as-interface. |
| Icons/controls | Lucide outline navigation and primary play/import actions preserve the intended metaphors. Branded five-stripe SVG produces app/launcher icons. |
| Copy | Kept Your library, Your music. Your rhythm., Find your flow., Every track becomes your playground., Import music, Search tracks, All tracks, Favorites, nav labels and difficulty names. Added functional map count/import explanation/local player and source hints; listed below. |
| Responsive/accessibility | No document overflow at 390 px. Track inspector stacks after the table and remains reachable by scrolling. Found hidden-text navigation losing accessible names; added explicit aria-labels to all route controls. |
| Game state | Original and imported audio play on a real audio clock. Inspected descending-note screenshot from the installed web-game client plus text state, pause/resume and scored keyboard input. |

Intentional deviations: sidebar footer is a local-profile/session shortcut instead
of the concept's unrequested music mini-player; the browser preview identifies its
storage mode in the titlebar; the inspector shows a fourth-map count and real
track-source hint; the table and sidebar include functional import/save context.
Code-native note bars, lane geometry and the brand icon are functional primitives.
Album art variants use the same generated source with controlled hue changes.
These are documented product requirements/functional choices, not claims of pixel
identity with generated raster text. No material clipping, overlap, missing asset,
broken control, or unexplained copy mismatch remained in the final reviewed screen.

The main library was faithfully verified against the working design with those
explicit functional deviations. At least layout, copy, type, palette, media, icon
treatment, spacing and responsive behavior were inspected. The first pass's type
scale/column drift, right-panel overflow, rapid-upload race, inlined-font CSP block,
and mobile route accessibility were corrected and rechecked.

## Workflow proof

`npm run test:smoke` imports an actual generated WAV into the analysis worker,
checks four maps and lane limits, edits playlist order, remaps a key/channel/offset,
calibrates with real-time taps, uploads both artwork types rapidly, reloads, plays
the imported track, sends timed keyboard events, verifies a nonzero saved result,
retries, and checks mobile/offline leaderboard behavior. Browser page/console
errors are asserted empty. `npm run test:desktop` checks the packaged app/preload,
settings JSON across restart and original practice playback/pause.

Evidence is outside the repository in the OS temporary directory:
`lanes-library.png`, `lanes-settings.png`, `lanes-profile.png`, `lanes-game.png`,
`lanes-game-active.png`, `lanes-mobile.png`, `lanes-desktop.png`, and
`lanes-desktop-game.png`. The installed web-game client's `lanes-game-qa/` screenshots
and text state were also inspected. Temporary QA outputs are not shipped.

Physical MIDI, human musical-quality judgement, actual organization OIDC, production
MySQL and Apache configuration remain external acceptance items. No online data was
invented to fill an offline screen.
