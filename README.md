# rehype-typst & remark-typst

Custom [rehype](https://github.com/rehypejs/rehype) and [remark](https://github.com/remarkjs/remark) plugins that render math equations using [Typst](https://typst.app/) at build time, with native Typst syntax support.

## Features

- 🚀 **Build-time rendering**: No client-side JavaScript needed
- 🎨 **Dark mode support**: Automatic color adaptation for light/dark themes
- 📝 **Multiple syntaxes**: Support for both `$...$` (via remark-math) and native Typst syntax
- 🔄 **Inline and display modes**: Proper rendering of both inline and display math
- 📏 **Responsive sizing**: Math adapts to surrounding text size

## Installation

```bash
npm install @myriaddreamin/typst-ts-node-compiler unist-util-visit hast-util-from-html-isomorphic
```

## Usage

### In your Astro config

```js
import remarkTypst from "./plugins/remark-typst.js";
import rehypeTypst from "./plugins/rehype-typst.js";

export default defineConfig({
  markdown: {
    remarkPlugins: [remarkTypst],
    rehypePlugins: [rehypeTypst],
  },
});
```

### CSS Setup

Add to your CSS file:

```css
/* Typst inline rendering */
.typst-inline {
  display: inline-block !important;
  vertical-align: middle;
  font-size: inherit;
}

.typst-inline svg {
  display: inline-block !important;
  height: 2em !important;
  width: auto !important;
}

.typst-display {
  display: block !important;
  text-align: center;
  margin: 1em 0;
  font-size: inherit;
}

.typst-display svg {
  max-width: 100%;
  height: auto;
}

/* Dark mode support */
.typst-display svg,
.typst-inline svg,
svg.typst-doc {
  filter: invert(0);
}

:root[data-theme='dark'] .typst-display svg,
:root[data-theme='dark'] .typst-inline svg,
:root[data-theme='dark'] svg.typst-doc {
  filter: invert(1);
}
```

### Markdown Syntax

The plugin uses Typst's native syntax with automatic mode detection:

#### Inline Math (no spaces inside `$`)

```markdown
Inline math: $E = m c^2$ or $x^2 + y^2 = z^2$
```

#### Display Math (spaces after `$` and before `$`)

```markdown
Display math with spaces: $ sum_(i=1)^n i = (n(n+1))/2 $

Or use double dollar signs:
$$
integral_0^oo e^(-x^2) dif x = sqrt(pi)/2
$$
```

**Key rule**:
- `$math$` (no spaces) = **inline mode**
- `$ math $` (with spaces) = **display mode** (centered block)
- `$$...$$` = **display mode** (centered block)

#### Examples

```markdown
Inline: The formula $a^2 + b^2 = c^2$ is Pythagorean theorem.

Display: $ sum_(k=1)^n k = (n(n+1))/2 $

Display with $$: $$lim_(x->oo) 1/x = 0$$
```

## How It Works

1. **remark-typst** parses `$...$` and `$$...$$` syntax and detects display mode based on spaces
2. **rehype-typst** renders the math using Typst's compiler to SVG at build time
3. The rendered SVG is injected into the HTML with appropriate styling classes
4. CSS handles responsive sizing and dark mode adaptation

## Typst Syntax

This plugin uses native Typst math syntax:

| Feature | Typst Syntax | Example |
|---------|--------------|---------|
| Fractions | `a/b` or `frac(a, b)` | `1/2` or `frac(1, 2)` |
| Subscripts | `x_i` | `x_1, x_2` |
| Superscripts | `x^2` | `e^(i pi)` |
| Sum | `sum_(i=1)^n` | `sum_(k=1)^n k^2` |
| Integral | `integral_a^b` | `integral_0^1 x dif x` |
| Script letters | `cal(A)` | `cal(H)` (ℋ) |
| Parentheses | `(...)` for grouping | `(a+b)^2` |

See [Typst Math Documentation](https://typst.app/docs/reference/math/) for full syntax reference.

## License

MIT

## Credits

Built with:
- [@myriaddreamin/typst-ts-node-compiler](https://github.com/Myriad-Dreamin/typst.ts)
- [unist-util-visit](https://github.com/syntax-tree/unist-util-visit)
- [hast-util-from-html-isomorphic](https://github.com/syntax-tree/hast-util-from-html-isomorphic)
