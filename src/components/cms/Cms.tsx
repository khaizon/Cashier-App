import { FC, useCallback, useEffect, useState } from 'react';

import './Cms.css';
import { AdminCategory, AdminItem, ApiError, createCategory, fetchAdminCatalog } from '../../api/client';
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
        categories.map((category) => (
          <CategoryCard
            key={category.id}
            category={category}
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
