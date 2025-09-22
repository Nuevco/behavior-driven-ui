# Step Language Proposal — Draft

*Purpose*: define a single, intuitive language for BDUI step definitions so non-programmers, AI authors, and developers all speak the same dialect. This document is a proposal only—no code will change until we review and agree on the plan.

---

## 1. Goals & Audience

* **Primary author/reader**: non-programmer stakeholders (product owners, business analysts) who expect natural phrasing.
* **Secondary author/reader**: QA engineers and developers who need precise yet human-friendly expressions.
* **AI tooling**: must have a deterministic grammar so generated scenarios match real step definitions without memorizing subtle variants.

Key goals:

1. One canonical phrase per behavior. Alternate wording is discouraged; every action maps to exactly one step definition.
2. Steps do the hard work of locating elements; scenarios stay descriptive and concise. AI tooling must favour the human-readable variant (labels) so generated scenarios remain comfortable for non-technical readers, only adding hints when unavoidable.
3. Locator scheme is predictable: human phrase → accessibility metadata → `data-testid` attribute → structured selector hints (within the same phrase). A single resolver utility owns this logic; steps never reimplement it.
4. Error messaging guides authors toward the canonical phrasing or metadata decoration they need.

---

## 2. Current State Snapshot

* Core steps handle world lifecycle, data storage, viewport, navigation, and a first pass at form interactions using raw selectors (e.g. `When I fill "#demo-name" with "Ada"`).
* Shared feature corpus mirrors those selectors, which ties scenarios to DOM IDs and makes the language feel technical.
* There is no shared convention for attaching semantic metadata to UI elements.

Risks we have today:

| Risk                             | Impact                                                       |
| -------------------------------- | ------------------------------------------------------------ |
| Scenario language is CSS-centric | Non-technical readers and AI generators must know selector syntax |
| Multiple ad-hoc phrases          | Hard to train authors and tooling on the “right” wording     |
| Lack of metadata convention      | Step definitions can’t resolve user phrases deterministically |

---

## 3. Proposed Locator Model

### 3.1 Semantic Layers (resolution order)

1. **Plain‑language reference** — we treat the author’s phrase (e.g., “Name”, “Continue”) as the **intended accessible name** and run the label‑first matching order below.
2. **Accessibility metadata (default lookup)** — match **in this order**: **label** → **aria-labelledby** → **aria-label** → **role+name** (accessible name) → **title** → **alt** → **placeholder** → **visible text**.
3. **Test id attribute (**\`\`**)** — if accessibility lookups miss or are ambiguous, fall back to elements decorated with `data-testid="token"`. This is a widely accepted pattern (Playwright `getByTestId`).
4. **Selector hint escape hatch** — if a **prefix** is present (e.g., `css:#id`, `aria:Continue`, `role:button`, `text:Continue`), it **short‑circuits** the normal order and is applied immediately while still keeping a single step definition.
5. **Descriptive failure** — when all strategies fail, surface a clear error listing the attempts and suggested metadata additions.

### 3.2 Canonical Phrase Pattern

We use **control‑first** phrasing with a single canonical step that works for single‑line, multi‑line, and rich text without changing wording.

**Canonical text entry step — set … to …:**

```
When I set the "{target}" (text field|text area|editor|field) to {text}
```

* `{target}` is the human label (e.g., "Title", "Body", "Notes").
* The trailing noun **disambiguates the kind** when needed; `field` is allowed and triggers kind inference (see §3.5).
* `{text}` binds either a quoted string (single‑line) **or** a Gherkin docstring (multi‑line). The sentence **does not change** between single‑ and multi‑line.

**Examples**

```gherkin
When I set the "Title" text field to "Hello world"

When I set the "Notes" text area to:
  """
  Line 1
  Line 2
  """

When I set the "Body" editor to:
  """
  # Heading
  **Bold** and _italic_
  """
```

**Unified generic action patterns**

* `When I {action} the "{target}" {kind}`
* `When I {action} the "{target}" {kind} {preposition} {amount}`
* **Property‑of form**:

  * `When I {action} the {property} of the "{target}" {kind}`
  * `When I {action} the {property} of the "{target}" {kind} {preposition} {amount}`
* **Scoping forms** (child in parent):

  * `When I {action} the "{child}" {childKind} in the "{parent}" {parentKind}`
  * `When I {action} the "{child}" {childKind} in the "{parent}" {parentKind} {preposition} {amount}`

Where **{preposition}** ∈ `by | to | at` with fixed semantics:

* **by** = relative delta (e.g., fast-forward **by** 10s, zoom **by** 20%)
* **to** = absolute target value (seek **to** 01:23, set volume **to** 50%)
* **at** = absolute position (seek **at** 01:23, crop **at** 200px)

> The concrete examples below are illustrations of this grammar:

* **Press/activate**: `When I press the "{target}" button`
* **Open/Close**: `When I open the "{target}" {kind}` / `When I close the "{target}" {kind}`
* **Expand/Collapse**: `When I expand the "{target}" {kind}` / `When I collapse the "{target}" {kind}`
* **Select/Deselect**: `When I select the "{target}" {kind}` / `When I deselect the "{target}" {kind}`
* **Scoping (child in parent)**: `When I press the "{child}" {childKind} in the "{parent}" {parentKind}`

**Why this works**: consistent author experience, natural phrasing, and one small verb set. The resolver handles specifics based on the control kind and content.

**Property Registry Starter (quick mapping)**

* `volume` → `audio.volume`
* `zoom` → `zoom.scale`
* `page` → `pagination.page`

(Use the property‑of form: `When I {action} the {property} of the "{target}" {kind} …`. See §3.8.6 for the full registry.)

### 3.3 Locator Resolution Algorithm (deterministic & label‑first)

We separate resolving the **control kind** from selecting the **specific target**. This keeps behavior predictable and easy to reason about.

\*\*A) Resolve the \*\*\`\` (type of control)\*\*

1. **ARIA role & properties (preferred)** — e.g., `role=button`, `role=textbox` (+ `aria-multiline=true` ⇒ **text area**), `role=document`/contentEditable ⇒ **editor**, `role=tree`, `role=treeitem`, etc.
2. \`\` (configurable; default `data-testid`).
3. **Stable product attributes** (e.g., app-provided `data-*`).
4. **DOM/CSS hints** (UI‑kit class/structure patterns) — **additive only**, never the sole signal.

> If the author writes just **field**, we infer kind using the same ARIA‑first logic: `textarea` or `textbox[aria-multiline=true]` ⇒ **text area**; contentEditable/`role=document` ⇒ **editor**; otherwise **text field**.

**B) Resolve the target within that kind (label‑first accessible name)** Given the human phrase (e.g., “Name”, “Continue”), match in this exact order:

1. **Associated ****************\`\`**************** text** (explicit `for=` or label-as-ancestor) — *label‑first*.
2. \`\` (referenced element’s text).
3. \`\`.
4. **Role‑based inner text / Accessible Name algorithm** (e.g., button/link text).
5. \`\` attribute.
6. \`\` (if relevant to the kind).
7. \`\` (as a last resort for text inputs).
8. \`\` (after a11y signals to avoid overuse).
9. **Selector hints** if the phrase is clearly a selector or the author used a prefix.

**Heuristics & prefixes**

* Looks like **XPath** (`//` or `.//`) ⇒ treat as XPath.
* Looks like **CSS** (`#`, `.`, `[`, combinators `> + ~`, or pseudo `:`) ⇒ treat as CSS.
* Prefixes override strategy when present: `css:`, `aria:` (accessible name), `text:`, `role:`, `label:`, `placeholder:`, `testid:`, `alt:`, `title:`, `xpath:`.

**Tie‑breakers & ambiguity**

* At each tier, try **exact (case‑insensitive)** → **starts‑with** → **contains**.
* If multiple candidates remain, stop with a guided error (e.g., “Multiple ‘Description’ matches. Try **text area** or **text field** to disambiguate, or add a `data-testid`.").

### 3.4 Supported Prefixes

Prefixes are optional but override resolution when present:

* `css:` — CSS selector
* `aria:` — matches the **computed accessible name** (WAI name algorithm; may include visible text).
* `text:` — Visible text
* `role:` — Explicit role (optionally with name filter)
* `label:` — Associated label text
* `placeholder:` — Input placeholder
* `testid:` — Maps to `data-testid`
* `alt:` — Image alt text
* `title:` — Title attribute
* `xpath:` — XPath selector

Notes:

* `aria:` matches the **computed accessible name** (WAI algorithm; may include visible text). Not for ARIA state attributes.
* `text:` matches **raw visible text only** (not the full accessible name).
* `role:` is used to force a specific role (e.g., `role:button`).
* `id:` is redundant with `css:#id` and is not included.

### 3.5 Control Kinds Catalog (v1)

A **small set of natural control kinds** covers common UI interactions. The resolver may receive `{ kind }` from the step (derived from the noun), but the phrases themselves remain stable.

**Core kinds (80/20 set):**

* **text field** — single‑line text entry (roles: `textbox`; `aria-multiline=false`).

  * *Synonyms accepted*: textbox, text input, field
* **text area** — multi‑line text entry (roles: `textbox` with `aria-multiline=true`, element `textarea`).

  * *Synonyms accepted*: textarea, multiline input, multi-line field
* **editor** — rich text/WYSIWYG editor (contentEditable, `role=document`, or `aria-roledescription="rich text editor"`).

  * *Synonyms accepted*: rich text editor, rich text box, RTE
* **button** — clickable action (role `button`, `input[type=button|submit]`).
* **checkbox/switch** — binary toggle (roles `checkbox`, `switch`).

  * *Synonyms accepted*: checkbox, check box, switch, toggle
* **radio** — radio option (role `radio`).
* **list** — dropdown/select/combobox/listbox (roles: `combobox`, `listbox`; options `option`).

  * *Synonyms accepted*: dropdown, select, combobox, listbox
* **link**, **tab**, **panel**, **dialog**, **table**, **slider**, **uploader**.

**Synonym normalization**: We map common author terms to the canonical kind (e.g., `textbox` → `text field`, `rich text box` → `editor`). This keeps language natural without sacrificing determinism.

**Composite interactions** use the same grammar via **capabilities** (e.g., sorting uses `activatable` on the header; row selection uses `selectable`).

**Kinds ↔ Capabilities (quick reference)**

| Kind              | Capabilities                                                 |
| ----------------- | ------------------------------------------------------------ |
| video             | transport.playback, timeline.seek, timeline.scrub, audio.volume, audio.mute |
| audio             | transport.playback, timeline.seek, timeline.scrub, audio.volume, audio.mute |
| slider            | range.continuous                                             |
| rating            | range.discrete                                               |
| date picker       | calendar.date                                                |
| datetime picker   | calendar.datetime                                            |
| date range picker | calendar.daterange                                           |
| button            | activatable                                                  |
| link              | activatable                                                  |
| tab               | selectable.single                                            |
| panel             | openable                                                     |
| dialog            | openable                                                     |
| table             | (headers) activatable; (rows) selectable                     |
| uploader          | activatable                                                  |
| checkbox/switch   | selectable.single                                            |
| text field        | text.singleline                                              |
| text area         | text.multiline                                               |
| editor            | text.rich                                                    |
| tree              | expandable, selectable.single                                |
| tree item         | expandable, selectable.single                                |
| card (expandable) | expandable                                                   |

**Kinds ↔ Capabilities (quick reference)**

| Kind              | Capabilities                                                 |
| ----------------- | ------------------------------------------------------------ |
| video             | transport.playback, timeline.seek, timeline.scrub, audio.volume, audio.mute |
| audio             | transport.playback, timeline.seek, timeline.scrub, audio.volume, audio.mute |
| slider            | range.continuous                                             |
| rating            | range.discrete                                               |
| date picker       | calendar.date                                                |
| datetime picker   | calendar.datetime                                            |
| date range picker | calendar.daterange                                           |
| button            | activatable                                                  |
| text field        | text.singleline                                              |
| text area         | text.multiline                                               |
| editor            | text.rich                                                    |
| tree              | expandable, selectable.single                                |
| tree item         | expandable, selectable.single                                |
| card (expandable) | expandable                                                   |

### 3.6 Input Value Handling & Safety Rails

**Single‑ vs multi‑line**

* If `{text}` is a **docstring** or contains newlines and the target kind resolves to **text field** (single‑line), **error clearly**:

  > The "{target}" text field is single‑line. Use a text area or provide a single‑line value.
* **text area** accepts newlines; we insert as block text.

**Rich text (editors)**

* For **editor** kinds, content is treated as **rich text** when the value is multi‑line or contains common Markdown cues (e.g., leading `# `, `**bold**`, `_italic_`, list markers, code fences). We convert Markdown → editor actions so formatting is applied. Plain one‑line strings are inserted as unformatted text.
* **text field** / **text area** never apply Markdown semantics; content is inserted literally.

**Kind inference when authors write just "field"**

1. If the resolved element is a `textarea` or `textbox[aria-multiline=true]` → **text area**
2. If it is an editor (contentEditable, `role=document`, editor toolbars present) → **editor**
3. Else → **text field**

**Ambiguity handling**

* If multiple candidates match the same label (e.g., both a text field and text area named "Description"), fail with guidance:

  > Multiple targets match "{target}". Try "text area" or "text field" to disambiguate.

### 3.7 Control Registry (Extending the Language)

Keep the step language small and natural while allowing codebases to add new UI **kinds** (e.g., `card`, `tree`, `tree item`). Authors write human phrases; the resolver uses a **registry** to recognize kinds and perform actions across React, Angular, Vue, etc.

**Authoring pattern**

```
When I open the "Billing" card
When I press the "Edit" button in the "Billing" card
When I expand the "Settings" tree
When I select the "Invoices" tree item
```

> **Kinds bundle capabilities.** A kind is a natural-language label for controls that exhibit a specific set of capabilities. Capabilities define verbs, prepositions, and amount types; kinds only bundle capabilities. See §3.8.

\*\*Identification priority for \*\*\`\`

1. **ARIA roles/properties**
2. \`\`
3. \*\*Stable product \*\*\`\`
4. **DOM/CSS hints** (additive only)

**Registry API (simplified types)**

```ts
export type IdentifyRule =
  | { ariaRole: string; name?: string | RegExp }
  | { testId?: string }
  | { attr: { name: string; value?: string } }
  | { css: string }
  | { predicate: (el: Element) => boolean };

export type ActionRecipe =
  | { click: 'root' | string }
  | { keyboard: string }
  | ((ctx: LocatorContext) => Promise<void>);

export type ControlKind = {
  kind: string;                 // kebab-case id, e.g., 'card', 'tree item'
  synonyms?: string[];          // natural names authors may use
  identify: IdentifyRule[];     // strongest first (prefer ARIA)
  parts?: Record<string, IdentifyRule>; // e.g., header/body/actions, node/toggle
  overrides?: Partial<{
    press: ActionRecipe;
    open: ActionRecipe; close: ActionRecipe;
    expand: ActionRecipe; collapse: ActionRecipe;
    select: ActionRecipe; deselect: ActionRecipe;
  }>;
  adapters?: {                  // optional UI kit hints (additive, not required)
    mui?: { identify?: IdentifyRule[]; parts?: Record<string, IdentifyRule> };
    ngMaterial?: { identify?: IdentifyRule[]; parts?: Record<string, IdentifyRule> };
  };
};

export function registerControlKind(def: ControlKind): void;
```

**Examples**

*Card*

```ts
registerControlKind({
  kind: 'card',
  synonyms: ['tile'],
  identify: [
    { ariaRole: 'region' },
    { css: '[class*="card"], .mat-card, .MuiCard-root' } // additive hints
  ],
  parts: {
    header: { css: ':scope [class*="header"], :scope .mat-card-title, :scope .MuiCardHeader-root' },
    body:   { css: ':scope [class*="content"], :scope .mat-card-content, :scope .MuiCardContent-root' },
    actions:{ css: ':scope [class*="actions"], :scope .mat-card-actions, :scope .MuiCardActions-root' }
  },
  overrides: {
    open:   { click: 'header' },
    select: { click: 'root' }
  },
  adapters: { mui: {}, ngMaterial: {} }
});
```

*Tree & Tree Item*

```ts
registerControlKind({
  kind: 'tree',
  identify: [{ ariaRole: 'tree' }],
  parts: {
    node:   { ariaRole: 'treeitem' },
    toggle: { css: ':scope [aria-expanded], :scope [role=button]' }
  },
  overrides: { expand: { click: 'toggle' }, collapse: { click: 'toggle' }, select: { click: 'node' } }
});

registerControlKind({
  kind: 'tree item',
  synonyms: ['node'],
  identify: [{ ariaRole: 'treeitem' }],
  overrides: {
    expand: { keyboard: '{ArrowRight}' },
    collapse: { keyboard: '{ArrowLeft}' },
    select: { click: 'root' }
  }
});
```

**Scoping grammar (child in parent)**

```
When I press the "{child}" {childKind} in the "{parent}" {parentKind}
```

Examples:

```
When I press the "Delete" button in the "Billing" card
When I press the "Toggle" button in the "Settings" tree item
```

**Error handling**

* *Unknown kind*: “`badge` isn’t a known control kind. Known kinds: … Register it or use a different noun.”
* *Ambiguous target*: “Multiple ‘Billing’ cards found. Add a `data-testid` or reference a parent (e.g., ‘in the "Accounts" panel’).”
* *Unsupported action*: “`expand` isn’t defined for `card`. Supported: press, open, select.”

**Multi‑UI support**

* DOM/ARIA‑first flows make kinds framework‑agnostic.
* UI‑kit adapters add recognition hints for MUI, Angular Material, etc., but are optional.
* All actions operate on the rendered DOM via Playwright; no React/Angular APIs required.

**Naming & conventions**

* Kinds: kebab‑case (spaces normalized), synonyms are natural words authors already use.
* Parts: nouns authors might reference (`header`, `actions`, `toggle`, `label`).
* Deterministic hooks: prefer `data-testid` when a11y isn’t sufficient.

---

### 3.8 Capability Catalog & Action Registry

**Capabilities are the center of the model.** They define which **verbs** exist, which **prepositions** they accept, and which **amount types** are valid. A **kind** is just a bundle of capabilities and may have multiple natural-language labels (synonyms) that authors use.

#### 3.8.1 Unified action grammar (recap)

* `When I {action} the "{target}" {kind}`
* `When I {action} the "{target}" {kind} {preposition} {amount}`
* **Property‑of variant**:

  * `When I {action} the {property} of the "{target}" {kind}`
  * `When I {action} the {property} of the "{target}" {kind} {preposition} {amount}`
* **Scoping**: `… the "{child}" {childKind} in the "{parent}" {parentKind} …`

**Prepositions (fixed semantics)**: **by** (relative delta), **to** (absolute target), **at** (absolute position).

#### 3.8.2 Amount types (measures) & parsing precedence

We normalize **{amount}** using Cucumber ParameterTypes. Precedence (highest first):

1. `duration` — `10s`, `1m30s`, `00:10`, `1:30`, `1h2m3s`
2. `timecode` — `01:23`, `1:23:45`
3. `percent` — `50%` (also accept `50`)
4. `index` — `#3`, `index 3`
5. `number` — `123`, `3.14` (units optional if requested)
6. `enum` — closed sets (e.g., `top|bottom`, `muted|unmuted`, `next|previous`)
7. `string` — fallback literal

#### 3.8.3 Capability catalog (v1)

Each row: **Capability → verbs → allowed {preposition} {amount} → notes**

**Core interaction**

* **activatable** → `press` → *(no preposition)*.
* **expandable** → `expand | collapse | toggle` → *(no preposition)*.
* **openable** → `open | close` → *(no preposition)*.
* **selectable.single** → `select | deselect` → *(no preposition)*.
* **selectable.multi** → `select | deselect` → *(no preposition)*.

**Text (validation only — the dedicated text step in §3.2 applies)**

* **text.singleline** → `set` → `to {string}` — rejects multi-line/docstrings.
* **text.multiline** → `set` → `to {string}` — accepts multi-line/docstrings.
* **text.rich** → `set` → `to {string}` — multi-line/Markdown cues → rich formatting.

**Ranges & numeric**

* **range.continuous** → `set | adjust` → `to {percent|number}` · `by {percent|number}`.
* **range.discrete** → `set | adjust` → `to {index|number|enum}` · `by {number}`.

**Temporal controls (specific)**

* **transport.playback** → `play | pause | resume | stop | toggle-playback` → *(no preposition)*.
* **timeline.seek** → `seek` → `to|at {timecode}`.
* **timeline.scrub** → `fast-forward | rewind` → `by {duration}`.
* **audio.volume** → `set volume | change volume` → `to {percent}` · `by {percent}`.
* **audio.mute** → `mute | unmute | toggle-mute` → *(no preposition)* or `to {enum(muted|unmuted)}`.

**Viewport & navigation**

* **viewport.scroll** → `scroll` → `by {number(px)} | to {number(px)|enum(top|bottom)} | at {index}`.
* **zoom.scale** → `zoom` → `to {percent} | by {percent}`.
* **pagination.page** → `go | navigate` → `to {index} | to {enum(next|previous|first|last)}`.

**Date/time inputs**

* **calendar.date** → `set` → `to {date}`.
* **calendar.datetime** → `set` → `to {datetime}`.
* **calendar.daterange** → `set` → `to {daterange}`.

> We’ll extend this table with real affordances (e.g., `image.rotate`, `map.pan`) as needed.

#### 3.8.4 Validation (deterministic)

1. Canonicalize `{action}` and `{kind}` (synonyms → canonical).
2. Resolve the **kind** and target (label-first, §3.3) and gather the kind’s **capabilities**.
3. Find the **capability** that owns `{action}`.
4. Verify the chosen **{preposition}** is allowed for that action under that capability.
5. Parse **{amount}** to a permitted **amount type** for that preposition.
6. If any check fails, produce a clear, non-ambiguous message:

   * **Wrong preposition**: `“fast-forward” uses **by {duration}** (relative jump). For an absolute time, use “seek … to {timecode}”.`
   * **Wrong amount type**: `“seek” needs **to/at {timecode}**. “50%” isn’t a timecode. Example: “… to 01:23”.`
   * **Action not valid for kind**: `“enter” requires a text input. “button” is activatable. Try “press”.`

#### 3.8.5 Registry shapes (concise)

**Capabilities own verbs & typing**

````ts
type AmountType =
  | 'duration' | 'timecode' | 'percent' | 'number' | 'index'
  | 'enum' | 'date' | 'datetime' | 'daterange' | 'string';

type CapabilityVerbSpec = {
  preposition?: 'by' | 'to' | 'at';   // undefined = no preposition
  amountTypes?: AmountType[];         // allowed measures for that preposition
  handler?: ActionRecipe;             // default behavior; kinds may override
};

type CapabilityDef = {
  id: string; // e.g., 'audio.volume'
  verbs: Record<string, CapabilityVerbSpec>;
};

export function registerCapability(def: CapabilityDef): void;

// Examples
registerCapability({
  id: 'timeline.scrub',
  verbs: {
    'fast-forward': { preposition: 'by', amountTypes: ['duration'] },
    'rewind':       { preposition: 'by', amountTypes: ['duration'] }
  }
});

registerCapability({
  id: 'timeline.seek',
  verbs: {
    'seek.to': { preposition: 'to', amountTypes: ['timecode'] },
    'seek.at': { preposition: 'at', amountTypes: ['timecode'] }
  }
});

registerCapability({
  id: 'audio.volume',
  verbs: {
    'set volume':    { preposition: 'to', amountTypes: ['percent'] },
    'change volume': { preposition: 'by', amountTypes: ['percent'] },
    'increase':      { preposition: 'by', amountTypes: ['percent'] },
    'decrease':      { preposition: 'by', amountTypes: ['percent'] }
  }
});

registerCapability({
  id: 'audio.mute',
  verbs: {
    'mute': {},
    'unmute': {},
    'toggle-mute': {},
    'set mute': { preposition: 'to', amountTypes: ['enum'] } // enum: muted|unmuted
  }
});
```ts
````

**Kinds bundle capabilities (DOM/ARIA-first)**

````ts
// Example: a kind that bundles multiple capabilities
registerControlKind({
  kind: 'video',
  synonyms: ['video player'],
  capabilities: [
    'transport.playback',
    'timeline.seek',
    'timeline.scrub',
    'audio.volume',
    'audio.mute'
  ],
  identify: [{ css: 'video, [data-role="video"]' }, { ariaRole: 'application' }]
});
```ts
````

**(Optional) Action synonyms**

````ts
type ActionSynonymDef = {
  name: string;           // canonical action name
  synonyms?: string[];    // author-facing variants
  capability: string;     // e.g., 'timeline.seek'
};

export function registerAction(def: ActionSynonymDef): void;

// Example
registerAction({ name: 'seek', synonyms: ['jump'], capability: 'timeline.seek' });
```ts
````

#### 3.8.6 Property Registry (property → capability)

* `volume` → `audio.volume` (synonyms: sound, audio level)
* `zoom` → `zoom.scale`
* `page` → `pagination.page`

#### 3.8.7 Worked example: audio.volume

```gherkin
When I set the volume of the "Product Demo" video to 25%
When I increase the volume of the "Product Demo" video by 10%
When I set the "Volume" slider in the "Product Demo" video to 25%
```

* **Prepositions & amount**: `to {percent}` (absolute), `by {percent}` (delta). Other types are rejected with a clear error.

## 4. Metadata Conventions

* Use the standard attribute `data-testid="<token>"`.
* Framework samples must decorate key controls with this attribute only when accessibility lookups cannot provide a deterministic reference.
* Document how to phrase tokens (`kebab-case`, matching the human phrase where possible).

Example React markup sketch:

```tsx
<label data-testid="name-field">
  Name
  <input type="text" />
</label>

<button data-testid="continue-button">Continue</button>
```

If `data-testid` is missing, we fall back to accessible names. This encourages teams to keep controls accessible and gives us deterministic fallback behavior when absolutely necessary.

---

## 5. Implementation Plan (after approval)

### Phase A – Finalize Language Spec (Doc + Canon)

1. **Lock unified action grammar**: keep the dedicated text step; add the generic action pattern and the **property‑of** clause:

   * `When I {action} the "{target}" {kind} {preposition?} {amount?}`
   * `When I {action} the {property} of the "{target}" {kind} {preposition?} {amount?}`
2. **Capability‑centric spec**: finish **§3.8 Capability Catalog** with precise, leaf capabilities (no vague buckets) and preposition/amount typing per verb.
3. **Property Registry**: define initial `property → capability` mappings (e.g., `volume → audio.volume`, `zoom → zoom.scale`, `page → pagination.page`).
4. **Kinds ↔ Capabilities table**: add a small reference mapping common kinds to bundled capabilities (video, audio, slider, date picker, tree item, etc.).
5. **Error language**: codify clear, non‑ambiguous messages for wrong preposition/amount/kind.
6. **Consistency sweep**: ensure §3.1/§3.3/§3.4 reflect label‑first, prefix short‑circuiting, and remove any verb lists from the kind registry section.

**Exit criteria:** spec text updated; examples include a worked example (e.g., **audio.volume**) using both direct and property‑of forms.

---

### Phase B – Plumbing & Utilities (Code)

1. **Capability Registry**: verbs → allowed prepositions → allowed amount types → default handler.
2. **Property Registry**: property synonyms → capability id.
3. **Action Registry (optional)**: action synonyms → capability (override/default recipes if needed).
4. **ParameterTypes** for `{amount}`: duration, timecode, percent, index, number(+unit), enum, date/datetime/daterange, string (with parsing precedence).
5. **Generic step definitions** (two shapes): direct target & property‑of target; both support scoping `… in the "{parent}" {parentKind}`.
6. **Routing & validation**: canonicalize `{action}/{kind}`, resolve target (label‑first), validate against capability (verb→prep→amount), execute handler (kind override if present).
7. **Resolver enhancements**: keep prefix overrides; expose `{ kind }` hints; no framework coupling.
8. **Test harness**: unit tests for parsing/validation; integration tests with demo pages (video/audio/slider/date picker/tree).

**Exit criteria:** steps pass suites; invalid combos produce the documented errors.

---

### Phase C – Shared Assets Update (Samples & Corpus)

1. Update sample markup (React + Angular) with minimal `data-testid` where a11y isn’t sufficient.
2. **Feature corpus migration**:

   * Convert old selector‑centric steps to the canonical text step and unified action grammar.
   * Prefer **property‑of** phrasing for attribute‑like actions (volume, zoom, page).
3. Add **Worked Examples** features: `audio.volume`, `timeline.seek/scrub`, `zoom.scale`, `calendar.date`.
4. Ship initial **Kinds ↔ Capabilities** table alongside examples for quick author onboarding.

**Exit criteria:** corpus compiles and runs green using the new grammar; examples cover each capability family.

---

### Phase D – Documentation & Guardrails

1. Expand §3.2 with concise reference of the two step shapes (direct, property‑of) and scoping.
2. Document **preposition semantics** (by/to/at) and **amount** typing.
3. Contributor guide: how to add a capability/kind/property; style for synonyms; do’s/don’ts.
4. Optional lints: flag unsupported verbs on kinds; suggest property‑of wording for attribute‑like actions.

**Exit criteria:** docs published; examples link directly from catalog rows.

---

### Phase E – Rollout & Migration Aids

1. Provide simple codemods or regex recipes to migrate common legacy forms.
2. Add CI checks to block unsupported combinations and recommend canonical phrasing.
3. Telemetry (optional): log unknown kinds/properties to refine catalogs.

**Exit criteria:** teams can adopt incrementally with low churn; unknowns are discoverable.

## 6. Implementation Sketch

*Implementation sketch*

```ts
// packages/behavior-driven-ui/src/locators/resolve-target.ts
export async function resolveTarget(
  world: World,
  phrase: string,
  options: { kind?: 'text field' | 'text area' | 'editor' | 'button' | 'list' | 'link' | 'tab' | 'panel' | 'dialog' | 'table' | 'slider' | 'uploader' | 'tree' | 'tree item' | 'card' }
): Promise<Locator> {
  // 1. normalize phrase
  // 2. if a known prefix is present, APPLY IT (override)
  // 3. heuristics for CSS/XPath (if it clearly looks like a selector)
  // 4. resolve KIND (ARIA → data-testid → product data-* → CSS hints)
  // 5. label-first accessible name matching (label → aria-labelledby → aria-label → role+name → title → alt → placeholder → text)
  // 6. if still unresolved, try data-testid as a final declarative escape hatch
  // 7. throw descriptive error if unresolved
}

// Step usage
const target = await resolveTarget(this, targetPhrase, { kind: 'button' });
await this.driver.click(target);

// Action routing (generic action steps):
// a) Parse: {action} "{target}" {kind} [ {preposition} {amount} ] [ in "{parent}" {parentKind} ].
// b) Canonicalize {action} & {kind} via registries (property → capability if present).
// c) Validate via capability: verb → allowed preposition → allowed amount types.
// d) Parse {amount} via ParameterTypes (duration, timecode, percent, number, index, enum, date/datetime/daterange).
// e) Resolve target label-first (§3.3); execute capability handler (kind override if defined).
```

---

*Prepared by:* Codex (GPT-5) *Status:* Draft for review
