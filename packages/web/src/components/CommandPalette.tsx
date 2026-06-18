import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Search } from 'lucide-react';
import type { Tool } from '@bytesmith/core';
import { CATEGORY_LABELS, toolIcon } from '../lib/icons';

interface Props {
  open: boolean;
  tools: Tool[];
  onSelect: (id: string) => void;
  onClose: () => void;
}

export function CommandPalette({ open, tools, onSelect, onClose }: Props) {
  const [query, setQuery] = useState('');
  const [index, setIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tools;
    return tools.filter(
      (t) => t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q) || t.id.includes(q),
    );
  }, [query, tools]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setIndex(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  useEffect(() => {
    setIndex(0);
  }, [query]);

  const choose = (id: string) => {
    onSelect(id);
    onClose();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIndex((i) => Math.min(i + 1, matches.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && matches[index]) {
      e.preventDefault();
      choose(matches[index].id);
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="palette-scrim"
          onMouseDown={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.12 }}
        >
          <motion.div
            className="palette"
            onMouseDown={(e) => e.stopPropagation()}
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 460, damping: 34 }}
          >
            <div className="palette__input">
              <Search size={17} color="#9aa1b1" />
              <input
                ref={inputRef}
                value={query}
                placeholder="Search tools…"
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onKeyDown}
              />
            </div>
            <div className="palette__list">
              {matches.map((tool, i) => {
                const Icon = toolIcon(tool.id, tool.category);
                return (
                  <div
                    key={tool.id}
                    className={`palette__item${i === index ? ' active' : ''}`}
                    onMouseEnter={() => setIndex(i)}
                    onClick={() => choose(tool.id)}
                  >
                    <Icon size={17} className="ico" />
                    <div>
                      {tool.name}
                      <br />
                      <small>{tool.description}</small>
                    </div>
                    <span className="palette__cat">{CATEGORY_LABELS[tool.category]}</span>
                  </div>
                );
              })}
              {matches.length === 0 && (
                <div className="palette__item" style={{ color: '#626a7c' }}>No tools match “{query}”.</div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
