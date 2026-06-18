import { motion } from 'framer-motion';
import type { Tool, ToolCategory } from '@bytesmith/core';
import { Logo } from './Logo';
import { CATEGORY_LABELS, toolIcon } from '../lib/icons';
import { Search } from 'lucide-react';

interface Props {
  groups: { category: ToolCategory; tools: Tool[] }[];
  activeId: string;
  onSelect: (id: string) => void;
  onOpenPalette: () => void;
}

export function ToolRail({ groups, activeId, onSelect, onOpenPalette }: Props) {
  return (
    <aside className="rail">
      {/* Home: a real link to the base URL so it reloads to a fresh default state. */}
      <a className="rail__brand" href={import.meta.env.BASE_URL} title="Bytesmith — reload">
        <Logo />
        <div>
          <div className="rail__title">Byte<b>smith</b></div>
          <div className="rail__tag">forge for JSON · strings · diffs</div>
        </div>
      </a>

      <button className="rail__search" onClick={onOpenPalette}>
        <Search size={14} />
        Search tools…
        <kbd>⌘K</kbd>
      </button>

      <div className="rail__scroll">
        {groups.map((group) => (
          <div className="rail__group" key={group.category}>
            <div className="rail__grouplabel">{CATEGORY_LABELS[group.category]}</div>
            {group.tools.map((tool) => {
              const Icon = toolIcon(tool.id, tool.category);
              const active = tool.id === activeId;
              return (
                <button
                  key={tool.id}
                  className={`tool-item${active ? ' active' : ''}`}
                  onClick={() => onSelect(tool.id)}
                >
                  {active && (
                    <motion.span layoutId="rail-active" className="tool-item__bar" transition={{ type: 'spring', stiffness: 500, damping: 38 }} />
                  )}
                  <Icon size={16} className="ico" />
                  {tool.name}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </aside>
  );
}
