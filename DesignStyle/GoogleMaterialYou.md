# Core Principles of Google's Modern Design Style (Material You)

1.  **Adaptive & Personal**: The design should feel personal to the user. The most prominent feature is **dynamic color**, where UI colors are extracted from the user's wallpaper to create a cohesive and personal theme. While you can't access the user's wallpaper, you should create a harmonious and flexible color palette that mimics this principle.
2.  **Clean & Minimalist**: The layout is clean, with generous use of white space (breathing room). The focus is on the content, removing any unnecessary visual clutter. Every element has a purpose.
3.  **Bold & Expressive**: Typography is a key element. Use large, clear headings and a well-defined type scale to create a strong visual hierarchy. Color is used intentionally to guide attention and express brand identity.
4.  **Intuitive & Natural**: Interactions and animations should feel fluid and natural. Motion is used to provide feedback, guide the user's focus, and add a touch of delight. Everything should behave as the user expects.

---

# Specific Design Elements & Implementation Guidelines

When generating code, please follow these specific rules:

### 1. Color Palette
* **Source of Truth**: The palette should be based on a primary "source" color. From this, generate a full **tonal palette** (e.g., different shades of the primary color for different states like hover, pressed, disabled).
* **Key Colors**:
    * `Primary`: The main accent color for key components like buttons and active states.
    * `Surface`: The background color for components like cards, sheets, and menus. Usually a neutral color with a slight tint from the primary color.
    * `On-Primary` / `On-Surface`: Colors for text and icons that appear on top of Primary or Surface colors, ensuring high contrast and readability.
    * `Secondary` / `Tertiary`: Additional accent colors for less prominent components, offering more ways to highlight information.
* **Example Palette (for your reference)**:
    * Primary: A soft blue or purple.
    * Surface: Off-white or a very light gray with a hint of the primary color.
    * Text: A dark, near-black color, not pure #000.

### 2. Typography
* **Font**: If possible, use the "Google Sans" font family. A good fallback is "Roboto" or a clean, modern sans-serif font like "Inter".
* **Type Scale**: Establish a clear and consistent typographic scale. For example:
    * `Display Large/Medium/Small`
    * `Headline Large/Medium/Small`
    * `Title Large/Medium/Small`
    * `Body Large/Medium/Small`
    * `Label Large/Medium/Small`
* **Hierarchy**: Use font size and weight (e.g., `400` for regular, `500` for medium, `700` for bold) to create a clear visual hierarchy.

### 3. Layout & Spacing
* **Grid System**: Base all layouts on an **8dp grid**. This means all spacing, padding, and margins should be multiples of 8 (e.g., 8px, 16px, 24px, 32px).
* **Responsiveness**: The layout must be fully responsive and adapt gracefully to different screen sizes (mobile, tablet, desktop).
* **White Space**: Be generous with white space. Don't crowd elements together.

### 4. Shape & Corner Radius
* **Rounded Corners**: This is a key visual feature. Use significantly rounded corners for most elements.
    * Buttons: Often have fully rounded "pill" shapes.
    * Cards & Dialogs: Use larger corner radii (e.g., `12px`, `16px`, or even `28px`).
    * Input Fields: Also have rounded corners, often around `8px` or `12px`.

### 5. Components
* **Buttons**:
    * `FilledButton` (Primary action): Solid background color with contrasting text.
    * `OutlinedButton` (Secondary action): Transparent background with a colored border.
    * `TextButton` (Tertiary action): Text only, no border or background.
* **Cards**: Should have a subtle background color (`Surface`), large rounded corners, and a very soft, diffused box-shadow to create a sense of elevation.
* **Input Fields**: Use the "Outlined" style, with the label floating inside the border when the user focuses on it.
* **Navigation**: The `Navigation Bar` (for mobile) and `Navigation Rail` (for tablet/desktop) are common patterns. Active icons are often displayed inside a pill-shaped container.

### 6. Elevation & Shadow
* Use shadows sparingly and intentionally to indicate depth.
* Shadows should be soft and subtle, not harsh. They represent the "elevation" of an element from the background.