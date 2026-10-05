import { ClothingCategory } from '../types/outfit';
import { SHIRT_COLORS, TROUSER_COLORS, SHOE_COLORS } from './colors';

export interface ClothingSlotConfig {
  category: ClothingCategory;
  label: string;
  itemType: string;
  description: string;
  colors: typeof SHIRT_COLORS;
}

export const CLOTHING_SLOTS: ClothingSlotConfig[] = [
  {
    category: 'shirt',
    label: 'Shirt',
    itemType: 'Button-Up / Oxford / Polo',
    description: 'Upper body base layer setting the tonal contrast.',
    colors: SHIRT_COLORS,
  },
  {
    category: 'trousers',
    label: 'Trousers',
    itemType: 'Chinos / Tailored Trousers',
    description: 'Foundation piece anchoring the lower silhouette.',
    colors: TROUSER_COLORS,
  },
  {
    category: 'shoes',
    label: 'Shoes',
    itemType: 'Leather Derby / Loafer / Sneaker',
    description: 'Footwear completing the formality and balance.',
    colors: SHOE_COLORS,
  },
];
