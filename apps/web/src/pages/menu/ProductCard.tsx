import { motion } from 'framer-motion';
import React from 'react';
import { MaterialIcon } from '../../components/MaterialIcon';
import type { CatalogItem } from '../../hooks/useCatalog';
import { formatPrice } from '../../utils/format';

interface ProductCardProps {
  item: CatalogItem;
  onAdd: (it: CatalogItem) => void;
}

export const ProductCard = React.memo(({ item, onAdd }: ProductCardProps) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      className="bg-white dark:bg-slate-800 rounded-3xl overflow-hidden border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-xl transition-shadow group flex flex-col h-full"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          />
        ) : (
          <div className="w-full h-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
            <MaterialIcon
              name="restaurant"
              className="text-4xl text-slate-300 dark:text-slate-600"
            />
          </div>
        )}
        <div className="absolute top-3 right-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20 shadow-xl">
          <p className="text-primary font-black text-sm">
            {formatPrice(item.priceCents)}
          </p>
        </div>
      </div>

      <div className="p-5 flex flex-col flex-1">
        <div className="mb-4 flex-1">
          <h4 className="text-lg font-extrabold text-slate-900 dark:text-slate-100 group-hover:text-primary transition-colors">
            {item.name}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 line-clamp-2 font-medium">
            {item.description}
          </p>
        </div>

        <button
          type="button"
          onClick={() => onAdd(item)}
          className="w-full py-3.5 bg-slate-100 dark:bg-slate-700 hover:bg-primary hover:text-white transition-all rounded-2xl flex items-center justify-center gap-2 font-black text-xs uppercase tracking-widest text-slate-700 dark:text-slate-200"
        >
          <MaterialIcon name="add" className="text-lg" />
          Adicionar ao Carrinho
        </button>
      </div>
    </motion.div>
  );
});
