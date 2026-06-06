"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Trash2,
  Pencil,
  ChevronDown,
  ChevronRight,
  Check,
  X,
  Star,
  Flame,
} from "lucide-react";
import {
  createCategory,
  renameCategory,
  deleteCategory,
  createItem,
  updateItem,
  deleteItem,
  toggleItemAvailable,
  createModifierGroup,
  deleteModifierGroup,
  createModifier,
  deleteModifier,
} from "./actions";

export interface MMModifier { id: string; name: string; price: number }
export interface MMGroup {
  id: string;
  name: string;
  required: boolean;
  minSelections: number;
  maxSelections: number;
  modifiers: MMModifier[];
}
export interface MMItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  isAvailable: boolean;
  isSignature: boolean;
  isPopular: boolean;
  modifierGroups: MMGroup[];
}
export interface MMCategory { id: string; name: string; items: MMItem[] }

export function MenuManager({ categories }: { categories: MMCategory[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [newCategory, setNewCategory] = useState("");

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>) =>
    startTransition(async () => {
      const res = await fn();
      if (!res.ok && res.error) alert(res.error);
      router.refresh();
    });

  return (
    <div className="flex flex-col gap-6">
      {/* Add category */}
      <div className="card-base p-4 flex gap-2">
        <input
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          placeholder="New category (e.g. Pasta)"
          className="input-base px-3 py-2 text-sm"
        />
        <button
          type="button"
          disabled={pending || !newCategory.trim()}
          onClick={() =>
            run(async () => {
              const res = await createCategory(newCategory);
              if (res.ok) setNewCategory("");
              return res;
            })
          }
          className="btn-accent px-4 py-2 text-sm shrink-0 disabled:opacity-60"
        >
          <Plus size={15} /> Category
        </button>
      </div>

      {categories.length === 0 && (
        <p className="text-sm" style={{ color: "var(--text-dim)" }}>
          No categories yet. Add one to start building your menu.
        </p>
      )}

      {categories.map((cat) => (
        <CategoryBlock key={cat.id} category={cat} pending={pending} run={run} />
      ))}
    </div>
  );
}

function CategoryBlock({
  category,
  pending,
  run,
}: {
  category: MMCategory;
  pending: boolean;
  run: (fn: () => Promise<{ ok: boolean; error?: string }>) => void;
}) {
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(category.name);
  const [adding, setAdding] = useState(false);

  return (
    <div className="card-base p-5">
      <div className="flex items-center justify-between gap-3 mb-4">
        {renaming ? (
          <div className="flex items-center gap-2 flex-1">
            <input value={name} onChange={(e) => setName(e.target.value)} className="input-base px-2 py-1.5 text-sm" />
            <button type="button" disabled={pending} onClick={() => run(async () => { const r = await renameCategory(category.id, name); if (r.ok) setRenaming(false); return r; })} className="p-1.5 rounded-md" style={{ color: "var(--green)" }}><Check size={16} /></button>
            <button type="button" onClick={() => { setRenaming(false); setName(category.name); }} className="p-1.5 rounded-md" style={{ color: "var(--text-dim)" }}><X size={16} /></button>
          </div>
        ) : (
          <h2 className="font-display text-lg font-bold" style={{ color: "var(--navy)" }}>{category.name}</h2>
        )}
        {!renaming && (
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => setRenaming(true)} className="p-1.5 rounded-md" style={{ color: "var(--text-muted)" }}><Pencil size={15} /></button>
            <button type="button" disabled={pending} onClick={() => { if (confirm(`Delete "${category.name}" and its items?`)) run(() => deleteCategory(category.id)); }} className="p-1.5 rounded-md" style={{ color: "var(--red)" }}><Trash2 size={15} /></button>
          </div>
        )}
      </div>

      <div className="flex flex-col divide-y" style={{ borderColor: "var(--border)" }}>
        {category.items.map((item) => (
          <ItemRow key={item.id} item={item} pending={pending} run={run} />
        ))}
      </div>

      {adding ? (
        <ItemForm
          pending={pending}
          onCancel={() => setAdding(false)}
          onSubmit={async (values) => {
            const r = await createItem(category.id, values);
            return r;
          }}
          onDone={() => setAdding(false)}
          run={run}
        />
      ) : (
        <button type="button" onClick={() => setAdding(true)} className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium" style={{ color: "var(--accent)" }}>
          <Plus size={15} /> Add item
        </button>
      )}
    </div>
  );
}

function ItemRow({
  item,
  pending,
  run,
}: {
  item: MMItem;
  pending: boolean;
  run: (fn: () => Promise<{ ok: boolean; error?: string }>) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [showMods, setShowMods] = useState(false);

  if (editing) {
    return (
      <div className="py-3">
        <ItemForm
          initial={item}
          pending={pending}
          onCancel={() => setEditing(false)}
          onSubmit={(values) => updateItem(item.id, values)}
          onDone={() => setEditing(false)}
          run={run}
        />
      </div>
    );
  }

  return (
    <div className="py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium" style={{ color: item.isAvailable ? "var(--navy)" : "var(--text-dim)" }}>{item.name}</p>
            {item.isSignature && <Star size={12} fill="var(--gold)" stroke="none" />}
            {item.isPopular && <Flame size={12} style={{ color: "var(--accent)" }} />}
            {!item.isAvailable && <span className="text-xs" style={{ color: "var(--text-dim)" }}>(unavailable)</span>}
          </div>
          {item.description && <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{item.description}</p>}
          <button type="button" onClick={() => setShowMods((v) => !v)} className="mt-1.5 inline-flex items-center gap-1 text-xs" style={{ color: "var(--text-dim)" }}>
            {showMods ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
            {item.modifierGroups.length} modifier group{item.modifierGroups.length === 1 ? "" : "s"}
          </button>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="font-mono-price text-sm" style={{ color: "var(--navy)" }}>${item.price.toFixed(2)}</span>
          <label className="text-xs flex items-center gap-1 cursor-pointer" style={{ color: "var(--text-muted)" }}>
            <input type="checkbox" checked={item.isAvailable} disabled={pending} onChange={(e) => run(() => toggleItemAvailable(item.id, e.target.checked))} className="w-3.5 h-3.5 accent-[var(--navy)]" />
          </label>
          <button type="button" onClick={() => setEditing(true)} className="p-1.5 rounded-md" style={{ color: "var(--text-muted)" }}><Pencil size={14} /></button>
          <button type="button" disabled={pending} onClick={() => { if (confirm(`Delete "${item.name}"?`)) run(() => deleteItem(item.id)); }} className="p-1.5 rounded-md" style={{ color: "var(--red)" }}><Trash2 size={14} /></button>
        </div>
      </div>

      {showMods && <ModifiersPanel item={item} pending={pending} run={run} />}
    </div>
  );
}

function ItemForm({
  initial,
  pending,
  onCancel,
  onSubmit,
  onDone,
  run,
}: {
  initial?: MMItem;
  pending: boolean;
  onCancel: () => void;
  onSubmit: (values: { name: string; description?: string; price: number; isSignature: boolean; isPopular: boolean }) => Promise<{ ok: boolean; error?: string }>;
  onDone: () => void;
  run: (fn: () => Promise<{ ok: boolean; error?: string }>) => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [price, setPrice] = useState(initial?.price?.toString() ?? "");
  const [isSignature, setIsSignature] = useState(initial?.isSignature ?? false);
  const [isPopular, setIsPopular] = useState(initial?.isPopular ?? false);

  return (
    <div className="rounded-lg p-4 mt-3 flex flex-col gap-3" style={{ background: "var(--cream)", border: "1px solid var(--border)" }}>
      <div className="grid sm:grid-cols-[1fr_120px] gap-3">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Item name" className="input-base px-3 py-2 text-sm" />
        <input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0.00" type="number" step="0.01" min="0" className="input-base px-3 py-2 text-sm font-mono-price" />
      </div>
      <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description (optional)" rows={2} className="input-base px-3 py-2 text-sm resize-none" />
      <div className="flex items-center gap-4">
        <label className="text-sm flex items-center gap-1.5 cursor-pointer" style={{ color: "var(--text)" }}>
          <input type="checkbox" checked={isSignature} onChange={(e) => setIsSignature(e.target.checked)} className="w-4 h-4 accent-[var(--gold)]" /> Signature
        </label>
        <label className="text-sm flex items-center gap-1.5 cursor-pointer" style={{ color: "var(--text)" }}>
          <input type="checkbox" checked={isPopular} onChange={(e) => setIsPopular(e.target.checked)} className="w-4 h-4 accent-[var(--accent)]" /> Popular
        </label>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={pending || !name.trim() || price === ""}
          onClick={() =>
            run(async () => {
              const r = await onSubmit({ name, description: description || undefined, price: Number(price), isSignature, isPopular });
              if (r.ok) onDone();
              return r;
            })
          }
          className="btn-accent px-4 py-2 text-sm disabled:opacity-60"
        >
          {initial ? "Save" : "Add item"}
        </button>
        <button type="button" onClick={onCancel} className="btn-ghost px-4 py-2 text-sm">Cancel</button>
      </div>
    </div>
  );
}

function ModifiersPanel({
  item,
  pending,
  run,
}: {
  item: MMItem;
  pending: boolean;
  run: (fn: () => Promise<{ ok: boolean; error?: string }>) => void;
}) {
  const [addingGroup, setAddingGroup] = useState(false);
  const [gName, setGName] = useState("");
  const [gRequired, setGRequired] = useState(false);
  const [gMin, setGMin] = useState("0");
  const [gMax, setGMax] = useState("1");

  return (
    <div className="mt-3 ml-1 pl-4 flex flex-col gap-3" style={{ borderLeft: "2px solid var(--border)" }}>
      {item.modifierGroups.map((g) => (
        <div key={g.id}>
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium" style={{ color: "var(--text)" }}>
              {g.name}{" "}
              <span className="text-xs font-normal" style={{ color: "var(--text-dim)" }}>
                ({g.required ? "required" : "optional"}, {g.minSelections}-{g.maxSelections})
              </span>
            </p>
            <button type="button" disabled={pending} onClick={() => run(() => deleteModifierGroup(g.id))} className="p-1 rounded" style={{ color: "var(--red)" }}><Trash2 size={13} /></button>
          </div>
          <div className="mt-1 flex flex-col gap-1">
            {g.modifiers.map((m) => (
              <div key={m.id} className="flex items-center justify-between text-xs" style={{ color: "var(--text-muted)" }}>
                <span>{m.name} {m.price > 0 && <span className="font-mono-price">+${m.price.toFixed(2)}</span>}</span>
                <button type="button" disabled={pending} onClick={() => run(() => deleteModifier(m.id))} className="p-1 rounded" style={{ color: "var(--red)" }}><X size={12} /></button>
              </div>
            ))}
            <AddModifier groupId={g.id} pending={pending} run={run} />
          </div>
        </div>
      ))}

      {addingGroup ? (
        <div className="rounded-lg p-3 flex flex-col gap-2" style={{ background: "var(--cream)", border: "1px solid var(--border)" }}>
          <input value={gName} onChange={(e) => setGName(e.target.value)} placeholder="Group name (e.g. Size)" className="input-base px-2 py-1.5 text-sm" />
          <div className="flex items-center gap-3 text-xs" style={{ color: "var(--text)" }}>
            <label className="flex items-center gap-1.5 cursor-pointer"><input type="checkbox" checked={gRequired} onChange={(e) => setGRequired(e.target.checked)} className="w-3.5 h-3.5 accent-[var(--navy)]" /> Required</label>
            <span>min <input value={gMin} onChange={(e) => setGMin(e.target.value)} type="number" min="0" className="input-base w-14 px-1.5 py-1 text-xs inline-block" /></span>
            <span>max <input value={gMax} onChange={(e) => setGMax(e.target.value)} type="number" min="1" className="input-base w-14 px-1.5 py-1 text-xs inline-block" /></span>
          </div>
          <div className="flex gap-2">
            <button type="button" disabled={pending || !gName.trim()} onClick={() => run(async () => { const r = await createModifierGroup(item.id, { name: gName, required: gRequired, minSelections: Number(gMin), maxSelections: Number(gMax) }); if (r.ok) { setAddingGroup(false); setGName(""); } return r; })} className="btn-accent px-3 py-1.5 text-xs disabled:opacity-60">Add group</button>
            <button type="button" onClick={() => setAddingGroup(false)} className="btn-ghost px-3 py-1.5 text-xs">Cancel</button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => setAddingGroup(true)} className="inline-flex items-center gap-1 text-xs self-start" style={{ color: "var(--accent)" }}><Plus size={12} /> Add modifier group</button>
      )}
    </div>
  );
}

function AddModifier({
  groupId,
  pending,
  run,
}: {
  groupId: string;
  pending: boolean;
  run: (fn: () => Promise<{ ok: boolean; error?: string }>) => void;
}) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  return (
    <div className="flex items-center gap-2 mt-1">
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Add option" className="input-base px-2 py-1 text-xs flex-1" />
      <input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="+$" type="number" step="0.01" min="0" className="input-base w-16 px-2 py-1 text-xs font-mono-price" />
      <button type="button" disabled={pending || !name.trim()} onClick={() => run(async () => { const r = await createModifier(groupId, { name, price: Number(price || 0) }); if (r.ok) { setName(""); setPrice(""); } return r; })} className="p-1.5 rounded-md disabled:opacity-60" style={{ color: "var(--green)" }}><Plus size={13} /></button>
    </div>
  );
}
