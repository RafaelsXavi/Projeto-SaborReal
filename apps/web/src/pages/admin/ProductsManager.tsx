import type { CatalogItem } from '@saborreal/shared';
import type { FormEvent } from 'react';
import { useState } from 'react';
import { MaterialIcon } from '../../components/MaterialIcon';
import { Skeleton } from '../../components/Skeleton';
import { useAdminCatalog } from '../../hooks/useAdminCatalog';
import { formatPrice } from '../../utils/format';

export function ProductsManager() {
  const { items, categories, loading, create, update, remove, isProcessing } =
    useAdminCatalog();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CatalogItem | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    priceCents: 0,
    categoryId: '',
    imageUrl: '',
    available: true,
  });

  const openCreateModal = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      description: '',
      priceCents: 0,
      categoryId: categories[0]?.id || '',
      imageUrl: '',
      available: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item: CatalogItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description || '',
      priceCents: item.priceCents,
      categoryId: item.categoryId,
      imageUrl: item.imageUrl || '',
      available: item.available ?? true,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await update({ id: editingItem.id, data: formData });
      } else {
        await create(formData);
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error('Failed to save product:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;
    try {
      await remove(id);
    } catch (err) {
      console.error('Failed to delete product:', err);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full" variant="rect" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-extrabold flex items-center gap-2">
          <span className="w-2 h-6 bg-primary rounded-full" />
          Gerenciar Cardápio
        </h3>
        <button
          type="button"
          onClick={openCreateModal}
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:brightness-110 active:scale-95"
        >
          <MaterialIcon name="add" />
          Novo Produto
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex flex-col rounded-2xl border border-primary/5 bg-white p-4 shadow-sm dark:bg-slate-800/40"
          >
            <div className="flex gap-4">
              <div className="size-16 shrink-0 overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <MaterialIcon
                      name="restaurant"
                      className="text-slate-300"
                    />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="truncate font-bold text-slate-900 dark:text-slate-100">
                  {item.name}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {item.categoryName}
                </p>
                <p className="mt-1 font-black text-primary">
                  {formatPrice(item.priceCents)}
                </p>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between gap-2 border-t border-slate-50 pt-3 dark:border-slate-800">
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${item.available ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30' : 'bg-rose-100 text-rose-600 dark:bg-rose-900/30'}`}
              >
                {item.available ? 'Disponível' : 'Indisponível'}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => openEditModal(item)}
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-50 hover:text-primary dark:hover:bg-slate-800"
                >
                  <MaterialIcon name="edit" className="text-lg" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(item.id)}
                  className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-900/20"
                >
                  <MaterialIcon name="delete" className="text-lg" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-[2rem] bg-white p-8 shadow-2xl dark:bg-slate-900">
            <h3 className="mb-6 text-2xl font-black">
              {editingItem ? 'Editar Produto' : 'Novo Produto'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label
                    htmlFor="product-name"
                    className="mb-1 block text-xs font-bold uppercase tracking-widest text-slate-400"
                  >
                    Nome
                  </label>
                  <input
                    id="product-name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-bold placeholder:text-slate-300 focus:border-primary/30 focus:outline-none dark:border-slate-800 dark:bg-slate-800/50"
                  />
                </div>
                <div className="col-span-2">
                  <label
                    htmlFor="product-description"
                    className="mb-1 block text-xs font-bold uppercase tracking-widest text-slate-400"
                  >
                    Descrição
                  </label>
                  <textarea
                    id="product-description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-bold placeholder:text-slate-300 focus:border-primary/30 focus:outline-none dark:border-slate-800 dark:bg-slate-800/50"
                    rows={2}
                  />
                </div>
                <div>
                  <label
                    htmlFor="product-price"
                    className="mb-1 block text-xs font-bold uppercase tracking-widest text-slate-400"
                  >
                    Preço (Cents)
                  </label>
                  <input
                    id="product-price"
                    type="number"
                    required
                    value={formData.priceCents}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        priceCents: Number(e.target.value),
                      })
                    }
                    className="w-full rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-bold focus:border-primary/30 focus:outline-none dark:border-slate-800 dark:bg-slate-800/50"
                  />
                </div>
                <div>
                  <label
                    htmlFor="product-category"
                    className="mb-1 block text-xs font-bold uppercase tracking-widest text-slate-400"
                  >
                    Categoria
                  </label>
                  <select
                    id="product-category"
                    value={formData.categoryId}
                    onChange={(e) =>
                      setFormData({ ...formData, categoryId: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-bold focus:border-primary/30 focus:outline-none dark:border-slate-800 dark:bg-slate-800/50"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <label
                    htmlFor="product-image-url"
                    className="mb-1 block text-xs font-bold uppercase tracking-widest text-slate-400"
                  >
                    URL da Imagem
                  </label>
                  <input
                    id="product-image-url"
                    type="text"
                    value={formData.imageUrl}
                    onChange={(e) =>
                      setFormData({ ...formData, imageUrl: e.target.value })
                    }
                    placeholder="https://exemplo.com/foto.jpg"
                    className="w-full rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-bold placeholder:text-slate-300 focus:border-primary/30 focus:outline-none dark:border-slate-800 dark:bg-slate-800/50"
                  />
                </div>
                <div className="col-span-2 flex items-center gap-2 py-2">
                  <input
                    type="checkbox"
                    id="available"
                    checked={formData.available}
                    onChange={(e) =>
                      setFormData({ ...formData, available: e.target.checked })
                    }
                    className="size-4 rounded accent-primary"
                  />
                  <label
                    htmlFor="available"
                    className="text-sm font-bold text-slate-600 dark:text-slate-400"
                  >
                    Disponível para venda
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 rounded-xl bg-slate-100 px-4 py-4 text-xs font-black uppercase tracking-widest text-slate-500 transition-all hover:bg-slate-200 active:scale-95 dark:bg-slate-800 dark:text-slate-400"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="flex-1 rounded-xl bg-primary px-4 py-4 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-primary/20 transition-all hover:brightness-110 active:scale-95 disabled:opacity-50"
                >
                  {isProcessing ? 'Salvando...' : 'Salvar Produto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
