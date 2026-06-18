import { useEffect, useState } from 'react';
import { ArrowRight, ClipboardPaste, Copy, Eraser, FlaskConical } from 'lucide-react';
import type { Tool, ToolOptions, ToolResult } from '@bytesmith/core';
import { CodeEditor } from './CodeEditor';
import { OptionsBar } from './OptionsBar';
import { useToast } from './toast';

interface Props {
  tool: Tool;
  input: string;
  onInput: (v: string) => void;
  options: ToolOptions;
  onOption: (key: string, value: boolean | string) => void;
  result: ToolResult;
}

function stats(text: string): string {
  if (!text) return '0 chars';
  const lines = text.split('\n').length;
  return `${lines.toLocaleString()} line${lines === 1 ? '' : 's'} · ${text.length.toLocaleString()} chars`;
}

function Forge({ pulseKey }: { pulseKey: number }) {
  return (
    <div className="forge">
      <div key={pulseKey} className={`forge__btn${pulseKey > 0 ? ' lit' : ''}`}>
        <ArrowRight size={18} />
        {pulseKey > 0 &&
          [0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className="spark"
              style={{
                animation: `sparkFly 0.5s ease-out forwards`,
                // four directions, computed inline so each spark flies differently
                ['--dx' as string]: `${[14, -12, 10, -8][i]}px`,
                ['--dy' as string]: `${[-16, -14, 14, 12][i]}px`,
              }}
            />
          ))}
      </div>
    </div>
  );
}

export function Workspace({ tool, input, onInput, options, onOption, result }: Props) {
  const notify = useToast();
  const [pulse, setPulse] = useState(0);
  const isJson = tool.category === 'json';

  // Re-trigger the forge spark whenever a fresh, valid output is produced.
  useEffect(() => {
    if (result.output) setPulse((p) => p + 1);
  }, [result.output]);

  const copy = async () => {
    if (!result.output) return;
    await navigator.clipboard.writeText(result.output);
    notify('Copied to clipboard');
  };

  const paste = async () => {
    try {
      onInput(await navigator.clipboard.readText());
    } catch {
      notify('Clipboard permission denied');
    }
  };

  return (
    <section className="workspace">
      <div className="ws-head">
        <div>
          <div className="ws-head__title">{tool.name}</div>
          <div className="ws-head__desc">{tool.description}</div>
        </div>
      </div>

      <OptionsBar tool={tool} options={options} onChange={onOption} />

      <div className="panes">
        {/* input */}
        <div className="pane">
          <div className="pane__head">
            <span className="pane__label">Input</span>
            <span className="pane__count">{stats(input)}</span>
            <span className="pane__actions">
              {tool.sample && (
                <button className="icon-btn" onClick={() => onInput(tool.sample!)} title="Load sample">
                  <FlaskConical size={14} /> Sample
                </button>
              )}
              <button className="icon-btn" onClick={paste} title="Paste from clipboard">
                <ClipboardPaste size={14} />
              </button>
              <button className="icon-btn" onClick={() => onInput('')} title="Clear">
                <Eraser size={14} />
              </button>
            </span>
          </div>
          <div className="pane__body">
            {!input && <div className="pane__placeholder">Paste or type your input…</div>}
            <CodeEditor value={input} onChange={onInput} language={isJson ? 'json' : 'text'} />
          </div>
        </div>

        <Forge pulseKey={pulse} />

        {/* output */}
        <div className={`pane${result.error ? ' error' : ''}`}>
          <div className="pane__head">
            <span className="pane__label">Output</span>
            <span className="pane__count">{stats(result.output)}</span>
            <span className="pane__actions">
              <button className="icon-btn" onClick={copy} title="Copy output" disabled={!result.output}>
                <Copy size={14} /> Copy
              </button>
            </span>
          </div>
          <div className="pane__body">
            {!result.output && !result.error && <div className="pane__placeholder">Result appears here</div>}
            <CodeEditor value={result.output} readOnly language={isJson ? 'json' : 'text'} />
            {result.error && <div className="error-banner">{result.error}</div>}
          </div>
          {result.meta?.saved != null && !result.error && (
            <div className="status-line">
              <span className="dot ok" />
              Saved {Number(result.meta.saved).toLocaleString()} chars ({String(result.meta.pct)}% smaller)
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
