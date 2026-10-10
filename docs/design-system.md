# Rose Glass

Semesta's small DOM design system: warm translucent surfaces, burgundy ink, quiet serif headings, and precise, comfortable controls. The cups remain the visual centre. This is the pattern for current and future interface work.

## Sources of truth

- `src/styles/tokens.css`: named colours, spacing, type, radii, heights, shadows and motion.
- `src/components/ui/ui.module.css`: surfaces, fields, focus, action rows and interaction states.
- `src/components/ui/button.tsx`: native React button with shared variants and ref support.
- Existing examples: `trip-editor.tsx` for a form, `upcoming-trips.tsx` for a panel, `country-selector.tsx` for search, checkboxes and a confirmation dialog.

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

At 600px and below, route the Countries, Trips and Account interfaces through `MobilePanels`. It owns the single active sheet and bottom navigation. Keep feature components mounted so closing a sheet or switching tabs preserves drafts. Desktop keeps its existing floating controls.

Use the native dialog modal state for focus containment and scene input blocking. Countries and trip lists use the short sheet; trip details/editing use the expanded sheet. Use explicit Close and backdrop dismissal; no draggable heights in the MVP. The form fields scroll while actions and navigation remain visible. `visualViewport` sizes the sheet above the mobile keyboard; include safe-area padding. Use `--color-sheet` for mobile readability.

Check Escape and focus return, switching tabs, a nested confirmation dialog, draft retention and keyboard-sized viewport changes when modifying this shell. Do not give individual features independent mobile overlays.

Account backup uses the same controls and surfaces. Desktop opens a native modal from the quiet top-left entry; mobile uses the shared Account sheet. Keep email-code fields labelled, asynchronous status in live regions, and destructive account actions behind explicit confirmation.
