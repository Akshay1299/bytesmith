import type { GeneratorTool } from '../types';

/** Generates random v4 UUIDs using the platform CSPRNG (crypto.randomUUID). */
export const uuidGenerator: GeneratorTool = {
  id: 'uuid-generator',
  name: 'UUID Generator',
  category: 'generate',
  kind: 'generate',
  description: 'Generate cryptographically-random v4 UUIDs.',
  keywords: ['uuid', 'guid', 'random', 'id', 'identifier', 'unique'],
  options: [
    {
      key: 'count',
      label: 'Count',
      type: 'select',
      default: '1',
      options: [
        { label: '1', value: '1' },
        { label: '5', value: '5' },
        { label: '10', value: '10' },
        { label: '25', value: '25' },
        { label: '50', value: '50' },
      ],
    },
    { key: 'uppercase', label: 'Uppercase', type: 'boolean', default: false },
    { key: 'hyphens', label: 'Hyphens', type: 'boolean', default: true },
  ],
  generate(options) {
    const count = Math.max(1, Number(options.count) || 1);
    const ids: string[] = [];
    for (let i = 0; i < count; i++) {
      let id: string = crypto.randomUUID();
      if (!options.hyphens) id = id.replace(/-/g, '');
      if (options.uppercase) id = id.toUpperCase();
      ids.push(id);
    }
    return { output: ids.join('\n'), meta: { count } };
  },
};
