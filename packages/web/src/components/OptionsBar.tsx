import type { Tool, ToolOptions } from '@bytesmith/core';

interface Props {
  tool: Tool;
  options: ToolOptions;
  onChange: (key: string, value: boolean | string) => void;
}

/** Renders a tool's option fields as a compact row of switches / segmented controls. */
export function OptionsBar({ tool, options, onChange }: Props) {
  if (!tool.options?.length) {
    return <div className="options" aria-hidden />;
  }
  return (
    <div className="options">
      {tool.options.map((field) => (
        <div className="opt" key={field.key}>
          <span className="opt__label">{field.label}</span>
          {field.type === 'boolean' ? (
            <button
              type="button"
              className={`switch${options[field.key] ? ' on' : ''}`}
              role="switch"
              aria-checked={Boolean(options[field.key])}
              aria-label={field.label}
              onClick={() => onChange(field.key, !options[field.key])}
            />
          ) : (
            <div className="segmented">
              {field.options?.map((opt) => (
                <button
                  key={opt.value}
                  className={options[field.key] === opt.value ? 'on' : ''}
                  onClick={() => onChange(field.key, opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
