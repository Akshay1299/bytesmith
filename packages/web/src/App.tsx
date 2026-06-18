import { useCallback, useEffect, useMemo, useState } from 'react';
import { registry, defaultOptions, isDiffTool, isGeneratorTool, isCustomTool, type ToolOptions } from '@bytesmith/core';
import { ToolRail } from './components/ToolRail';
import { Workspace } from './components/Workspace';
import { DiffWorkspace } from './components/DiffWorkspace';
import { GeneratorWorkspace } from './components/GeneratorWorkspace';
import { UnixTimeView } from './components/UnixTimeView';
import { TimezoneView } from './components/TimezoneView';
import type { ComponentType } from 'react';
import { CommandPalette } from './components/CommandPalette';
import { ToastProvider } from './components/toast';
import { Logo } from './components/Logo';
import { useDebounced } from './hooks/useDebounced';
import { Menu, Search } from 'lucide-react';

/** Per-tool buffers: `a` is the single/left input, `b` is the right input (diff tools). */
interface ToolState {
  a: string;
  b: string;
}
const EMPTY: ToolState = { a: '', b: '' };

const ALL_TOOLS = registry.all();
const GROUPS = registry.grouped();
const DEFAULT_ID = ALL_TOOLS[0].id;

/** Bespoke UIs for `custom`-kind tools, keyed by tool id. */
const CUSTOM_VIEWS: Record<string, ComponentType> = {
  'unix-time': UnixTimeView,
  timezone: TimezoneView,
};

/** Keeps the active tool id in sync with the URL hash (deep-linkable, back-button aware). */
function useHashTool(): [string, (id: string) => void] {
  const [id, setId] = useState(() => window.location.hash.slice(1) || DEFAULT_ID);
  useEffect(() => {
    const onHash = () => setId(window.location.hash.slice(1) || DEFAULT_ID);
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  const select = useCallback((next: string) => {
    window.location.hash = next;
  }, []);
  return [id, select];
}

export default function App() {
  const [activeId, selectId] = useHashTool();
  const tool = registry.get(activeId) ?? ALL_TOOLS[0];

  // Per-tool buffers: each tool keeps its own input(s), so switching tools shows that tool's
  // own state (blank until used) and returning restores it. In-memory only — a full page
  // refresh starts everything fresh, by design.
  const [stateById, setStateById] = useState<Record<string, ToolState>>({});
  const [optionsById, setOptionsById] = useState<Record<string, ToolOptions>>({});
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Selecting a tool also closes the mobile drawer.
  const handleSelect = useCallback(
    (id: string) => {
      selectId(id);
      setMenuOpen(false);
    },
    [selectId],
  );

  const st = stateById[tool.id] ?? EMPTY;
  const setA = useCallback(
    (value: string) => setStateById((prev) => ({ ...prev, [tool.id]: { ...(prev[tool.id] ?? EMPTY), a: value } })),
    [tool.id],
  );
  const setB = useCallback(
    (value: string) => setStateById((prev) => ({ ...prev, [tool.id]: { ...(prev[tool.id] ?? EMPTY), b: value } })),
    [tool.id],
  );

  const options = optionsById[tool.id] ?? defaultOptions(tool);
  const debA = useDebounced(st.a, 120, tool.id);
  const debB = useDebounced(st.b, 120, tool.id);

  const transformResult = useMemo(() => {
    if (isDiffTool(tool) || isGeneratorTool(tool) || isCustomTool(tool)) return null;
    return tool.run(debA, options);
  }, [tool, debA, options]);

  const diffResult = useMemo(() => {
    if (!isDiffTool(tool)) return null;
    return tool.diff(debA, debB, options);
  }, [tool, debA, debB, options]);

  const setOption = useCallback(
    (key: string, value: boolean | string) => {
      setOptionsById((prev) => ({
        ...prev,
        [tool.id]: { ...(prev[tool.id] ?? defaultOptions(tool)), [key]: value },
      }));
    },
    [tool],
  );

  // ⌘K / Ctrl+K toggles the command palette.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <ToastProvider>
      {/* Mobile-only top bar: brings back the hidden sidebar via a drawer + search. */}
      <header className="topbar">
        <a className="topbar__brand" href={import.meta.env.BASE_URL} title="Bytesmith — reload">
          <Logo size={24} />
          <span>Byte<b>smith</b></span>
        </a>
        <span className="topbar__tool">{tool.name}</span>
        <button className="icon-btn" onClick={() => setPaletteOpen(true)} aria-label="Search tools">
          <Search size={18} />
        </button>
        <button className="icon-btn" onClick={() => setMenuOpen(true)} aria-label="Open menu">
          <Menu size={18} />
        </button>
      </header>

      <div className="app">
        <ToolRail
          groups={GROUPS}
          activeId={tool.id}
          onSelect={handleSelect}
          onOpenPalette={() => setPaletteOpen(true)}
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
        />
        {menuOpen && <div className="rail-scrim" onClick={() => setMenuOpen(false)} />}
        {isCustomTool(tool) ? (
          (() => {
            const View = CUSTOM_VIEWS[tool.id];
            return View ? <View /> : null;
          })()
        ) : isDiffTool(tool) ? (
          <DiffWorkspace tool={tool} left={st.a} right={st.b} onLeft={setA} onRight={setB} result={diffResult!} />
        ) : isGeneratorTool(tool) ? (
          <GeneratorWorkspace tool={tool} value={st.a} onChange={setA} options={options} onOption={setOption} />
        ) : (
          <Workspace tool={tool} input={st.a} onInput={setA} options={options} onOption={setOption} result={transformResult!} />
        )}
      </div>
      <CommandPalette open={paletteOpen} tools={ALL_TOOLS} onSelect={handleSelect} onClose={() => setPaletteOpen(false)} />
    </ToastProvider>
  );
}
