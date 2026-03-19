import React from 'react';
import type { CatalogCategory } from '../../hooks/useCatalog';

interface CategoryFilterProps {
  categories: CatalogCategory[];
  selectedId: string;
  onSelect: (id: string) => void;
}

export const CategoryFilter = React.memo(
  ({ categories, selectedId, onSelect }: CategoryFilterProps) => {
    return (
      <div className="flex items-center gap-3 overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
        <button
          type="button"
          onClick={() => onSelect('all')}
          className={`whitespace-nowrap px-6 py-2.5 rounded-2xl text-sm font-bold transition-all ${
            selectedId === 'all'
              ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-105'
              : 'bg-white dark:bg-slate-800 text-slate-500 hover:bg-primary/10 hover:text-primary border border-slate-100 dark:border-slate-700'
          }`}
        >
          Tudo
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => onSelect(cat.id)}
            className={`whitespace-nowrap px-6 py-2.5 rounded-2xl text-sm font-bold transition-all ${
              selectedId === cat.id
                ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-105'
                : 'bg-white dark:bg-slate-800 text-slate-500 hover:bg-primary/10 hover:text-primary border border-slate-100 dark:border-slate-700'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>
    );
  },
);
