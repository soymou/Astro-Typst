import { visit } from 'unist-util-visit';
import { NodeCompiler } from '@myriaddreamin/typst-ts-node-compiler';
import { fromHtmlIsomorphic } from 'hast-util-from-html-isomorphic';

let compilerInstance;

async function renderTypstToSVG(code, displayMode = false) {
  const compiler = compilerInstance || (compilerInstance = NodeCompiler.create());

  // Check if code already has Typst math delimiters
  const trimmedCode = code.trim();
  const hasTypstDelimiters = trimmedCode.startsWith('$') && trimmedCode.endsWith('$');

  // Detect display mode from Typst syntax: "$ ... $" with spaces indicates display mode
  const isTypstDisplayMode = hasTypstDelimiters && /^\$\s+.*\s+\$$/.test(trimmedCode);

  let template;
  if (hasTypstDelimiters) {
    // Use Typst syntax as-is
    template = `#set page(height: auto, width: auto, margin: 0pt)\n${trimmedCode}`;
  } else {
    // Wrap in Typst math delimiters
    template = displayMode
      ? `#set page(height: auto, width: auto, margin: 0pt)\n$ ${trimmedCode} $`
      : `#set page(height: auto, width: auto, margin: 0pt)\n#show math.equation: it => { box(it, inset: (top: 0.5em, bottom: 0.5em)) }\n$ ${trimmedCode} $`;
  }

  const docRes = compiler.compile({ mainFileContent: template });

  if (!docRes.result) {
    const diags = compiler.fetchDiagnostics(docRes.takeDiagnostics());
    throw new Error(`Typst compilation failed: ${JSON.stringify(diags)}`);
  }

  const svg = compiler.svg(docRes.result);
  compiler.evictCache(10);

  return svg;
}

export default function rehypeTypstCustom() {
  return async (tree) => {
    const promises = [];

    visit(tree, 'element', (node, index, parent) => {
      const classes = node.properties?.className || [];

      // Check for remark-math generated classes
      const isMathInline = classes.includes('math-inline');
      const isMathDisplay = classes.includes('math-display');

      // Also support explicit typst code blocks
      const isTypstBlock = node.tagName === 'code' && classes.includes('language-typst');

      if (isMathInline || isMathDisplay || isTypstBlock) {
        const processNode = async () => {
          const code = node.children[0]?.value || '';

          // Check if the raw code has Typst display syntax (spaces after $ and before $)
          const hasTypstDisplaySpaces = /^\s+.*\s+$/.test(code);
          const isDisplayMode = isMathDisplay || parent?.tagName === 'pre' || hasTypstDisplaySpaces;

          try {
            const svg = await renderTypstToSVG(code.trim(), isDisplayMode);
            const root = fromHtmlIsomorphic(svg, { fragment: true });
            const svgNode = root.children[0];

            if (svgNode) {
              const height = parseFloat(svgNode.properties['dataHeight'] || '11');
              const width = parseFloat(svgNode.properties['dataWidth'] || '11');
              const defaultEm = 11;

              svgNode.properties.height = `${height / defaultEm}em`;
              svgNode.properties.width = `${width / defaultEm}em`;
              svgNode.properties.style = isDisplayMode
                ? 'display: block; margin: 1em auto;'
                : 'display: inline-block; vertical-align: middle;';

              if (isDisplayMode) {
                if (parent && parent.type === 'element' && parent.tagName === 'pre') {
                  // Replace the entire <pre> with just the svg
                  parent.tagName = 'div';
                  parent.properties = { className: ['typst-display'] };
                  parent.children = [svgNode];
                } else {
                  // For math-display that's not in <pre>
                  node.tagName = 'div';
                  node.properties = { className: ['typst-display'] };
                  node.children = [svgNode];
                }
              } else {
                // For inline math, replace with span
                node.tagName = 'span';
                node.properties = { className: ['typst-inline'], style: 'display: inline-block;' };
                node.children = [svgNode];
              }
            }
          } catch (error) {
            console.error('Typst rendering error:', error);
            node.children = [{
              type: 'text',
              value: `[Typst Error: ${error.message}]`
            }];
          }
        };

        promises.push(processNode());
      }
    });

    await Promise.all(promises);
  };
}
