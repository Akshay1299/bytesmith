import { useCallback, useEffect, useMemo, useState } from 'react';
import { registry, defaultOptions, type ToolOptions } from '@bytesmith/core';
import { ToolRail } from './components/ToolRail';
import { Workspace } from './components/Workspace';
import { CommandPalette } from './components/CommandPalette';
import { ToastProvider } from './components/toast';
import { useDebounced } from './hooks/useDebounced';

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

  const [input, setInput] = useState('');
  const [optionsById, setOptionsById] = useState<Record<string, ToolOptions>>({});
  const [paletteOpen, setPaletteOpen] = useState(false);

  const options = optionsById[tool.id] ?? defaultOptions(tool);
  const debouncedInput = useDebounced(input, 120);
  const result = useMemo(() => tool.run(debouncedInput, options), [tool, debouncedInput, options]);

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
        <Workspace
          tool={tool}
          input={input}
          onInput={setInput}
          options={options}
          onOption={setOption}
          result={result}
        />
      </div>
      <CommandPalette open={paletteOpen} tools={ALL_TOOLS} onSelect={selectId} onClose={() => setPaletteOpen(false)} />
    </ToastProvider>
  );
}
