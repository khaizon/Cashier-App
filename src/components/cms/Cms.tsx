import { FC, useCallback, useEffect, useRef, useState } from 'react';

import './Cms.css';
import {
  AdminCategory,
  AdminItem,
  ApiError,
  createCategory,
  fetchAdminCatalog,
  reorderCategories,
} from '../../api/client';
import CategoryCard from './CategoryCard';

type CmsProps = {
  token: string;
  onExit: () => void;
  /** Called when the session is no longer valid, so App can drop the token. */
  onUnauthorized: () => void;
};

/** How many uploaded bytes have been stored, for the footer summary. */
function totalAssets(categories: AdminCategory[]): number {
  return categories.reduce((count, category) => count + category.items.filter((item) => item.image_id !== null).length, 0);
}

/** Surface a failure, or hand an expired session back to App to log out. */
function report(error: unknown, onUnauthorized: () => void, setError: (message: string) => void, fallback: string) {
  if (error instanceof ApiError && error.status === 401) {
    onUnauthorized();
    return;
  }
  setError(error instanceof Error ? error.message : fallback);
}

const Cms: FC<CmsProps> = ({ token, onExit, onUnauthorized }) => {
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newCategory, setNewCategory] = useState('');
  /** The category currently being dragged, or null when no drag is in flight. */
  const [draggingId, setDraggingId] = useState<number | null>(null);
  /** Mirror of `draggingId` for the drop handler, which may run before a re-render. */
  const draggingIdRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetchAdminCatalog(token)
      .then((result) => {
        if (cancelled) return;
        setCategories(result);
        setError('');
      })
      .catch((err: unknown) => {
        if (!cancelled) report(err, onUnauthorized, setError, 'Could not load the catalog.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token, onUnauthorized]);

  /** Re-read the server's copy after a failed optimistic update. */
  const reloadCatalog = useCallback(() => {
    fetchAdminCatalog(token)
      .then((result) => {
        setCategories(result);
        setError('');
      })
      .catch((err: unknown) => report(err, onUnauthorized, setError, 'Could not load the catalog.'));
  }, [token, onUnauthorized]);

  const replaceCategory = useCallback((updated: AdminCategory) => {
    setCategories((current) => current.map((entry) => (entry.id === updated.id ? updated : entry)));
  }, []);

  const removeCategory = useCallback((categoryId: number) => {
    setCategories((current) => current.filter((entry) => entry.id !== categoryId));
  }, []);

  const addItem = useCallback((categoryId: number, item: AdminItem) => {
    setCategories((current) =>
      current.map((entry) => (entry.id === categoryId ? { ...entry, items: [...entry.items, item] } : entry)),
    );
  }, []);

  const removeItem = useCallback((categoryId: number, itemId: number) => {
    setCategories((current) =>
      current.map((entry) =>
        entry.id === categoryId ? { ...entry, items: entry.items.filter((item) => item.id !== itemId) } : entry,
      ),
    );
  }, []);

  const addCategory = () => {
    const name = newCategory.trim();
    if (!name) return;

    createCategory(token, name)
      .then((created) => {
        setCategories((current) => [...current, created]);
        setNewCategory('');
      })
      .catch((err: unknown) => report(err, onUnauthorized, setError, 'Could not create the category.'));
  };

  /**
   * Persist a reordered list.
   *
   * The list is shown immediately and only replaced once the server confirms,
   * so dragging feels instant. If the save fails the local guess may now
   * disagree with the stored order, so the server's copy is re-read.
   */
  const saveOrder = useCallback(
    (ordered: AdminCategory[]) => {
      reorderCategories(token, ordered.map((category) => category.id))
        .then((saved) => {
          setCategories(saved);
          setError('');
        })
        .catch((err: unknown) => {
          report(err, onUnauthorized, setError, 'Could not save the category order.');
          reloadCatalog();
        });
    },
    [token, onUnauthorized, reloadCatalog],
  );

  /** Move a category one slot earlier (-1) or later (+1). */
  const moveCategory = useCallback(
    (categoryId: number, delta: -1 | 1) => {
      const index = categories.findIndex((entry) => entry.id === categoryId);
      const target = index + delta;
      if (index < 0 || target < 0 || target >= categories.length) return;

      const next = [...categories];
      const [moved] = next.splice(index, 1);
      next.splice(target, 0, moved);
      setCategories(next);
      saveOrder(next);
    },
    [categories, saveOrder],
  );

  const beginDrag = useCallback((categoryId: number) => {
    draggingIdRef.current = categoryId;
    setDraggingId(categoryId);
  }, []);

  const endDrag = useCallback(() => {
    draggingIdRef.current = null;
    setDraggingId(null);
  }, []);

  /** Drop the dragged category into the slot of the one it was released over. */
  const dropCategory = useCallback(
    (targetId: number) => {
      // Read the ref rather than state: drop can arrive before React re-renders
      // with the category that dragstart just recorded.
      const sourceId = draggingIdRef.current;
      endDrag();
      if (sourceId === null || sourceId === targetId) return;

      const from = categories.findIndex((entry) => entry.id === sourceId);
      const to = categories.findIndex((entry) => entry.id === targetId);
      if (from < 0 || to < 0) return;

      const next = [...categories];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      setCategories(next);
      saveOrder(next);
    },
    [categories, endDrag, saveOrder],
  );

  return (
    <div className="cms">
      <header className="cmsHeader">
        <div>
          <h1>Catalog CMS</h1>
          <p>
            {categories.length} categor{categories.length === 1 ? 'y' : 'ies'} ·{' '}
            {categories.reduce((count, category) => count + category.items.length, 0)} items · {totalAssets(categories)}{' '}
            uploaded image{totalAssets(categories) === 1 ? '' : 's'}
          </p>
        </div>
        <button type="button" className="cmsSecondary" onClick={onExit}>
          back to till
        </button>
      </header>

      {error && (
        <div className="cmsError" role="alert">
          {error}
          <button type="button" onClick={() => setError('')} aria-label="Dismiss">
            ×
          </button>
        </div>
      )}

      <div className="cmsAddCategory">
        <input
          placeholder="new category name"
          value={newCategory}
          onChange={(event) => setNewCategory(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') addCategory();
          }}
        />
        <button type="button" onClick={addCategory} disabled={!newCategory.trim()}>
          add category
        </button>
      </div>

      {loading ? (
        <p className="cmsLoading">loading catalog…</p>
      ) : categories.length === 0 ? (
        <p className="cmsLoading">No categories yet. Add one above to get started.</p>
      ) : (
        categories.map((category, index) => (
          <CategoryCard
            key={category.id}
            category={category}
            position={index + 1}
            total={categories.length}
            dragging={draggingId === category.id}
            onMove={moveCategory}
            onDragStart={beginDrag}
            onDragEnd={endDrag}
            onDrop={dropCategory}
            token={token}
            onCategoryChanged={replaceCategory}
            onCategoryRemoved={removeCategory}
            onItemAdded={addItem}
            onItemRemoved={removeItem}
            onError={setError}
            onUnauthorized={onUnauthorized}
          />
        ))
      )}
    </div>
  );
};

export default Cms;
