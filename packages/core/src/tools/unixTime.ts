import type { CustomTool } from '../types';

/**
 * Bespoke UI (see web's UnixTimeView). The conversion logic lives in
 * {@link import('../util/time').epochInfo} so it stays pure and unit-tested.
 */
export const unixTime: CustomTool = {
  id: 'unix-time',
  name: 'Unix Timestamp',
  category: 'time',
  kind: 'custom',
  description: 'Convert a Unix epoch (seconds or ms) to Local / UTC / IST / ISO — and back.',
  keywords: ['epoch', 'unix', 'timestamp', 'time', 'date', 'utc', 'ist', 'seconds', 'milliseconds', 'convert'],
};
