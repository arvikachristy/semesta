# Rose Glass

Semesta's small DOM design system: warm translucent surfaces, burgundy ink, quiet serif headings, and precise, comfortable controls. The cups remain the visual centre. This is the pattern for current and future interface work.

## Sources of truth

- `src/styles/tokens.css`: named colours, spacing, type, radii, heights, shadows and motion.
- `src/components/ui/ui.module.css`: surfaces, fields, focus, action rows and interaction states.
- `src/components/ui/button.tsx`: native React button with shared variants and ref support.
- Existing examples: `trip-editor.tsx` for a form, `upcoming-trips.tsx` for a panel, `country-selector.tsx` for the shared flag-grid country modal.

Read these before making a component. Feature CSS Modules arrange content; shared recipes define how controls look. Do not copy the old feature-specific button/field rules or introduce a second palette.

## Visual rules

When an interaction is needed by multiple features, build it once under `src/components/shared/` and compose it into each feature. Keep filtering, search and selection behavior in that shared component; wrappers may choose different layouts or modes. Shared controls must use the Rose Glass primitives and tokens below, while feature CSS controls only local layout.

| Element     | Rule                                                                                                                                                                                                                   |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Surfaces    | Use `ui.surface`; add `ui.raised` for a checklist or modal requiring more contrast. Blur once at the panel level, not around every field.                                                                              |
| Text        | `--font-display` for panel and trip titles; `--font-body` for labels, dates, buttons and content. Normal weight; no new font downloads.                                                                                |
| Controls    | Inputs, selects, date fields and buttons share a 44px height, 14px corner radius and common border. Textareas grow vertically.                                                                                         |
| Spacing     | Use the 4, 8, 12, 16, 24, 32px token scale. Label-to-field gap is 8px; form rows 16px; action gap 12px; panel padding 24px.                                                                                            |
| Buttons     | Secondary is the default. Primary is the committed action, such as Save or confirmed Clear. Quiet is navigation/dismissal. Plain is a selectable row or heading. Only icon buttons and chips are circular/pill-shaped. |
| Fields      | Use visible labels, `ui.field` and `ui.control`. 16px input text avoids mobile focus zoom. Equal-column dates use `minmax(0, 1fr)` so they fit without clipping.                                                       |
| Actions     | Use `ui.actions`. Put cancel/keep on the left, commit on the right. Use one primary action per form/dialog.                                                                                                            |
| States      | Reuse shared hover, visible keyboard focus, disabled and invalid styles. Never remove focus outlines. Disabled controls do not respond to hover.                                                                       |
| Icons       | Keep the small existing symbol vocabulary. Icon-only controls require an accessible label and a 44px target.                                                                                                           |
| Diagnostics | Status colours are semantic tokens reserved for actual good/warning/error states. Do not use them as decoration.                                                                                                       |

Unique scene layout dimensions (timeline columns, panel position) may remain in feature CSS. Add a shared token only for a real recurring decision. Don't turn every one-off measurement into a token.

## Usage

```tsx
import { Button, ButtonVariant } from '../ui/button';
import ui from '../ui/ui.module.css';

<label className={ui.field}>
  Trip name
  <input className={ui.control} required />
</label>

<div className={ui.actions}>
  <Button onClick={onCancel}>Cancel</Button>
  <Button variant={ButtonVariant.Primary} type="submit">Save trip</Button>
</div>
```

Combine `ui.surface` and `styles.panel` in `className` on a semantic `aside` or `dialog`. Feature styles may set layout/width; don't overwrite the shared material. Use `<Button icon aria-label="New trip">+</Button>` for an icon action. Button defaults to `type="button"`; form submissions must explicitly use `type="submit"`.

## Native date and select behaviour

The date field follows our control recipe. Its popup calendar is still native: browsers/operating systems own that UI and it cannot be consistently themed with CSS. Select option menus have a similar platform boundary. Preserve native semantics, constraints and mobile behaviour; do not hide date indicators or fake a picker with an unlabelled clickable div.

A fully styled calendar would be a deliberate separate component with keyboard navigation, focus management, locale/date validation and touch testing. Do not improvise one to resolve a colour mismatch. [MDN: date input](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input/date), [MDN: advanced form styling](https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Forms/Advanced_form_styling).

## Review before handoff

1. Use shared recipes and variants. ESLint rejects raw `<button>` outside the UI primitives.
2. Check the new UI beside the country picker and trip panel, not only in isolation.
3. Check desktop and 390px mobile: aligned controls, visible labels, no horizontal overflow, reachable actions.
4. Check keyboard focus, disabled states and form constraints. Use native controls wherever possible.
5. Keep text readable over moving cups. Shared surfaces include reduced-transparency/forced-colour handling and buttons respect reduced motion.
6. Run the repository checks and production build. Add behaviour tests only for new behaviour; visually inspect style changes.

Token naming follows the [Design Tokens Community Group](https://www.w3.org/community/design-tokens/) principle of storing design decisions as named, reusable values. CSS custom properties are enough for this repository; no token compiler or UI framework is needed.

## Mobile sheets

Trip Studio keeps the collection mounted and uses the existing navigation shell for
Countries, Trips and Account access. Trip creation asks for a destination and days
or a date range, with a generated title. The studio shows a day-aligned journey map with green Stay and terracotta Travel
lanes. Stay ranges represent planned route nights; arrival, transfers and departure
open the existing booking editor in one tap. Initial slots are presentation defaults;
adding or changing a calendar block persists its planned range, never a booked status.
The summary toggles a focus view for unfinished bookings while keeping booked
items readable and editable. Stay + immediately fills a gap or splits the longest
stay; Travel + immediately adds a journey on Day 1. Stay blocks fill their entire
planned night range, with a move grip and start/end resize handles. Interact.js
owns mouse/touch drag and resize gestures. Desktop dragging starts anywhere on a
block except Edit/Delete and the resize edges. Touch movement starts after a 350ms
hold; swiping before activation keeps native scrolling. The grip remains a keyboard
alternative. Taps edit; the click following a drag is suppressed. Resize edges stay
immediate touch targets. It auto-scrolls the studio near its edges;
inertia is disabled. The React adapter converts movement into day ranges using
the actual row boundaries, including during scrolling. Arrow Up/Down on a handle changes one day. Changes preview
while dragging and save on release; Escape or pointer cancellation discards them.
Resizing can trim a neighbouring stay but cannot silently erase one. Uncovered
nights are counted above the map. Booking dates take precedence
for travel on dated trips. Extra unallocated stays and out-of-range bookings remain
visible below the map; other categories remain under Other plans. Lane colours
identify categories, while existing semantic badges communicate booking status. Stop editing and
booking create/edit use the existing native Overlay; forms mount only on request.
Every journey block, including generated defaults and unplaced bookings, exposes
Edit and Delete actions with 44px targets. The editor includes stay check-in/out
days as an alternative to dragging. Deletion removes the block, offers Undo and
persists dismissed default IDs so the item does not regenerate after reload.
CRUD actions share the trip-planning domain store, persisted through useTrips and
the existing repository; editors select by stable ID rather than copying records.
Single-stop metadata edits preserve the stop ID and associated booking identity.
Booking forms begin with a name-or-link field and collapse optional details. No
readiness hero, category chooser or traveller editor is shown. Escape and Close
dismiss overlays and restore focus. Native date/time inputs keep their usual behaviour.
Use the existing tokens and controls; the MVP adds no image service or new theme.

Trip setup uses DayDial and DateRangeCalendar. The SVG dial handles pointer capture,
continuous rotation across twelve o'clock, arrow/page/home/end keys, direct numeric
entry and ± buttons; one turn represents 30 days, bounded to 1–365. Presets use the
shared Button. This specialised numeric control uses the same focus and colour tokens.
DateRangeCalendar is the deliberate custom-calendar exception to native dates: a real
six-week grid with month navigation, inclusive range highlighting, roving keyboard
focus, leap-year handling and a selected-range summary. Arrow keys move by day/week,
Home/End move within the week and PageUp/PageDown change month. Booking date/time
fields remain native. Choose both a first and last day to complete a date range.
The destination shows a required-field hint while empty. Dates flexible is
an undated status in Days mode, and Keep dates flexible returns from the calendar
without saving dates. Creation has one primary footer action and cancellation in the header.

Trip setup and stop editors use the shared CountryPicker destination mode. Typing
shows up to eight matching country names and flags using the existing country/code/
alias matcher. Tap a result or press Enter to select it. Escape closes suggestions
without closing the dialog. Country results replace the native datalist; unmatched
city names remain usable as free text. Results scroll within a bounded area.

On mobile, focusing the destination switches the same form into search mode. Its
compact heading and input stay above a scrolling results area; duration, footer,
outer creation header and tab navigation are hidden until search finishes. A
country tap or Enter selects and blurs the input. Back to trip and Escape leave
search without submitting; Use “…” keeps a typed city. The input stays mounted
throughout, preserving keyboard focus. The form and mobile sheet share the visual
viewport hook so keyboard resize and scrolling constrain the available height.

At 600px and below, route the Countries, Trips and Account interfaces through `MobilePanels`. It owns the single active sheet and bottom navigation. Keep feature components mounted so closing a sheet or switching tabs preserves drafts. Desktop keeps its existing floating controls.

Use the native dialog modal state for focus containment and scene input blocking. Countries use the expanded sheet with a scrolling flag grid and compact feedback actions. Trip lists use the short sheet; editing expands it. Use explicit Close and backdrop dismissal; no draggable heights in the MVP. The form fields scroll while actions and navigation remain visible. `visualViewport` sizes the sheet above the mobile keyboard; include safe-area padding. Use `--color-sheet` for mobile readability.

Check Escape and focus return, switching tabs, a nested confirmation dialog, draft retention and keyboard-sized viewport changes when modifying this shell. Do not give individual features independent mobile overlays.

Account backup uses the same controls and surfaces. Desktop opens a native modal from the quiet top-left entry; mobile uses the shared Account sheet. Keep email-code fields labelled, asynchronous status in live regions, and destructive account actions behind explicit confirmation.

## Country browser

Desktop wraps `CountryBrowser` in the shared native Overlay; mobile places its content
inside the existing MobilePanels dialog. Never nest another country dialog. The
header shows the continent and visited progress, followed by native search/select
controls and Been to / Bucket list editing modes. Both modes show the searchable
catalogue in stable order. A tile toggles membership in the active mode in one tap;
its pressed state reflects membership, not focus or selection. Show a short mode
instruction and compact confirmation with Undo and Plan trip. Undo restores a wish
fulfilled by marking a visit. Existing trips expand from a native details control.
Use shared Button variants and field recipes. Wishes use a distinct diamond marker;
visited flags use a check. Both states can coexist for return visits. Trip return
restores browser state; confirming visits explicitly returns to the scene.

Mobile uses three compact country tiles per row, with names wrapping and full
44px minimum touch targets. Redundant continent subtitles are hidden. While search
has focus, collapse header metadata and hide the instruction, country-action footer
and bottom navigation to prioritise results within the visual viewport. Keep the
title, Close, search, continent selector and editing modes available. Tapping a tile
blurs search to dismiss the software keyboard and restore trip actions. Desktop
layout stays unchanged.
