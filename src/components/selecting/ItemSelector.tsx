import ItemCard from './ItemCard';
import './ItemSelector.css';

type ItemSelectorProps = {
  categoryItems: CategoryItem[];
};

const ItemSelector = ({ categoryItems }: ItemSelectorProps) => {
  return (
    <div className="itemSelector">
      {categoryItems.map(({ category, palette2, palette3, items }, index) => (
        <div key={index}>
          <div className="categoryTitle" style={{ color: palette3 }}>
            {category}
          </div>
          <div className="itemsGrid">
            {items.map((item, idx) => (
              <ItemCard item={item} key={idx} bg={palette2} fg={palette3} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ItemSelector;
