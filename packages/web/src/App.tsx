import { useCallback, useEffect, useMemo, useState } from 'react';
import { registry, defaultOptions, isDiffTool, type ToolOptions } from '@bytesmith/core';
import { ToolRail } from './components/ToolRail';
import { Workspace } from './components/Workspace';
import { DiffWorkspace } from './components/DiffWorkspace';
import { CommandPalette } from './components/CommandPalette';
import { ToastProvider } from './components/toast';
import { useDebounced } from './hooks/useDebounced';

/** Per-tool buffers: `a` is the single/left input, `b` is the right input (diff tools). */
interface ToolState {
  a: string;
  b: string;
}
const EMPTY: ToolState = { a: '', b: '' };

const ALL_TOOLS = registry.all();
const GROUPS = registry.grouped();
const DEFAULT_ID = ALL_TOOLS[0].id;

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
    if (isDiffTool(tool)) return null;
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
      <div className="app">
        <ToolRail groups={GROUPS} activeId={tool.id} onSelect={selectId} onOpenPalette={() => setPaletteOpen(true)} />
        {isDiffTool(tool) ? (
          <DiffWorkspace tool={tool} left={st.a} right={st.b} onLeft={setA} onRight={setB} result={diffResult!} />
        ) : (
          <Workspace tool={tool} input={st.a} onInput={setA} options={options} onOption={setOption} result={transformResult!} />
        )}
      </div>
      <CommandPalette open={paletteOpen} tools={ALL_TOOLS} onSelect={selectId} onClose={() => setPaletteOpen(false)} />
    </ToastProvider>
  );
}
