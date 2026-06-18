import { ArrowLeftRight, Copy, Eraser, FlaskConical } from 'lucide-react';
import type { DiffResult, DiffRow, DiffTool } from '@bytesmith/core';
import { CodeEditor } from './CodeEditor';
import { useToast } from './toast';

interface Props {
  tool: DiffTool;
  left: string;
  right: string;
  onLeft: (v: string) => void;
  onRight: (v: string) => void;
  result: DiffResult;
}

function unified(rows: DiffRow[]): string {
  return rows
    .map((r) => {
      switch (r.type) {
        case 'equal':
          return `  ${r.left?.text ?? ''}`;
        case 'del':
          return `- ${r.left?.text ?? ''}`;
        case 'add':
          return `+ ${r.right?.text ?? ''}`;
        case 'change':
          return `- ${r.left?.text ?? ''}\n+ ${r.right?.text ?? ''}`;
      }
    })
    .join('\n');
}

function Cell({ side, kind }: { side?: { n: number; text: string }; kind: string }) {
  if (!side) return <div className="diff-cell empty" />;
  return (
    <div className={`diff-cell ${kind}`}>
      <span className="ln">{side.n}</span>
      <span className="tx">{side.text || ' '}</span>
    </div>
  );
}

export function DiffWorkspace({ tool, left, right, onLeft, onRight, result }: Props) {
  const notify = useToast();
  const lang = tool.id.startsWith('json') ? 'json' : 'text';
  const hasInput = left.length > 0 || right.length > 0;

  const loadSample = () => {
    onLeft(tool.sampleLeft ?? '');
    onRight(tool.sampleRight ?? '');
  };
  const swap = () => {
    const l = left;
    onLeft(right);
    onRight(l);
  };
  const copyUnified = async () => {
    if (!result.rows.length) return;
    await navigator.clipboard.writeText(unified(result.rows));
    notify('Copied unified diff');
  };

  return (
    <section className="workspace">
      <div className="ws-head">
        <div>
          <div className="ws-head__title">{tool.name}</div>
          <div className="ws-head__desc">{tool.description}</div>
        </div>
        <div className="ws-head__right">
          {(tool.sampleLeft || tool.sampleRight) && (
            <button className="ghost-btn" onClick={loadSample}>
              <FlaskConical size={14} /> Sample
            </button>
          )}
          <button className="ghost-btn" onClick={swap} title="Swap sides">
            <ArrowLeftRight size={14} /> Swap
          </button>
        </div>
      </div>

      <div className="diff-layout">
        <div className="diff-inputs">
          <div className="pane">
            <div className="pane__head">
              <span className="pane__label">Original</span>
              <span className="pane__actions">
                <button className="icon-btn" onClick={() => onLeft('')} title="Clear">
                  <Eraser size={14} />
                </button>
              </span>
            </div>
            <div className="pane__body">
              {!left && <div className="pane__placeholder">Paste the original…</div>}
              <CodeEditor value={left} onChange={onLeft} language={lang} />
            </div>
          </div>

          <div className="pane">
            <div className="pane__head">
              <span className="pane__label">Changed</span>
              <span className="pane__actions">
                <button className="icon-btn" onClick={() => onRight('')} title="Clear">
                  <Eraser size={14} />
                </button>
              </span>
            </div>
            <div className="pane__body">
              {!right && <div className="pane__placeholder">Paste the changed version…</div>}
              <CodeEditor value={right} onChange={onRight} language={lang} />
            </div>
          </div>
        </div>

        <div className={`pane diff-result${result.error ? ' error' : ''}`}>
          <div className="pane__head">
            <span className="pane__label">Diff</span>
            {result.meta && (
              <span className="diff-summary">
                <span className="add">+{result.meta.added}</span>
                <span className="del">−{result.meta.removed}</span>
              </span>
            )}
            <span className="pane__actions" style={{ marginLeft: result.meta ? 12 : 'auto' }}>
              <button className="icon-btn" onClick={copyUnified} disabled={!result.rows.length} title="Copy unified diff">
                <Copy size={14} /> Copy
              </button>
            </span>
          </div>
          <div className="pane__body">
            {result.error ? (
              <div className="error-banner">{result.error}</div>
            ) : !hasInput ? (
              <div className="pane__placeholder">Paste two inputs to compare</div>
            ) : result.rows.length === 0 ? (
              <div className="pane__placeholder">No differences</div>
            ) : (
              <div className="diff">
                {result.rows.map((row, i) => (
                  <div className="diff-row" key={i}>
                    <Cell side={row.left} kind={row.type === 'change' ? 'del' : row.type === 'del' ? 'del' : 'eq'} />
                    <Cell side={row.right} kind={row.type === 'change' ? 'add' : row.type === 'add' ? 'add' : 'eq'} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
