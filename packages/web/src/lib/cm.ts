import { createTheme } from '@uiw/codemirror-themes';
import { tags as t } from '@lezer/highlight';

/** Forge-flavored CodeMirror theme: amber keys, warm syntax, transparent background. */
export const forgeTheme = createTheme({
  theme: 'dark',
  settings: {
    background: 'transparent',
    foreground: '#edeef2',
    caret: '#ffae4d',
    selection: 'rgba(255, 138, 40, 0.20)',
    selectionMatch: 'rgba(255, 138, 40, 0.14)',
    lineHighlight: 'rgba(255, 255, 255, 0.025)',
    gutterBackground: 'transparent',
    gutterForeground: '#49505f',
    gutterBorder: 'transparent',
    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
  },
  styles: [
    { tag: t.propertyName, color: '#ffae4d' },
    { tag: [t.string, t.special(t.string)], color: '#9ad97f' },
    { tag: t.number, color: '#ff9a6b' },
    { tag: [t.bool, t.null, t.keyword], color: '#c79bff' },
    { tag: [t.punctuation, t.separator, t.bracket, t.brace], color: '#8a91a3' },
    { tag: t.comment, color: '#626a7c', fontStyle: 'italic' },
    { tag: t.invalid, color: '#ff5d6c' },
  ],
});
