---
name: Sun HSK
description: Comprehensive HSK preparation tool combining rote memorization and practical application.
colors:
  primary: "#2382f6"
  primary-deep: "#1557c0"
  primary-light: "#eaf4ff"
  primary-bg: "#f5faff"
  neutral-text: "#142033"
  neutral-muted: "#60708a"
  neutral-line: "#dce8f6"
  neutral-bg: "#ffffff"
  semantic-danger: "#e5484d"
  semantic-success: "#18a66b"
typography:
  display:
    fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(40px, 5vw, 68px)"
    fontWeight: 800
    lineHeight: 1.05
    letterSpacing: "-2.4px"
  body:
    fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 400
    lineHeight: 1.75
rounded:
  sm: "13px"
  md: "18px"
  lg: "22px"
  full: "999px"
spacing:
  container: "1160px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.neutral-bg}"
    rounded: "{rounded.sm}"
    padding: "13px 20px"
  card:
    backgroundColor: "{colors.neutral-bg}"
    rounded: "{rounded.md}"
    padding: "22px 24px"
---

# Design System: Sun HSK

## Overview

**Creative North Star: "The Academic Accelerator"**

This system projects a friendly, encouraging, and bright atmosphere designed to motivate students tackling the rigorous HSK exams. We rely on a vibrant electric blue to highlight progress and action, paired with a crisp and structured component philosophy. The interface is heavily structured with defined borders, flat colors, and tight internal spacing to keep the focus purely on the content, ensuring study sessions are distraction-free yet visually uplifting.

**Key Characteristics:**
- **Friendly & Encouraging:** Bright highlights and ample breathing room.
- **Crisp & Structured:** Defined borders and tight spacing for clarity.
- **Layered & Lifted:** Interactive elements confidently float above the surface.

## Colors

The palette is driven by a vibrant electric blue that cuts through neutral backgrounds, providing clarity and focus.

### Primary
- **Vibrant Electric Blue** (`#2382f6`): The core action color for primary buttons, highlights, and active states.
- **Deep Academic Blue** (`#1557c0`): Used for interactive gradients, strong emphasis, and hover states.
- **Soft Blue Background** (`#f5faff`): A gentle, encouraging backdrop for sections and large surfaces.
- **Blue Tint** (`#eaf4ff`): Used for subtle highlights and component backgrounds (like eyebrows).

### Semantic
- **Danger** (`#e5484d`): Error states and destructive actions.
- **Success** (`#18a66b`): Completion and positive feedback.

### Neutral
- **Text Primary** (`#142033`): Deep navy-tinted near-black for maximum contrast and readability on white.
- **Text Muted** (`#60708a`): Used for secondary descriptions, tags, and metadata.
- **Line / Border** (`#dce8f6`): A crisp, cool-toned gray-blue for structure and defined borders.
- **Surface** (`#ffffff`): The stark white canvas for reading and focus.

## Typography

**Display Font:** Inter (with system fallbacks)
**Body Font:** Inter (with system fallbacks)

**Character:** Highly legible, modern, and serious. The very tight letter spacing on display sizes creates a dense, commanding presence that contrasts with the airy body text.

### Hierarchy
- **Display** (800/900 weight, `clamp(40px, 5vw, 68px)`, 1.05 lh): Used for hero headings. Letter spacing is pulled very tight (`-2.4px`).
- **Title** (800 weight, 16px, 1.35 lh): Used for card headings and section titles.
- **Body** (400 weight, 18px, 1.75 lh): Used for explanatory text and long-form reading.
- **Label / Eyebrow** (800 weight, 13px): Used for small pill badges and metadata, often coupled with tight padding.

### Named Rules
**The Tight Headline Rule.** Display typography must always feel dense. Use extremely tight letter-spacing on large headers to anchor the page structure.

## Layout

The layout uses a constrained central column `min(1160px, calc(100% - 40px))` that tightens on mobile devices (24px padding). The rhythm favors clear grid structures (often `1.02fr 0.98fr` splits in heroes) with generous vertical padding (up to 78px between sections) to create an encouraging, breathable pacing.

## Elevation & Depth

Layered and lifted. Cards visibly float above the background, using deep, diffuse blue-tinted shadows to create a sense of height. 

### Shadow Vocabulary
- **Global Lift** (`0 18px 50px rgba(16, 70, 140, 0.12)`): The default structural shadow for large floating elements.
- **Hover Lift** (`0 14px 40px rgba(16, 70, 140, 0.1)`): Applied to cards when hovered, paired with a slight upward translation (`-3px`).
- **Button Glow** (`0 10px 24px rgba(23, 105, 224, 0.24)`): A tighter, more saturated shadow for primary calls to action.

### Named Rules
**The Lifted Surface Rule.** Interactive cards should rise towards the user. Hover states should combine a `translateY` lift with an intensified shadow, never just a color change.

## Shapes

The form language is remarkably soft and rounded globally (`22px` root radius), but components use slightly tighter radii (`13px` for buttons, `18px` for cards) to maintain a crisp, structured feel within the softer overall container.

## Components

### Buttons
- **Shape:** `13px` radius.
- **Primary:** Gradient background (`#1557c0` to `#2382f6`) with white text, strong glowing shadow (`0 10px 24px`).
- **Hover / Focus:** Translates up `-2px`, shadow deepens.
- **Outline:** White background, `#1557c0` text, `1.5px` border in `#bcd4f3`.

### Cards
- **Corner Style:** `18px` radius.
- **Background:** Crisp white (`#ffffff`).
- **Shadow Strategy:** Flat or subtle border at rest, lifting significantly on hover with `translateY(-3px)` and enhanced shadow.
- **Border:** `1.5px` solid `#dce8f6`, transitioning to `#c2dcfa` on hover.
- **Internal Padding:** `22px 24px`.

### Badges / Eyebrows
- **Style:** Pill-shaped (`999px` radius), typically light blue background (`#eaf4ff`) with dark blue text (`#1557c0`) and a subtle border.
- **Typography:** Heavy weight (800) with smaller sizing (11px-13px).

## Do's and Don'ts

### Do:
- **Do** use the vibrant electric blue `#2382f6` to signal primary actions and progress.
- **Do** wrap large hero sections in subtle gradients or soft backgrounds (`#f5faff`) to differentiate from the crisp white content areas.
- **Do** lift interactive elements on hover (e.g., `-3px` translation for cards, `-2px` for buttons).

### Don't:
- **Don't** use overly flat or sharp corners for major structural components; respect the `13px` to `18px` radius scale.
- **Don't** loosen the letter-spacing on display typography; keep it dense (`-2.4px`).
- **Don't** clutter cards; maintain the crisp, structured philosophy with clear borders (`1.5px`) and defined padding.
