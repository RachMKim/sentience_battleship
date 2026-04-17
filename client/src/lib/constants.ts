import type { ShipName } from './types';

export const SHIP_COLORS: Record<ShipName, string> = {
  carrier: 'bg-purple-600',
  battleship: 'bg-blue-600',
  cruiser: 'bg-teal-500',
  submarine: 'bg-green-500',
  destroyer: 'bg-yellow-500',
};

export const SHIP_LABELS: Record<ShipName, string> = {
  carrier: 'Carrier',
  battleship: 'Battleship',
  cruiser: 'Cruiser',
  submarine: 'Submarine',
  destroyer: 'Destroyer',
};

export const COLUMN_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
export const ROW_LABELS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
