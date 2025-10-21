# Core Principles of Apple's Human Interface Guidelines (HIG)

1.  **Clarity (清晰)**: The interface must be legible and easy to understand at a glance. Text should be sharp, icons precise, and layouts uncluttered. Every element must have a clear purpose.
2.  **Deference (遵从)**: The UI should never compete with the content. It should "defer" to the content. This is achieved through subtle, unobtrusive design, leveraging negative space, neutral colors, and translucency to help users focus on their primary task.
3.  **Depth (深度)**: The interface uses layers and motion to create a sense of hierarchy and context. Translucent materials (like frosted glass) and subtle shadows help users understand the relationship between different UI layers and what is currently in focus.

---

# Specific Design Elements & Implementation Guidelines

When generating code, you must follow these specific rules:

### 1. Color Palette
* **Base**: The palette is predominantly neutral, relying heavily on shades of white, black, and gray to create a clean canvas.
* **Accent Color**: A single, vibrant accent color (typically a system blue like `#007AFF`) is used for interactive elements like links, buttons, and selected states. Avoid using multiple bright colors for decoration.
* **Dark Mode**: The design must support both Light and Dark Mode seamlessly. This means using semantic colors (e.g., `labelColor`, `separatorColor`) that adapt to the theme, rather than hardcoded hex values.

### 2. Typography
* **Font Family**: The primary font is **San Francisco (SF)**. In CSS, this should be implemented using the `system-ui` or `-apple-system` stack to call the native system font.
    * `font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;`
* **Type Scale & Weight**: Use the standard Apple type ramp (e.g., `Large Title`, `Title 1`, `Headline`, `Body`, `Footnote`). Emphasize a clear visual hierarchy using font weight (`400` for regular, `600` for semibold, `700` for bold) and size, but avoid overly dramatic variations. Legibility is the top priority.

### 3. Layout & Spacing
* **Alignment**: Maintain crisp, logical alignment. Text and icons should be precisely aligned to a common baseline.
* **Margins & Padding**: Use consistent and generous spacing to give content breathing room. Common values are multiples of 4pt or 8pt (e.g., `16px` for standard margins).
* **Separators**: When separating content areas, use thin, subtle lines (often `0.5px` or `1px` with low opacity, like `rgba(60, 60, 67, 0.29)`) instead of heavy borders.

### 4. Materials & Effects
* **Translucency (Vibrancy / Frosted Glass)**: This is a key element. For components like sidebars, navigation bars, and modals, apply a background blur effect to hint at the content behind them.
    * In CSS, this is achieved with: `background-color: rgba(242, 242, 247, 0.8);` and `backdrop-filter: blur(20px);`.
* **Shadows**: Shadows are extremely subtle and realistic. They are used to indicate elevation and layering, not for decoration. They should be soft and diffused.

### 5. Components & Shape
* **Buttons**:
    * Standard buttons are often borderless, relying on the accent color and font weight to indicate interactivity.
    * Prominent buttons (`Prominent` or `Filled`) have a solid background of the accent color with white text.
    * Corner radius is typically moderate (e.g., `8px` or `10px`). Avoid fully rounded "pill" shapes for standard rectangular buttons.
* **Icons**: Use the **SF Symbols** style. Icons should be simple, outline-based, and highly symbolic with a consistent stroke width. They should communicate concepts clearly and concisely.
* **Containers (Cards/Modals)**: Use clean rectangles with a moderate corner radius. Borders are usually absent, relying on a subtle shadow or background color to separate them from the main view.