import { EditorView, type Panel } from '@codemirror/view';
import {
  search,
  SearchQuery,
  getSearchQuery,
  setSearchQuery,
  findNext,
  findPrevious,
  selectMatches,
  replaceNext,
  replaceAll,
  closeSearchPanel,
} from '@codemirror/search';

/**
 * A forge-themed find/replace panel for CodeMirror.
 *
 * Replaces the default (off-theme) search panel with one that matches Bytesmith:
 * ember toggle-chips for the options, styled inputs/buttons, and a live "current / total"
 * match counter. Behaviour is unchanged — it drives the standard search commands.
 */

const chevronDown = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>';
const chevronUp = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M18 15l-6-6-6 6"/></svg>';
const xIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>';

function createForgePanel(view: EditorView): Panel {
  const initial = getSearchQuery(view.state);

  const dom = document.createElement('div');
  dom.className = 'cm-bsearch';
  dom.setAttribute('role', 'search');
  dom.innerHTML = `
    <button type="button" class="cm-bsearch-icon cm-bsearch-close" name="close" title="Close — Esc">${xIcon}</button>
    <div class="cm-bsearch-row">
      <div class="cm-bsearch-field">
        <span class="cm-bsearch-ic">⌕</span>
        <input class="cm-bsearch-input" name="search" placeholder="Find" autocomplete="off" spellcheck="false" />
      </div>
      <span class="cm-bsearch-count" data-count></span>
      <button type="button" class="cm-bsearch-btn" name="next" title="Next match — Enter">${chevronDown}<span>next</span></button>
      <button type="button" class="cm-bsearch-btn" name="prev" title="Previous match — Shift+Enter">${chevronUp}<span>prev</span></button>
      <button type="button" class="cm-bsearch-btn" name="all" title="Select all matches">all</button>
      <div class="cm-bsearch-opts">
        <button type="button" class="cm-bsearch-chip" name="case" title="Match case"><i></i>match case</button>
        <button type="button" class="cm-bsearch-chip" name="re" title="Regular expression"><i></i>regexp</button>
        <button type="button" class="cm-bsearch-chip" name="word" title="Match whole word"><i></i>by word</button>
      </div>
    </div>
    <div class="cm-bsearch-row">
      <div class="cm-bsearch-field">
        <span class="cm-bsearch-ic">⇄</span>
        <input class="cm-bsearch-input" name="replace" placeholder="Replace" autocomplete="off" spellcheck="false" />
      </div>
      <button type="button" class="cm-bsearch-btn" name="replace" title="Replace next">replace</button>
      <button type="button" class="cm-bsearch-btn cm-bsearch-primary" name="replaceAll" title="Replace all">replace all</button>
    </div>
  `;

  const q = <T extends HTMLElement>(sel: string) => dom.querySelector(sel) as T;
  const searchInput = q<HTMLInputElement>('input[name="search"]');
  const replaceInput = q<HTMLInputElement>('input[name="replace"]');
  const countEl = q<HTMLElement>('[data-count]');
  const chipCase = q<HTMLButtonElement>('[name="case"]');
  const chipRe = q<HTMLButtonElement>('[name="re"]');
  const chipWord = q<HTMLButtonElement>('[name="word"]');

  function commit() {
    const query = new SearchQuery({
      search: searchInput.value,
      replace: replaceInput.value,
      caseSensitive: chipCase.classList.contains('on'),
      regexp: chipRe.classList.contains('on'),
      wholeWord: chipWord.classList.contains('on'),
    });
    view.dispatch({ effects: setSearchQuery.of(query) });
    refreshCount();
  }

  function refreshCount() {
    const query = getSearchQuery(view.state);
    if (!query.search) {
      countEl.textContent = '';
      countEl.classList.remove('cm-bsearch-nomatch');
      return;
    }
    if (!query.valid) {
      countEl.textContent = 'bad regexp';
      countEl.classList.add('cm-bsearch-nomatch');
      return;
    }
    let total = 0;
    let current = 0;
    const main = view.state.selection.main;
    try {
      const cursor = query.getCursor(view.state) as Iterator<{ from: number; to: number }>;
      for (let it = cursor.next(); !it.done; it = cursor.next()) {
        total++;
        if (it.value.from === main.from && it.value.to === main.to) current = total;
      }
    } catch {
      countEl.textContent = '';
      return;
    }
    if (total === 0) {
      countEl.textContent = 'no matches';
      countEl.classList.add('cm-bsearch-nomatch');
    } else {
      countEl.innerHTML = `<b>${current || '–'}</b> / ${total}`;
      countEl.classList.remove('cm-bsearch-nomatch');
    }
  }

  function toggleChip(chip: HTMLButtonElement) {
    chip.classList.toggle('on');
    commit();
    searchInput.focus();
  }

  searchInput.addEventListener('input', commit);
  replaceInput.addEventListener('input', commit);
  chipCase.addEventListener('click', () => toggleChip(chipCase));
  chipRe.addEventListener('click', () => toggleChip(chipRe));
  chipWord.addEventListener('click', () => toggleChip(chipWord));

  q<HTMLButtonElement>('[name="next"]').addEventListener('click', () => { findNext(view); });
  q<HTMLButtonElement>('[name="prev"]').addEventListener('click', () => { findPrevious(view); });
  q<HTMLButtonElement>('[name="all"]').addEventListener('click', () => { selectMatches(view); });
  q<HTMLButtonElement>('[name="replace"]').addEventListener('click', () => { replaceNext(view); });
  q<HTMLButtonElement>('[name="replaceAll"]').addEventListener('click', () => { replaceAll(view); });
  q<HTMLButtonElement>('[name="close"]').addEventListener('click', () => { closeSearchPanel(view); view.focus(); });

  dom.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.target === replaceInput) {
        if (e.ctrlKey || e.metaKey) replaceAll(view); else replaceNext(view);
      } else {
        if (e.shiftKey) findPrevious(view); else findNext(view);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      closeSearchPanel(view);
      view.focus();
    }
  });

  return {
    dom,
    top: false,
    mount() {
      if (initial.caseSensitive) chipCase.classList.add('on');
      if (initial.regexp) chipRe.classList.add('on');
      if (initial.wholeWord) chipWord.classList.add('on');
      if (initial.search) searchInput.value = initial.search;
      if (initial.replace) replaceInput.value = initial.replace;
      searchInput.focus();
      searchInput.select();
      refreshCount();
    },
    update(u) {
      if (
        u.docChanged ||
        u.selectionSet ||
        u.transactions.some((tr) => tr.effects.some((e) => e.is(setSearchQuery)))
      ) {
        refreshCount();
      }
    },
  };
}

/** Ember-forge styling for the custom search panel. */
const forgeSearchTheme = EditorView.theme({
  '.cm-panels': { backgroundColor: 'transparent', border: 'none', color: 'var(--text)' },
  '.cm-panels.cm-panels-bottom': { borderTop: 'none' },

  '.cm-bsearch': {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    gap: '9px',
    padding: '11px 40px 11px 12px',
    background: 'linear-gradient(180deg, var(--surface-3), var(--surface-2))',
    borderTop: '1px solid rgba(255,154,61,0.35)',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)',
    fontFamily: 'var(--sans)',
  },
  '.cm-bsearch-row': { display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' },
  '.cm-bsearch-field': { position: 'relative', flex: '1', minWidth: '150px' },
  '.cm-bsearch-ic': {
    position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)',
    color: 'var(--faint)', fontFamily: 'var(--mono)', fontSize: '12px', pointerEvents: 'none',
  },
  '.cm-bsearch-input': {
    width: '100%', background: 'var(--bg-2)', border: '1px solid var(--border)',
    borderRadius: '8px', color: 'var(--text)', fontFamily: 'var(--mono)', fontSize: '13px',
    padding: '8px 10px 8px 26px', outline: 'none', transition: 'border-color .15s, box-shadow .15s',
  },
  '.cm-bsearch-input::placeholder': { color: 'var(--faint)' },
  '.cm-bsearch-input:focus': { borderColor: 'var(--accent)', boxShadow: '0 0 0 3px rgba(255,154,61,0.15)' },

  '.cm-bsearch-count': { fontFamily: 'var(--mono)', fontSize: '11.5px', color: 'var(--faint)', whiteSpace: 'nowrap', padding: '0 2px' },
  '.cm-bsearch-count b': { color: 'var(--accent)' },
  '.cm-bsearch-count.cm-bsearch-nomatch': { color: 'var(--bad)' },

  '.cm-bsearch-btn': {
    display: 'inline-flex', alignItems: 'center', gap: '5px',
    background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px',
    color: 'var(--muted)', fontFamily: 'var(--sans)', fontSize: '12.5px', fontWeight: '600',
    padding: '7px 12px', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all .14s',
  },
  '.cm-bsearch-btn:hover': { color: 'var(--text)', borderColor: 'var(--border-strong)', background: 'var(--surface-3)' },
  '.cm-bsearch-btn svg': { width: '13px', height: '13px' },
  '.cm-bsearch-primary': {
    color: '#1a1206', fontWeight: '700', border: '1px solid transparent',
    background: 'linear-gradient(180deg, var(--ember-2), var(--accent))',
  },
  '.cm-bsearch-primary:hover': { boxShadow: '0 4px 14px -4px var(--glow)', color: '#1a1206' },

  '.cm-bsearch-opts': { display: 'flex', gap: '6px', marginLeft: 'auto' },
  '.cm-bsearch-chip': {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '7px',
    color: 'var(--muted)', fontFamily: 'var(--sans)', fontSize: '12px', fontWeight: '600',
    padding: '6px 10px', cursor: 'pointer', transition: 'all .14s',
  },
  '.cm-bsearch-chip i': { width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor', opacity: '0.45' },
  '.cm-bsearch-chip:hover': { color: 'var(--text)', borderColor: 'var(--border-strong)' },
  '.cm-bsearch-chip.on': {
    color: 'var(--accent)', borderColor: 'rgba(255,154,61,0.5)', background: 'rgba(255,154,61,0.12)',
    boxShadow: 'inset 0 0 0 1px rgba(255,154,61,0.25)',
  },
  '.cm-bsearch-chip.on i': { opacity: '1' },

  '.cm-bsearch-icon': {
    display: 'inline-flex', background: 'transparent', border: '1px solid transparent',
    borderRadius: '7px', color: 'var(--faint)', cursor: 'pointer', padding: '6px', transition: 'all .14s',
  },
  '.cm-bsearch-icon:hover': { color: 'var(--text)', background: 'var(--surface)' },
  '.cm-bsearch-icon svg': { width: '15px', height: '15px' },

  // Pinned out of the flex flow so it never gets pushed onto its own line when
  // the row above wraps at narrower widths.
  '.cm-bsearch-close': { position: 'absolute', top: '9px', right: '9px' },
});

/** Drop-in extension: forge-themed find/replace with a live match counter. */
export const forgeSearch = [
  search({ top: false, createPanel: createForgePanel }),
  forgeSearchTheme,
];
