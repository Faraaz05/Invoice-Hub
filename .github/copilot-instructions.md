# GitHub Copilot Instructions — InvoiceHub Frontend Styling (Updated)

## General UI/UX Principles
- **Overall Style:** Minimalistic, sleek, professional. Avoid all emojis. Typography and spacing should be consistent.
- **Corners:** Use **subtle rounded corners** (4px–6px) instead of very rounded or “pill-shaped” elements.
- **Theme:** Light mode default; dark mode optional.
- **Typography:** Clean, readable fonts (Inter, Roboto, Sans-Serif). Consistent font sizes for headings, subheadings, body text.
- **Spacing:** Consistent spacing scale (4px / 8px / 16px / 24px).
- **Colors:** Professional palette with 2–3 primary colors, 1 accent color, neutral backgrounds (white/light gray), subtle shadows.
- **Responsiveness:** Mobile-first, fully responsive design.

---

## Component Guidelines (Corners Updated)

### Cards
- **Corner radius:** 4–6px.
- Shadow: subtle (`shadow-md`).
- Padding: 16–24px.
- Headers: bold, slightly larger than body text.
- Footer: for actions or summary.

### Buttons
- **Corner radius:** 4–6px.
- Hover: subtle background/shadow change.
- Disabled state: gray, non-clickable, tooltip optional.
- Height: consistent (40px–48px).

### Tables
- Slightly rounded corners for table container: 4px–6px.
- Column headers: bold with subtle background.
- Rows: striped or hover highlight.
- Pagination: minimal, consistent styling.

### Forms & Inputs
- **Corner radius:** 4–6px.
- Border and shadow: subtle.
- Validation messages: professional colors (red for error, green for success).
- Required fields: asterisk or label text, no emojis.

### Modals / Dialogs
- **Corner radius:** 4–6px.
- Centered, responsive.
- Overlay: semi-transparent dark background.
- Padding: 24px inside modal.
- Titles: bold, clear hierarchy.
- Buttons consistent with primary/secondary rules.

---

## Dashboard & Charts
- Cards and chart containers: subtle corner radius 4–6px.
- Chart elements: professional color palette.
- Tooltips: concise, professional, readable.

---

## Copilot Usage Notes
- Prioritize **subtle corners** (4–6px) over exaggerated rounding.
- Maintain professional, sleek, emoji-free UI.
- Suggest **modular, reusable components** with consistent corner radii.
- Avoid decorative shapes; keep design clean, functional, and corporate.

