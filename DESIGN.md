# Collectives Design System

Design tokens, color palettes, and component styling conventions for the Club Alpin Français (CAF) d'Annecy event management platform.

---

## 1. Brand Identity & Principles

* **Brand Primary:** `$blumine: #1D6989` — A deep alpine ocean blue (HSL: 198°, 65%, 32.5%).
* **Brand Accents:** `$cerulean: #00A5CC` (Light Primary), `$shakespeare: #4BBEDB`, `$scooter: #39A9DC` (Secondaries).
* **Harmonized Neutrals:** Rather than un-tinted neutral grays, UI neutrals are tinted with the brand blue's 198° hue to ensure harmony across cards, inputs, pills, and backgrounds.
* **Accessibility (WCAG 2.1 AA):**
  * Normal text and interactive input placeholders must meet a minimum contrast ratio of **4.5:1** against their background.
  * Component boundaries, icons, and focus rings must meet a minimum of **3:1** (WCAG 1.4.11).

---

## 2. Color Palettes

### 2.1 CAF Brand Blue Palette (50–950)
Primary chromatic scale for interactive controls, active badges, highlights, and focus rings. Centered on `$blumine` (`#1D6989` at step 600).

| Token | Hex | RGB | Lightness | Contrast on `#FFF` | Semantic Role |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `$color-blue-50` | `#ECF5F9` | `rgb(236, 245, 249)` | 95% | 1.11:1 | Soft backgrounds, active item tint |
| `$color-blue-100` | `#D0E7F1` | `rgb(208, 231, 241)` | 88% | 1.28:1 | Light badges, subtle hovers |
| `$color-blue-200` | `#A0CFE3` | `rgb(160, 207, 227)` | 76% | 1.68:1 | Muted borders, inactive chips |
| `$color-blue-300` | `#64B5D8` | `rgb(100, 181, 216)` | 62% | 2.30:1 | Secondary iconography, decorative lines |
| `$color-blue-400` | `#2F99C6` | `rgb(47, 153, 198)` | 48% | 3.23:1 | Standout UI accents, charts |
| `$color-blue-500` | `#227AA0` | `rgb(34, 122, 160)` | 38% | 4.82:1 | High-contrast secondary buttons |
| **`$color-blue-600`** | **`#1D6989`** | **`rgb(29, 105, 137)`** | **32.5%** | **6.28:1** | **Brand Primary Dark (`$blumine`)** |
| `$color-blue-700` | `#17546D` | `rgb(23, 84, 109)` | 26% | 8.32:1 | Button hover & active states |
| `$color-blue-800` | `#124054` | `rgb(18, 64, 84)` | 20% | 11.13:1 | High-contrast badges |
| `$color-blue-900` | `#0C2D3B` | `rgb(12, 45, 59)` | 14% | 14.44:1 | Deep dark text, dark mode headers |
| `$color-blue-950` | `#071D27` | `rgb(7, 29, 39)` | 9% | 17.30:1 | Maximum contrast dark headers |

### 2.2 CAF Slate Neutral Palette (50–950)
Cool neutral scale tinted with the CAF blue hue (H=198°, S=17%). Provides refined UI tokens aligned with modern component themes (e.g. Tailwind / PrimeVue Aura Slate).

| Token | Hex | RGB | Contrast on `#FFF` | Semantic Role |
| :--- | :--- | :--- | :--- | :--- |
| `$color-slate-50` | `#F2F6F7` | `rgb(242, 246, 247)` | 1.09:1 | Input & filter panel background |
| `$color-slate-100` | `#E0E8EB` | `rgb(224, 232, 235)` | 1.24:1 | Subtle dividers, row striping |
| `$color-slate-200` | `#C2D0D6` | `rgb(194, 208, 214)` | 1.58:1 | Input & card borders |
| `$color-slate-300` | `#9FB3BC` | `rgb(159, 179, 188)` | 2.18:1 | Disabled input borders |
| `$color-slate-400` | `#7C96A2` | `rgb(124, 150, 162)` | 3.12:1 | Tertiary icons, subtle chevrons |
| **`$color-slate-500`** | **`#5D7B86`** | **`rgb(93, 123, 134)`** | **4.52:1** | **`$color-placeholder` / `$pale-sky` (WCAG AA)** |
| `$color-slate-600` | `#4F6872` | `rgb(79, 104, 114)` | 5.91:1 | Secondary body copy |
| `$color-slate-700` | `#3D535C` | `rgb(61, 83, 92)` | 8.11:1 | Primary body text |
| `$color-slate-800` | `#2C3D44` | `rgb(44, 61, 68)` | 11.30:1 | Sub-headings, active tab labels |
| `$color-slate-900` | `#1D2A30` | `rgb(29, 42, 48)` | 14.73:1 | Primary headings (`h1`, `h2`) |
| `$color-slate-950` | `#121D21` | `rgb(18, 29, 33)` | 17.16:1 | High-contrast text |

---

## 3. Form Controls & Placeholder Conversion

### 3.1 Conversion Rationale
* **Legacy Production:** PrimeVue Aura theme used `#64748b` (Slate 500, `rgb(100, 116, 139)`, 4.61:1 contrast). While soft and modern, it carries a generic 215° hue unrelated to the brand identity.
* **Previous Local:** Used `$color-gray-medium` (`$dove-gray: #706F6F`), an un-tinted warm gray that looked disconnected from the blue brand accents.
* **New Conversion:** Uses **`$color-placeholder` / `$color-slate-500` (`#5D7B86`, `rgb(93, 123, 134)`)**:
  * Directly derived from CAF brand blue (`#1D6989`, H=198°).
  * Measures **4.52:1** contrast on `#FFFFFF`, satisfying WCAG AA for normal text.
  * Harmonizes naturally with the search bar, calendar trigger, activity filter, and filter badges.

### 3.2 CSS Custom Properties
Exposed globally in `frontend/src/styles/primereact-theme.scss`:

```scss
:root,
body {
    --primary-color: #{$color-blue-primary-dark};
    --primary-color-text: #{$color-white};
    --highlight-bg: #{$color-blue-bg-light};
    --highlight-text-color: #{$color-blue-primary-dark};
    --font-family: #{$font-family-primary};
    --focus-ring: 0 0 0 2px rgba(29, 105, 137, 0.25);
    --maskbg: rgba(0, 0, 0, 0.4);
    --placeholder-color: #{$color-placeholder};
}
```

---

## 4. Typography

* **Primary Font Family:** `DIN, "San Francisco", sans-serif`
* **Root & Element Inheritance:** `:root`, `html`, `body`, `button`, `input`, `select`, and `textarea` explicitly enforce the primary font family to prevent third-party theme font leakage (such as Inter from PrimeReact base themes).
* **Buttons:**
  * Font Family: `DIN, "San Francisco", sans-serif`
  * Size: `16px` (`1rem`, `$font-size-s`)
* **Accordion Date Headers:**
  * Font Family: `DIN, "San Francisco", sans-serif`
  * Size: `16px` (`1rem`, `$font-size-s`)
  * Weight: `600`
  * Color: `$color-gray-dark` (`#16181E`)
* **Filter Inputs & Placeholders:**
  * Size: `16px` (`1rem`, `$font-size-s`)
  * Line Height: `24px` (`1.5`)
  * Weight: `400` (`normal`)
  * Color: `$color-placeholder` (`#5D7B86`)

---

## 5. File Architecture

* `collectives/static/css/variables/colors.scss`: Source of truth for Sass color tokens and scales.
* `frontend/src/styles/primereact-theme.scss`: Global PrimeReact CSS variable mapping and theme overrides.
* `frontend/src/islands/EventList/EventList.scss`: Island-specific styling for the event search and filter controls.
