import { FC, useRef, useState } from 'react';

import './Cms.css';
import {
  AdminCategory,
  AdminItem,
  ApiError,
  CropBox,
  createItem,
  deleteCategory,
  deleteItem,
  resolveImageSrc,
  updateCategory,
  updateItem,
  uploadItemImage,
} from '../../api/client';
import ImageCropper from './ImageCropper';

type CategoryCardProps = {
  category: AdminCategory;
  token: string;
  onCategoryChanged: (category: AdminCategory) => void;
  onCategoryRemoved: (categoryId: number) => void;
  onItemAdded: (categoryId: number, item: AdminItem) => void;
  onItemRemoved: (categoryId: number, itemId: number) => void;
  onError: (message: string) => void;
  onUnauthorized: () => void;
};

type ItemDraft = {
  title: string;
  /** Kept as the operator's raw text so partial input is not fought with. */
  price: string;
  imageId: number | null;
  imageUrl: string | null;
};

function toDraft(item: AdminItem): ItemDraft {
  return {
    title: item.title,
    price: (item.price_cents / 100).toFixed(2),
    imageId: item.image_id,
    imageUrl: item.image_url,
  };
}

/** "12.5" -> 1250 cents. Returns null when the text is not a usable price. */
function parsePriceToCents(value: string): number | null {
  const normalised = value.trim();
  if (!/^\d+(\.\d{0,2})?$/.test(normalised)) return null;
  return Math.round(Number(normalised) * 100);
}

const CategoryCard: FC<CategoryCardProps> = ({
  category,
  token,
  onCategoryChanged,
  onCategoryRemoved,
  onItemAdded,
  onItemRemoved,
  onError,
  onUnauthorized,
}) => {
  const [name, setName] = useState(category.name);
  const [drafts, setDrafts] = useState<Record<number, ItemDraft>>({});
  const [busyItemId, setBusyItemId] = useState<number | null>(null);
  const [cropTarget, setCropTarget] = useState<{ itemId: number; file: File } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const fileInputs = useRef<Record<number, HTMLInputElement | null>>({});

  /** Every failure funnels through here so an expired session is handled once. */
  const fail = (error: unknown, fallback: string) => {
    if (error instanceof ApiError && error.status === 401) {
      onUnauthorized();
      return;
    }
    onError(error instanceof Error ? error.message : fallback);
  };

  const draftFor = (item: AdminItem): ItemDraft => drafts[item.id] ?? toDraft(item);

  const patchDraft = (itemId: number, patch: Partial<ItemDraft>, fallback: ItemDraft) => {
    setDrafts((current) => ({ ...current, [itemId]: { ...(current[itemId] ?? fallback), ...patch } }));
  };

  const saveCategoryName = () => {
    const trimmed = name.trim();
    if (!trimmed || trimmed === category.name) {
      setName(category.name);
      return;
    }
    updateCategory(token, category.id, { name: trimmed })
      .then(onCategoryChanged)
      .catch((error: unknown) => {
        setName(category.name);
        fail(error, 'Could not rename the category.');
      });
  };

  const saveItem = (item: AdminItem) => {
    const draft = draftFor(item);
    const cents = parsePriceToCents(draft.price);
    if (!draft.title.trim()) {
      onError('Item title cannot be empty.');
      return;
    }
    if (cents === null) {
      onError('Price must be a number like 3.50.');
      return;
    }

    setBusyItemId(item.id);
    updateItem(token, item.id, { title: draft.title.trim(), price_cents: cents, image_id: draft.imageId })
      .then((updated) => {
        // Drop the draft only once the server has acknowledged it.
        setDrafts((current) => {
          const next = { ...current };
          delete next[item.id];
          return next;
        });
        onCategoryChanged({
          ...category,
          items: category.items.map((entry) => (entry.id === updated.id ? updated : entry)),
        });
      })
      .catch((error: unknown) => fail(error, 'Could not save the item.'))
      .finally(() => setBusyItemId(null));
  };

  const removeItem = (item: AdminItem) => {
    setBusyItemId(item.id);
    deleteItem(token, item.id)
      .then(() => onItemRemoved(category.id, item.id))
      .catch((error: unknown) => fail(error, 'Could not delete the item.'))
      .finally(() => setBusyItemId(null));
  };

  const addItem = () => {
    const cents = parsePriceToCents(newPrice);
    if (!newTitle.trim() || cents === null) {
      onError('Give the new item a title and a price like 3.50.');
      return;
    }
    createItem(token, { category_id: category.id, title: newTitle.trim(), price_cents: cents })
      .then((created) => {
        setNewTitle('');
        setNewPrice('');
        onItemAdded(category.id, created);
      })
      .catch((error: unknown) => fail(error, 'Could not add the item.'));
  };

  /** Upload the original file with the chosen crop; the server makes it square. */
  const applyCrop = (crop: CropBox) => {
    if (!cropTarget) return;
    const { itemId, file } = cropTarget;
    const item = category.items.find((entry) => entry.id === itemId);
    setUploading(true);

    uploadItemImage(token, file, crop)
      .then((uploaded) => {
        if (item) {
          patchDraft(itemId, { imageId: uploaded.id, imageUrl: uploaded.url }, toDraft(item));
        }
        setCropTarget(null);
      })
      .catch((error: unknown) => fail(error, 'Could not upload the image.'))
      .finally(() => setUploading(false));
  };

  const removeCategory = () => {
    if (!window.confirm(`Delete "${category.name}" and its ${category.items.length} item(s)?`)) {
      return;
    }
    deleteCategory(token, category.id)
      .then(() => onCategoryRemoved(category.id))
      .catch((error: unknown) => fail(error, 'Could not delete the category.'));
  };

  return (
    <section className="cmsCategory">
      <header className="cmsCategoryHeader">
        <input
          className="cmsCategoryName"
          value={name}
          onChange={(event) => setName(event.target.value)}
          onBlur={saveCategoryName}
          onKeyDown={(event) => {
            if (event.key === 'Enter') event.currentTarget.blur();
          }}
          aria-label={`Category name for ${category.name}`}
        />
        <div className="cmsPalette" aria-label="Category palette">
          {(['palette1', 'palette2', 'palette3'] as const).map((slot) => (
            <input
              key={slot}
              type="color"
              value={category[slot] || '#000000'}
              title={`${slot}: ${category[slot] || 'unset'}`}
              onChange={(event) => {
                updateCategory(token, category.id, { [slot]: event.target.value })
                  .then(onCategoryChanged)
                  .catch((error: unknown) => fail(error, 'Could not save the palette.'));
              }}
            />
          ))}
        </div>
        <button type="button" className="cmsDanger" onClick={removeCategory}>
          delete category
        </button>
      </header>

      <ul className="cmsItems">
        {category.items.map((item) => {
          const draft = draftFor(item);
          const dirty = draft.title !== item.title || parsePriceToCents(draft.price) !== item.price_cents || draft.imageId !== item.image_id;
          const preview = draft.imageUrl ?? item.image_url ?? item.img;

          return (
            <li key={item.id} className="cmsItem">
              <button
                type="button"
                className="cmsThumb"
                title="Choose an image"
                onClick={() => fileInputs.current[item.id]?.click()}
              >
                {preview ? (
                  <img src={resolveImageSrc(preview)} alt="" />
                ) : (
                  <span className="cmsThumbEmpty">no image</span>
                )}
              </button>
              <input
                ref={(node) => {
                  fileInputs.current[item.id] = node;
                }}
                type="file"
                accept="image/*"
                hidden
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  // Reset so picking the same file again still fires onChange.
                  event.target.value = '';
                  if (file) setCropTarget({ itemId: item.id, file });
                }}
              />

              <input
                className="cmsItemTitle"
                value={draft.title}
                aria-label={`Title for ${item.title}`}
                onChange={(event) => patchDraft(item.id, { title: event.target.value }, toDraft(item))}
              />
              <label className="cmsItemPrice">
                $
                <input
                  value={draft.price}
                  inputMode="decimal"
                  aria-label={`Price for ${item.title}`}
                  onChange={(event) => patchDraft(item.id, { price: event.target.value }, toDraft(item))}
                />
              </label>

              <button type="button" className="cmsSave" disabled={!dirty || busyItemId === item.id} onClick={() => saveItem(item)}>
                {busyItemId === item.id ? '…' : 'save'}
              </button>
              <button type="button" className="cmsDanger" disabled={busyItemId === item.id} onClick={() => removeItem(item)}>
                delete
              </button>
            </li>
          );
        })}
      </ul>

      <div className="cmsAddItem">
        <input placeholder="new item title" value={newTitle} onChange={(event) => setNewTitle(event.target.value)} />
        <input placeholder="0.00" inputMode="decimal" value={newPrice} onChange={(event) => setNewPrice(event.target.value)} />
        <button type="button" onClick={addItem}>
          add item
        </button>
      </div>

      {cropTarget && (
        <ImageCropper
          file={cropTarget.file}
          busy={uploading}
          onCancel={() => setCropTarget(null)}
          onApply={applyCrop}
        />
      )}
    </section>
  );
};

export default CategoryCard;
