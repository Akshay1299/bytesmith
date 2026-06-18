import CodeMirror from '@uiw/react-codemirror';
import { json } from '@codemirror/lang-json';
import { EditorView } from '@codemirror/view';
import { forgeTheme } from '../lib/cm';

interface Props {
  value: string;
  onChange?: (v: string) => void;
  readOnly?: boolean;
  language?: 'json' | 'text';
}

const wrap = EditorView.lineWrapping;

export function CodeEditor({ value, onChange, readOnly = false, language = 'text' }: Props) {
  return (
    <CodeMirror
      value={value}
      onChange={onChange}
      readOnly={readOnly}
      theme={forgeTheme}
      height="100%"
      style={{ height: '100%' }}
      extensions={language === 'json' ? [json(), wrap] : [wrap]}
      basicSetup={{
        lineNumbers: true,
        foldGutter: false,
        highlightActiveLine: !readOnly,
        highlightActiveLineGutter: !readOnly,
        autocompletion: false,
        searchKeymap: true,
      }}
    />
  );
}
