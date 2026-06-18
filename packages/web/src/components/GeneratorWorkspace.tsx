import { useEffect } from 'react';
import { Copy, RefreshCw } from 'lucide-react';
import type { GeneratorTool, ToolOptions } from '@bytesmith/core';
import { CodeEditor } from './CodeEditor';
import { OptionsBar } from './OptionsBar';
import { useToast } from './toast';

interface Props {
  tool: GeneratorTool;
  value: string;
  onChange: (v: string) => void;
  options: ToolOptions;
  onOption: (key: string, value: boolean | string) => void;
}

export function GeneratorWorkspace({ tool, value, onChange, options, onOption }: Props) {
  const notify = useToast();
  const regenerate = () => onChange(tool.generate(options).output);

  // Generate on first mount and whenever options change. Intentionally not depending on
  // `regenerate`/`onChange` to avoid a render loop — options are the only real trigger.
  useEffect(() => {
    onChange(tool.generate(options).output);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tool.id, JSON.stringify(options)]);

  const copy = async () => {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    notify('Copied to clipboard');
  };

  return (
    <section className="workspace">
      <div className="ws-head">
        <div>
          <div className="ws-head__title">{tool.name}</div>
          <div className="ws-head__desc">{tool.description}</div>
        </div>
        <div className="ws-head__right">
          <button className="ghost-btn primary" onClick={regenerate}>
            <RefreshCw size={14} /> Regenerate
          </button>
        </div>
      </div>

      <OptionsBar tool={tool} options={options} onChange={onOption} />

      <div className="panes-single">
        <div className="pane">
          <div className="pane__head">
            <span className="pane__label">Output</span>
            <span className="pane__count">{value ? value.split('\n').length.toLocaleString() : 0} generated</span>
            <span className="pane__actions">
              <button className="icon-btn" onClick={copy} title="Copy all" disabled={!value}>
                <Copy size={14} /> Copy
              </button>
            </span>
          </div>
          <div className="pane__body">
            <CodeEditor value={value} readOnly language="text" />
          </div>
        </div>
      </div>
    </section>
  );
}
