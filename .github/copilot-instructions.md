# GitHub Copilot Instructions: InvoiceHub Frontend UI/UX

## 1. Core Philosophy & Vision

**Guiding Principle:** Create a minimalist, content-focused, and highly functional user interface inspired by the clean aesthetics of Notion.so. The UI must feel professional, intuitive, and calm. Prioritize clarity, consistency, and performance. **Avoid all visual clutter, unnecessary decorations, and emojis.**

**Copilot's Role:** Act as a frontend developer partner who is an expert in this specific design system. All generated code, from single components to entire pages, must strictly adhere to the tokens and guidelines defined below. When in doubt, err on the side of simplicity and minimalism.

**Development Process:** The backend for this application is already complete. The frontend will be built **incrementally** through a series of step-by-step prompts. Your task is to focus *only* on the specific component or feature requested in each prompt. Do not generate code for future steps or unrelated parts of the application.

**Pre-flight API Check:** Before implementing any frontend component that consumes data, your first task will be to generate a simple test script (e.g., using Node.js with `axios` or `node-fetch`). This script must call the relevant backend endpoint(s), log the complete response, and verify the expected JSON structure. This step is mandatory to ensure the API contract is clear before any UI code is written.

---

## 2. Design System: Foundation & Tokens

### 2.1. Color Palette

Use these exact HEX codes. Do not introduce new colors. This is a light-mode-only application.

-   **Primary Action (Buttons, Links):** `#2563EB` (Blue 600)
-   **Background - Primary:** `#FFFFFF` (White)
-   **Background - Secondary (Subtle backgrounds, sidebars):** `#F8F9FA` (Gray 50)
-   **Background - Tertiary (Hover states, active items):** `#F1F3F5` (Gray 100)
-   **Text - Primary (Headings, important text):** `#111827` (Gray 900)
-   **Text - Secondary (Body text, labels):** `#4B5563` (Gray 600)
-   **Text - Tertiary (Placeholders, disabled text):** `#9CA3AF` (Gray 400)
-   **Border - Standard:** `#E5E7EB` (Gray 200)
-   **Border - Focus:** `#3B82F6` (Blue 500)
-   **Feedback - Success:** `#16A34A` (Green 600)
-   **Feedback - Error:** `#DC2626` (Red 600)
-   **Feedback - Warning:** `#F59E0B` (Amber 500)

### 2.2. Typography

-   **Font Family:** `Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`
-   **Base Font Size:** `16px`

#### Type Scale
-   **Display (`h1`):** `2.25rem` (36px), `font-weight: 700`
-   **Heading 1 (`h2`):** `1.875rem` (30px), `font-weight: 700`
-   **Heading 2 (`h3`):** `1.5rem` (24px), `font-weight: 600`
-   **Heading 3 (`h4`):** `1.25rem` (20px), `font-weight: 600`
-   **Body Large:** `1.125rem` (18px), `font-weight: 400`
-   **Body (default):** `1rem` (16px), `font-weight: 400`, `line-height: 1.6`
-   **Small/Caption:** `0.875rem` (14px), `font-weight: 400`
-   **Extra Small/Label:** `0.75rem` (12px), `font-weight: 500`, `text-transform: uppercase`, `letter-spacing: 0.05em`

### 2.3. Spacing & Sizing

Adhere to an 8-point grid system. All margins, paddings, and layout gaps should be a multiple of 8px.
-   `space-1`: `4px`
-   `space-2`: `8px`
-   `space-3`: `12px`
-   `space-4`: `16px`
-   `space-5`: `24px`
-   `space-6`: `32px`
-   `space-7`: `48px`
-   `space-8`: `64px`

### 2.4. Borders & Shadows

-   **Corner Radius:**
    -   `radius-sm`: `4px` (Inputs, smaller elements)
    -   `radius-md`: `6px` (Cards, Modals, Buttons)
-   **Border Width:** `1px` solid for all standard borders. `2px` for focus rings.
-   **Shadows (Subtle):**
    -   `shadow-sm`: `0 1px 2px 0 rgb(0 0 0 / 0.05)`
    -   `shadow-md`: `0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)` (Used for Cards, Popovers)
    -   `shadow-lg`: `0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)` (Used for Modals)

---

## 3. Component-Specific Guidelines

### 3.1. Buttons
-   **General:** `height: 40px`, `padding: 0 16px`, `font-weight: 500`, `border-radius: 6px`, smooth transitions on `background-color` and `box-shadow`.
-   **Primary:** Solid background (`Primary Action` color), white text. On hover, slightly darken background.
-   **Secondary:** Transparent background, `1px` solid border (`Border - Standard`), text color is `Text - Primary`. On hover, use `Background - Tertiary`.
-   **Tertiary/Ghost:** No background, no border. Text color is `Text - Secondary`. On hover, background becomes `Background - Tertiary`.
-   **Destructive:** Same as primary but uses `Feedback - Error` color.
-   **Disabled State:** Use `Background - Secondary`, `Text - Tertiary`, and `cursor: not-allowed`. No hover effects.

### 3.2. Forms & Inputs
-   **General:** `height: 40px`, `border-radius: 4px`, `padding: 8px 12px`, `background-color: Background - Primary`.
-   **Border:** `1px` solid `Border - Standard`.
-   **States:**
    -   **Focus:** Border changes to `2px` solid `Border - Focus`, no box-shadow.
    -   **Error:** Border changes to `1px` solid `Feedback - Error`.
    -   **Disabled:** Background is `Background - Secondary`, text is `Text - Tertiary`.
-   **Labels:** Use `Small/Caption` typography, `Text - Secondary` color. Place above the input.
-   **Validation Text:** Appears below the input, uses `Small/Caption` typography, and the appropriate feedback color.

### 3.3. Cards
-   **Styling:** `background-color: Background - Primary`, `border-radius: 6px`, `box-shadow: shadow-md`.
-   **Padding:** `24px` (`space-5`).
-   **Header/Footer:** Use a `1px` solid border (`Border - Standard`) to separate sections if needed. Header text should be bold.

### 3.4. Modals / Dialogs
-   **Container:** `padding: 24px`, `border-radius: 6px`, `box-shadow: shadow-lg`, `background-color: Background - Primary`.
-   **Overlay:** A semi-transparent backdrop using `rgba(17, 24, 39, 0.6)` (Gray 900 with 60% opacity).
-   **Title:** Use `Heading 3` typography.
-   **Layout:** Use flexbox for header, content, and footer sections.

### 3.5. Tables
-   **Container:** `border-radius: 6px`, `border: 1px solid Border - Standard`, overflow hidden.
-   **Header (`<th>`):** `background-color: Background - Secondary`, `font-weight: 600`, `padding: 12px 16px`, `text-align: left`.
-   **Rows (`<tr>`):** Use `border-bottom: 1px solid Border - Standard`. On hover, set `background-color: Background - Tertiary`. No striped rows.
-   **Cells (`<td>`):** `padding: 12px 16px`, vertical-align middle.

### 3.6. Icons
-   **Library:** Use a consistent, lightweight, line-art icon library like **Lucide Icons** (`lucide-react`).
-   **Styling:** Default size `18px`, color `Text - Secondary`. Do not use icons for decoration; they must serve a purpose (clarify an action, indicate status).

---

## 4. General Directives for Copilot

1.  **Strict Token Adherence:** ALWAYS use the defined color, typography, and spacing tokens. Do not hardcode values. If using Tailwind CSS, assume these tokens are configured in `tailwind.config.js`.
2.  **No Emojis:** The UI must be strictly professional. Do not use emojis in any generated component, placeholder text, labels, or comments.
3.  **Componentization:** Generate code as modular, reusable components (e.g., React/Vue functional components). Props should be used for customization.
4.  **Accessibility First:** Generate semantic HTML (`<nav>`, `<main>`, `<button>`). Ensure all interactive elements are keyboard-navigable and have proper ARIA attributes where necessary (e.g., `aria-label` for icon-only buttons).
5.  **No Inline Styles:** Use CSS classes exclusively for styling. Inline `style` attributes are forbidden unless absolutely necessary for dynamic properties (e.g., calculated positions).
6.  **Responsiveness:** All components and layouts must be mobile-first and fully responsive. Use flexbox and grid for layouts.
7.  **Transitions & Animations:** Keep animations subtle and fast (`150ms-200ms`, `ease-in-out`). Animate `transform` and `opacity` instead of layout properties like `width` or `margin` for better performance.

FRONTEND STYLING SHOULD BE DONE IN PURE CSS NO TAILWIND OR FRAMEWORKS.