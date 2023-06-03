import { useEffect, useState } from 'react';
import ItemCard from './ItemCard';
import './ItemSelector.css';
import { hexToBrighterHSL } from '../../shared/functions/color';

type ItemSelectorProps = {
  categoryItems: CategoryItem[];
};

const ItemSelector = ({ categoryItems }: ItemSelectorProps) => {
  const [mode, setMode] = useState('light');

  const onSelectMode = (mode: string) => {
    setMode(mode);
  };

  useEffect(() => {
    // Add listener to update styles
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => onSelectMode(e.matches ? 'dark' : 'light'));

    // Setup dark/light mode for the first time
    onSelectMode(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

    // Remove listener
    return () => {
      window.matchMedia('(prefers-color-scheme: dark)').removeEventListener('change', () => {});
    };
  }, []);

  return (
    <div className="itemSelector">
      {categoryItems.map(({ category, palette2, palette3, items }, index) => {
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
