import { FC, useEffect, useState } from 'react';
import ItemCard from './ItemCard';
import './ItemSelector.css';
import { hexToBrighterHSL } from '../../shared/functions/color';

type ItemSelectorProps = {
  categoryItems: CategoryItem[];
};

const DARK_MODE_QUERY = '(prefers-color-scheme: dark)';

const readCachedItems = (): CategoryItem[] => {
  const cachedData = localStorage.getItem('cachedData');
  return cachedData ? JSON.parse(cachedData) : [];
};

const ItemSelector: FC<ItemSelectorProps> = ({ categoryItems }) => {
  const [mode, setMode] = useState(() => (window.matchMedia(DARK_MODE_QUERY).matches ? 'dark' : 'light'));

  const [cachedItems] = useState<CategoryItem[]>(readCachedItems);

  // Render fresh items when available, otherwise fall back to the cached ones
  const selectableItems = categoryItems.length > 0 ? categoryItems : cachedItems;

  useEffect(() => {
    // Keep dark/light mode in sync with the system preference
    const mediaQuery = window.matchMedia(DARK_MODE_QUERY);
    const handleChange = (e: MediaQueryListEvent) => setMode(e.matches ? 'dark' : 'light');
    mediaQuery.addEventListener('change', handleChange);

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    // Cache the latest items so they can be shown before the sheet finishes loading
    if (categoryItems.length > 0) {
      localStorage.setItem('cachedData', JSON.stringify(categoryItems));
    }
  }, [categoryItems]);

  return (
    <div className="itemSelector">
      {selectableItems.map(({ category, palette2, palette3, items }, index) => {
        const modeAwareFg = mode === 'light' ? palette3 : hexToBrighterHSL(palette3, 0.1);
        return (
          <div key={index}>
            <div className="categoryTitle" style={{ color: modeAwareFg }}>
              {category}
            </div>
            <div className="itemsGrid">
              {items.map((item, idx) => (
                <ItemCard item={item} key={idx} bg={palette2} fg={modeAwareFg} mode={mode} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ItemSelector;
