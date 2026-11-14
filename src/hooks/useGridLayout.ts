import { useWindowDimensions } from 'react-native';
import { spacing } from '../theme/colors';

const MIN_CARD_WIDTH = 170;
const MAX_COLUMNS = 5;
const GAP = spacing.md;
// The list screens pad their content by spacing.lg on each side.
const SIDE_PADDING = spacing.lg * 2;

/**
 * Listing-grid sizing that follows the live window, so rotating the phone (or a tablet / large screen)
 * shows more columns instead of a few enormous square photos. Portrait phones keep the original
 * 2-column layout exactly.
 */
export function useGridLayout() {
  const { width } = useWindowDimensions();
  const columns = Math.min(MAX_COLUMNS, Math.max(2, Math.floor((width - SIDE_PADDING + GAP) / (MIN_CARD_WIDTH + GAP))));
  const cardWidth = columns === 2 ? ('48%' as const) : (width - SIDE_PADDING - GAP * (columns - 1)) / columns;
  const rowStyle = columns === 2 ? { justifyContent: 'space-between' as const } : { justifyContent: 'flex-start' as const, columnGap: GAP };
  return { columns, cardWidth, rowStyle };
}
