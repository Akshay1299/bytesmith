import type { CustomTool } from '../types';

/**
 * Any-zone → any-zone time converter with a live world map (see web's TimezoneView).
 * Logic uses the pure helpers in {@link import('../util/time')}.
 */
export const timezoneConverter: CustomTool = {
  id: 'timezone',
  name: 'Timezone Converter',
  category: 'time',
  kind: 'custom',
  description: 'Convert a time between any two time zones, with a world map showing where each falls.',
  keywords: ['timezone', 'time zone', 'utc', 'ist', 'gmt', 'convert', 'offset', 'world clock', 'meeting'],
};
