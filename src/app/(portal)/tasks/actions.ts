"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireActiveRestaurant, requireMembership } from "@/lib/dal";
import type { TaskStatus } from "@/generated/prisma/enums";

async function scope() {
  const restaurant = await requireActiveRestaurant();
  await requireMembership(restaurant.id);
  return restaurant.id;
}

const createSchema = z.object({
  title: z.string().min(1).max(200).trim(),
  description: z.string().max(1000).trim().optional(),
  type: z.enum(["TODO", "APPROVAL", "MILESTONE"]),
  dueDate: z.string().trim().optional(),
});

export async function createTask(input: unknown) {
  const restaurantId = await scope();
  const parsed = createSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Check the task fields." };

  await db.task.create({
    data: {
      restaurantId,
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      type: parsed.data.type,
      owner: "CLIENT", // portal-created tasks belong to the client
      status: parsed.data.type === "APPROVAL" ? "AWAITING_CLIENT" : "OPEN",
      dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
    },
  });
  revalidatePath("/tasks");
  return { ok: true as const };
}

export async function setTaskStatus(id: string, status: TaskStatus) {
  const restaurantId = await scope();
  await db.task.updateMany({ where: { id, restaurantId }, data: { status } });
  revalidatePath("/tasks");
  return { ok: true as const };
}

export async function deleteTask(id: string) {
  const restaurantId = await scope();
  await db.task.deleteMany({ where: { id, restaurantId } });
  revalidatePath("/tasks");
  return { ok: true as const };
}
