import { requireUser, getActiveRestaurant } from "@/lib/dal";
import { db } from "@/lib/db";
import { TasksClient, type TaskT } from "./TasksClient";

export default async function TasksPage() {
  await requireUser();
  const restaurant = await getActiveRestaurant();

  if (!restaurant) {
    return (
      <div className="card-base p-8 max-w-lg">
        <h1 className="font-display text-2xl font-bold mb-2" style={{ color: "var(--navy)" }}>
          No restaurant connected
        </h1>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Your shared workspace appears once your account is linked to a restaurant.
        </p>
      </div>
    );
  }

  const tasks = await db.task.findMany({
    where: { restaurantId: restaurant.id },
    orderBy: [{ status: "asc" }, { createdAt: "asc" }],
  });

  const list: TaskT[] = tasks.map((t) => ({
    id: t.id,
    title: t.title,
    description: t.description,
    owner: t.owner,
    type: t.type,
    status: t.status,
    dueDate: t.dueDate ? t.dueDate.toISOString() : null,
  }));

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.14em] mb-1" style={{ color: "var(--accent)" }}>
          Tasks
        </p>
        <h1 className="font-display text-3xl font-bold" style={{ color: "var(--navy)" }}>
          Your UPREVI workspace
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          What your growth team is working on, what needs your sign-off, and your sprint milestones.
        </p>
      </div>
      {list.length === 0 ? (
        <p className="text-sm" style={{ color: "var(--text-dim)" }}>No tasks yet.</p>
      ) : (
        <TasksClient tasks={list} />
      )}
    </div>
  );
}
