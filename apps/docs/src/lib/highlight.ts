import type { HighlighterCore } from 'shiki/core';

export type CodeLang = 'tsx' | 'bash' | 'css' | 'html';

let highlighter: Promise<HighlighterCore> | undefined;

// Loaded on first use: Shiki and its grammars stay out of the main bundle.
function load(): Promise<HighlighterCore> {
  highlighter ??= Promise.all([
    import('shiki/core'),
    import('shiki/engine/javascript'),
    import('shiki/langs/tsx.mjs'),
    import('shiki/langs/bash.mjs'),
    import('shiki/langs/css.mjs'),
    import('shiki/langs/html.mjs'),
  ]).then(([core, engine, tsx, bash, css, html]) =>
    core.createHighlighterCore({
      themes: [core.createCssVariablesTheme({ name: 'kvant', variablePrefix: '--code-', variableDefaults: {} })],
      langs: [tsx.default, bash.default, css.default, html.default],
      engine: engine.createJavaScriptRegexEngine(),
    }),
  );
  return highlighter;
}

/** Highlighted HTML; colours are CSS variables mapped to Kvant tokens in app.css. */
export async function highlight(code: string, lang: CodeLang): Promise<string> {
  const instance = await load();
  return instance.codeToHtml(code, { lang, theme: 'kvant' });
}
