"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireActiveRestaurant, requireMembership } from "@/lib/dal";

/**
 * Menu CRUD. Every action resolves the active restaurant, checks membership,
 * and scopes the write to that restaurantId (multi-tenant isolation) — a user
 * can never mutate another restaurant's menu.
 */
async function scope() {
  const restaurant = await requireActiveRestaurant();
  await requireMembership(restaurant.id);
  return restaurant.id;
}

function refresh() {
  revalidatePath("/menu");
}

// ── Categories ───────────────────────────────────────────────────────────────
const nameSchema = z.string().min(1).max(120).trim();

export async function createCategory(name: string) {
  const restaurantId = await scope();
  const parsed = nameSchema.safeParse(name);
  if (!parsed.success) return { ok: false as const, error: "Enter a category name." };

  const count = await db.menuCategory.count({ where: { restaurantId } });
  await db.menuCategory.create({
    data: { restaurantId, name: parsed.data, sortOrder: count },
  });
  refresh();
  return { ok: true as const };
}

export async function renameCategory(id: string, name: string) {
  const restaurantId = await scope();
  const parsed = nameSchema.safeParse(name);
  if (!parsed.success) return { ok: false as const, error: "Enter a category name." };
  await db.menuCategory.updateMany({
    where: { id, restaurantId },
    data: { name: parsed.data },
  });
  refresh();
  return { ok: true as const };
}

export async function deleteCategory(id: string) {
  const restaurantId = await scope();
  await db.menuCategory.deleteMany({ where: { id, restaurantId } });
  refresh();
  return { ok: true as const };
}

// ── Items ────────────────────────────────────────────────────────────────────
const itemSchema = z.object({
  name: z.string().min(1).max(160).trim(),
  description: z.string().max(600).trim().optional(),
  price: z.coerce.number().min(0).max(100000),
  isSignature: z.boolean().optional(),
  isPopular: z.boolean().optional(),
});

export async function createItem(categoryId: string, input: unknown) {
  const restaurantId = await scope();
  const parsed = itemSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Check the item fields." };

  // Ensure the category belongs to this restaurant.
  const category = await db.menuCategory.findFirst({
    where: { id: categoryId, restaurantId },
    select: { id: true },
  });
  if (!category) return { ok: false as const, error: "Category not found." };

  await db.menuItem.create({
    data: {
      restaurantId,
      categoryId,
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      price: parsed.data.price,
      isSignature: parsed.data.isSignature ?? false,
      isPopular: parsed.data.isPopular ?? false,
    },
  });
  refresh();
  return { ok: true as const };
}

export async function updateItem(id: string, input: unknown) {
  const restaurantId = await scope();
  const parsed = itemSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Check the item fields." };
  await db.menuItem.updateMany({
    where: { id, restaurantId },
    data: {
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      price: parsed.data.price,
      isSignature: parsed.data.isSignature ?? false,
      isPopular: parsed.data.isPopular ?? false,
    },
  });
  refresh();
  return { ok: true as const };
}

export async function toggleItemAvailable(id: string, isAvailable: boolean) {
  const restaurantId = await scope();
  await db.menuItem.updateMany({ where: { id, restaurantId }, data: { isAvailable } });
  refresh();
  return { ok: true as const };
}

export async function deleteItem(id: string) {
  const restaurantId = await scope();
  await db.menuItem.deleteMany({ where: { id, restaurantId } });
  refresh();
  return { ok: true as const };
}

// ── Modifier groups + modifiers ──────────────────────────────────────────────
const groupSchema = z.object({
  name: z.string().min(1).max(120).trim(),
  required: z.boolean().optional(),
  minSelections: z.coerce.number().int().min(0).max(20).optional(),
  maxSelections: z.coerce.number().int().min(1).max(20).optional(),
});

export async function createModifierGroup(menuItemId: string, input: unknown) {
  const restaurantId = await scope();
  const parsed = groupSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Check the group fields." };

  const item = await db.menuItem.findFirst({
    where: { id: menuItemId, restaurantId },
    select: { id: true },
  });
  if (!item) return { ok: false as const, error: "Item not found." };

  await db.modifierGroup.create({
    data: {
      menuItemId,
      name: parsed.data.name,
      required: parsed.data.required ?? false,
      minSelections: parsed.data.minSelections ?? 0,
      maxSelections: parsed.data.maxSelections ?? 1,
    },
  });
  refresh();
  return { ok: true as const };
}

export async function deleteModifierGroup(id: string) {
  const restaurantId = await scope();
  await db.modifierGroup.deleteMany({
    where: { id, menuItem: { restaurantId } },
  });
  refresh();
  return { ok: true as const };
}

const modifierSchema = z.object({
  name: z.string().min(1).max(120).trim(),
  price: z.coerce.number().min(0).max(100000),
});

export async function createModifier(groupId: string, input: unknown) {
  const restaurantId = await scope();
  const parsed = modifierSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Check the modifier fields." };

  const group = await db.modifierGroup.findFirst({
    where: { id: groupId, menuItem: { restaurantId } },
    select: { id: true },
  });
  if (!group) return { ok: false as const, error: "Group not found." };

  await db.modifier.create({
    data: { groupId, name: parsed.data.name, price: parsed.data.price },
  });
  refresh();
  return { ok: true as const };
}

export async function deleteModifier(id: string) {
  const restaurantId = await scope();
  await db.modifier.deleteMany({
    where: { id, group: { menuItem: { restaurantId } } },
  });
  refresh();
  return { ok: true as const };
}
