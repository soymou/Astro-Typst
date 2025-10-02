import { visit } from 'unist-util-visit';

/**
 * Custom remark plugin for Typst math that preserves spaces
 * Detects:
 * - $math$ (no spaces) → inline
 * - $ math $ (with spaces) → display
 * - $$math$$ → display
 */
export default function remarkTypstMath() {
  return (tree) => {
    visit(tree, 'text', (node, index, parent) => {
      if (!parent || index === null) return;

      const text = node.value;
      const parts = [];
      let lastIndex = 0;

      // Match $...$ patterns
      const regex = /\$([^\$]+?)\$/g;
      let match;

      while ((match = regex.exec(text)) !== null) {
        const fullMatch = match[0];
        const content = match[1];
        const matchStart = match.index;

        // Add text before the match
        if (matchStart > lastIndex) {
          parts.push({
            type: 'text',
            value: text.slice(lastIndex, matchStart)
          });
        }

        // Determine if it's display mode (has spaces on both sides)
        const isDisplay = /^\s+.*\s+$/.test(content);
        const cleanContent = content.trim();

        // Create text node wrapped in code element
        parts.push({
          type: 'html',
          value: `<code class="${isDisplay ? 'math-display' : 'math-inline'}">${cleanContent}</code>`
        });

        lastIndex = matchStart + fullMatch.length;
      }

      // Add remaining text
      if (lastIndex < text.length) {
        parts.push({
          type: 'text',
          value: text.slice(lastIndex)
        });
      }

      // Replace node if we found math
      if (parts.length > 0) {
        parent.children.splice(index, 1, ...parts);
        return index + parts.length;
      }
    });

    // Handle $$ display math blocks
    visit(tree, 'text', (node, index, parent) => {
      if (!parent || index === null) return;

      const text = node.value;
      const displayRegex = /\$\$([\s\S]+?)\$\$/g;
      const parts = [];
      let lastIndex = 0;
      let match;

      while ((match = displayRegex.exec(text)) !== null) {
        const fullMatch = match[0];
        const content = match[1];
        const matchStart = match.index;

        // Add text before the match
        if (matchStart > lastIndex) {
          parts.push({
            type: 'text',
            value: text.slice(lastIndex, matchStart)
          });
        }

        // Create display math node as HTML
        parts.push({
          type: 'html',
          value: `<code class="math-display">${content.trim()}</code>`
        });

        lastIndex = matchStart + fullMatch.length;
      }

      // Add remaining text
      if (lastIndex < text.length) {
        parts.push({
          type: 'text',
          value: text.slice(lastIndex)
        });
      }

      // Replace node if we found math
      if (parts.length > 0) {
        parent.children.splice(index, 1, ...parts);
        return index + parts.length;
      }
    });
  };
}
