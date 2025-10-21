# Core Principles of Microsoft's Fluent Design System

1.  **Light (光线)**: Light is used to create atmosphere and draw attention. Interactive elements should react to the user's pointer (e.g., mouse hover) with subtle glows or highlights, making the interface feel responsive and alive.
2.  **Depth (深度)**: The UI is not flat. Depth is created through layering, subtle shadows, and parallax effects. This helps establish a clear visual hierarchy and makes the user feel more connected to the digital space.
3.  **Motion (动效)**: Motion provides context and delight. Animations should be purposeful, fluid, and physically believable. They guide the user's focus during transitions and provide meaningful feedback to interactions.
4.  **Material (材质)**: Digital surfaces should have a tactile, physical quality. The most iconic material is **Acrylic**, a semi-transparent, blurred texture that mimics frosted glass, adding depth and context to layered interfaces.
5.  **Scale (缩放)**: The design must be adaptive and scale seamlessly across a wide range of devices and screen sizes, from small mobile displays to large desktop monitors and even mixed-reality headsets.

---

# Specific Design Elements & Implementation Guidelines

When generating code, please adhere to these specific rules:

### 1. Materials & Color
* **Acrylic Material**: This is a signature element. Use it for background surfaces like sidebars, command bars, and pop-up menus.
    * In CSS, this can be simulated with a semi-transparent background color combined with a `backdrop-filter: blur()`. It should also include a subtle noise texture overlay if possible to enhance the realism.
    * Example: `background-color: rgba(255, 255, 255, 0.6); backdrop-filter: blur(30px) saturate(180%);`
* **Mica Material**: A more subtle, opaque material that tints with the desktop wallpaper color. For web, this can be simplified to a slightly off-white/off-black solid background color for the main content area (`#F3F3F3` in light mode, `#202020` in dark mode).
* **Accent Color**: A single, prominent accent color (often the system's default blue, `#0078D4`) is used for key interactive states like sliders, toggles, selected items, and primary buttons.
* **Dark Mode**: All designs must fully support both Light and Dark themes.

### 2. Typography
* **Font Family**: The official font is **Segoe UI Variable**. A good web fallback is `Segoe UI`, or the standard system UI font stack.
    * `font-family: "Segoe UI Variable", "Segoe UI", "Helvetica Neue", Helvetica, Arial, sans-serif;`
* **Hierarchy**: Use a clear typographic ramp. Text should feel crisp and highly legible. Use variations in font size and weight (e.g., `Regular`, `Semibold`, `Bold`) to distinguish titles, subtitles, and body text.

### 3. Geometry & Shape
* **Rounded Corners**: This is a defining feature of the modern Fluent style. All corners, from app windows to buttons and input fields, should be rounded.
    * Use a consistent corner radius, for example, `8px` for buttons and inputs, and `12px` or `16px` for larger containers and pop-ups.
* **Layering**: Use `z-index` and subtle drop shadows to create distinct layers. Elevated surfaces like dialogs and flyouts should appear closer to the user.

### 4. Spacing & Layout
* **Consistent Margins**: Use a consistent spacing system based on a 4px or 8px grid. Ensure elements have enough "breathing room" to feel uncluttered.
* **Alignment**: Align elements logically. For example, in a list, icons and text should be perfectly centered vertically within their row.

### 5. Interaction & Motion
* **Reveal Highlight**: On mouse hover over interactive elements (like list items or buttons), apply a soft, glowing highlight that follows the pointer. This provides immediate visual feedback.
* **Connected Animations**: When transitioning between states (e.g., clicking a list item to see a detail view), the element should feel like it smoothly transforms and moves to its new position.
* **Subtle Animations**: UI elements should appear and disappear with subtle fade-in and slide-up animations, rather than just appearing abruptly.