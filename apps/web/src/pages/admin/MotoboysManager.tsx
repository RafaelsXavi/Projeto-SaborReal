import type { User as Motoboy } from '@saborreal/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { memo, useCallback, useState } from 'react';
import { apiFetch, userFriendlyError } from '../../api';
import { MaterialIcon } from '../../components/MaterialIcon';

async function fetchMotoboys(): Promise<Motoboy[]> {
  const res = await apiFetch('/v1/admin/motoboys');
  const data = (await res.json()) as { ok: boolean; motoboys: Motoboy[] };
  return Array.isArray(data.motoboys) ? data.motoboys : [];
}

/* Motoboy row (memoized to avoid re-renders when parent state changes) */
const MotoboyRow = memo(function MotoboyRow({
  motoboy,
  onEdit,
  onDelete,
  disabled,
}: {
  motoboy: Motoboy;
  onEdit: (m: Motoboy) => void;
  onDelete: (id: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-primary/5 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:bg-slate-900/40 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary sm:h-12 sm:w-12">
          <MaterialIcon
            name="delivery_dining"
            className="text-xl sm:text-2xl"
          />
        </div>
        <div className="min-w-0">
          <p className="truncate font-bold text-slate-900 dark:text-slate-100">
            {motoboy.email ?? motoboy.phone ?? motoboy.id.slice(0, 8)}
          </p>
          <div className="flex flex-wrap gap-2 text-xs text-slate-400">
            {motoboy.phone && <span>Tel: {motoboy.phone}</span>}
            <span>ID: {motoboy.id.slice(0, 8)}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 self-end sm:self-auto">
        <button
          type="button"
          onClick={() => onEdit(motoboy)}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition-all hover:bg-slate-50 hover:text-primary dark:border-slate-700 dark:hover:bg-slate-800 sm:h-10 sm:w-10"
          title="Editar"
        >
          <MaterialIcon name="edit" className="text-base sm:text-lg" />
        </button>
        <button
          type="button"
          onClick={() => onDelete(motoboy.id)}
          disabled={disabled}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-red-200 text-red-400 transition-all hover:bg-red-50 hover:text-red-500 disabled:opacity-50 dark:border-red-800 dark:hover:bg-red-950/30 sm:h-10 sm:w-10"
          title="Remover"
        >
          <MaterialIcon name="delete" className="text-base sm:text-lg" />
        </button>
      </div>
    </div>
  );
});

export function MotoboysManager() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery<Motoboy[]>({
    queryKey: ['admin', 'motoboys'],
    queryFn: fetchMotoboys,
    staleTime: 30_000,
  });
  const motoboys: Motoboy[] = data ?? [];

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const invalidate = useCallback(
    () => queryClient.invalidateQueries({ queryKey: ['admin', 'motoboys'] }),
    [queryClient],
  );

  const createMutation = useMutation({
    mutationFn: async (input: {
      identifier: string;
      password: string;
      phone?: string;
    }) => {
      const res = await apiFetch('/v1/admin/motoboys', {
        method: 'POST',
        body: JSON.stringify(input),
      });
      if (!res.ok) throw await res.json();
      return res.json();
    },
    onSuccess: () => {
      invalidate();
      resetForm();
      flashSuccess('Motoboy criado com sucesso!');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      ...body
    }: {
      id: string;
      email?: string;
      phone?: string;
      password?: string;
    }) => {
      const res = await apiFetch(`/v1/admin/motoboys/${id}`, {
        method: 'PUT',
        body: JSON.stringify(body),
      });
      if (!res.ok) throw await res.json();
      return res.json();
    },
    onSuccess: () => {
      invalidate();
      resetForm();
      flashSuccess('Motoboy atualizado com sucesso!');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiFetch(`/v1/admin/motoboys/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw await res.json();
    },
    onSuccess: () => {
      invalidate();
      flashSuccess('Motoboy removido com sucesso!');
    },
  });

  const isProcessing =
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending;

  /* ── Helpers (stable references via useCallback) ── */

  function flashSuccess(msg: string) {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 3000);
  }

  const resetForm = useCallback(() => {
    setShowForm(false);
    setEditingId(null);
    setIdentifier('');
    setPassword('');
    setPhone('');
    setError(null);
  }, []);

  const startEdit = useCallback((m: Motoboy) => {
    setEditingId(m.id);
    setIdentifier(m.email ?? m.phone ?? '');
    setPhone(m.phone ?? '');
    setPassword('');
    setShowForm(true);
    setError(null);
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      try {
        if (editingId) {
          await updateMutation.mutateAsync({
            id: editingId,
            ...(identifier.includes('@') ? { email: identifier } : {}),
            ...(phone ? { phone } : {}),
            ...(password ? { password } : {}),
          });
        } else {
          await createMutation.mutateAsync({
            identifier,
            password,
            ...(phone ? { phone } : {}),
          });
        }
      } catch (err) {
        setError(userFriendlyError(err));
      }
    },
    [editingId, identifier, phone, password, updateMutation, createMutation],
  );

  const handleDelete = useCallback(
    async (id: string) => {
      setError(null);
      try {
        await deleteMutation.mutateAsync(id);
      } catch (err) {
        setError(userFriendlyError(err));
      }
    },
    [deleteMutation],
  );

  const handleShowForm = useCallback(() => {
    resetForm();
    setShowForm(true);
  }, [resetForm]);

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="flex items-center gap-2 text-lg font-extrabold sm:text-xl">
          <span className="h-6 w-2 rounded-full bg-primary" />
          Gestão de Motoboys
          <span className="ml-1 rounded-md bg-slate-200 px-2 py-0.5 text-xs font-bold text-slate-500 dark:bg-slate-800">
            {motoboys.length}
          </span>
        </h3>
        {!showForm && (
          <button
            type="button"
            onClick={handleShowForm}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:brightness-110 sm:w-auto"
          >
            <MaterialIcon name="person_add" className="text-lg" />
            Adicionar Motoboy
          </button>
        )}
      </div>

      {/* Feedback banners */}
      {success && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-bold text-emerald-600 dark:border-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400">
          <MaterialIcon name="check_circle" className="text-lg" />
          {success}
        </div>
      )}
      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-500 dark:border-red-800 dark:bg-red-950/20">
          <MaterialIcon name="error" className="text-lg" />
          {error}
        </div>
      )}

      {/* Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-6 rounded-2xl border border-primary/10 bg-white p-4 shadow-sm dark:bg-slate-900/40 sm:p-6"
        >
          <h4 className="mb-4 text-lg font-bold">
            {editingId ? 'Editar Motoboy' : 'Novo Motoboy'}
          </h4>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label
                className="mb-1 block text-sm font-semibold text-slate-600 dark:text-slate-400"
                htmlFor="mb-ident"
              >
                E-mail ou telefone
              </label>
              <input
                id="mb-ident"
                className="h-11 w-full rounded-lg border border-slate-200 bg-white px-4 text-sm outline-none transition-all focus:ring-2 focus:ring-primary dark:border-slate-700 dark:bg-slate-800"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="email@exemplo.com"
                required={!editingId}
              />
            </div>
            <div>
              <label
                className="mb-1 block text-sm font-semibold text-slate-600 dark:text-slate-400"
                htmlFor="mb-phone"
              >
                Telefone
              </label>
              <input
                id="mb-phone"
                className="h-11 w-full rounded-lg border border-slate-200 bg-white px-4 text-sm outline-none transition-all focus:ring-2 focus:ring-primary dark:border-slate-700 dark:bg-slate-800"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(11) 99999-9999"
              />
            </div>
            <div>
              <label
                className="mb-1 block text-sm font-semibold text-slate-600 dark:text-slate-400"
                htmlFor="mb-pass"
              >
                Senha {editingId && '(deixe vazio para manter)'}
              </label>
              <input
                id="mb-pass"
                className="h-11 w-full rounded-lg border border-slate-200 bg-white px-4 text-sm outline-none transition-all focus:ring-2 focus:ring-primary dark:border-slate-700 dark:bg-slate-800"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimo 8 caracteres"
                required={!editingId}
                minLength={8}
              />
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <button
              type="submit"
              disabled={isProcessing}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:brightness-110 disabled:opacity-50 sm:flex-none"
            >
              {isProcessing ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <MaterialIcon
                  name={editingId ? 'save' : 'person_add'}
                  className="text-lg"
                />
              )}
              {editingId ? 'Salvar' : 'Criar'}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="flex-1 rounded-xl border border-slate-200 px-6 py-2.5 text-sm font-bold transition-all hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800 sm:flex-none"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center rounded-2xl border border-primary/5 bg-white p-12 dark:bg-slate-900/40">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
        </div>
      ) : motoboys.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-primary/5 bg-white p-8 dark:bg-slate-900/40 sm:p-12">
          <MaterialIcon
            name="person_off"
            className="mb-3 text-4xl text-slate-300"
          />
          <p className="font-bold text-slate-400">Nenhum motoboy cadastrado</p>
          <p className="text-sm text-slate-400">
            Clique em "Adicionar Motoboy" para comecar
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {motoboys.map((m) => (
            <MotoboyRow
              key={m.id}
              motoboy={m}
              onEdit={startEdit}
              onDelete={handleDelete}
              disabled={isProcessing}
            />
          ))}
        </div>
      )}
    </div>
  );
}
