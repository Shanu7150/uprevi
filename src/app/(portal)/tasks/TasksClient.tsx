"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Circle, Flag, Clock, Plus, Trash2, ChevronRight } from "lucide-react";
import { createTask, setTaskStatus, deleteTask } from "./actions";

export interface TaskT {
  id: string;
  title: string;
  description: string | null;
  owner: "UPREVI" | "CLIENT";
  type: "TODO" | "APPROVAL" | "MILESTONE";
  status: "OPEN" | "IN_PROGRESS" | "AWAITING_CLIENT" | "DONE";
  dueDate: string | null;
}

export function TasksClient({ tasks }: { tasks: TaskT[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [adding, setAdding] = useState(false);

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>) =>
    startTransition(async () => {
      const r = await fn();
      if (!r.ok && r.error) alert(r.error);
      router.refresh();
    });

  const needsYou = tasks.filter((t) => t.status === "AWAITING_CLIENT" || (t.type === "APPROVAL" && t.status !== "DONE"));
  const active = tasks.filter((t) => t.type !== "MILESTONE" && t.status !== "DONE" && !needsYou.includes(t));
  const milestones = tasks.filter((t) => t.type === "MILESTONE");
  const done = tasks.filter((t) => t.status === "DONE" && t.type !== "MILESTONE");

  return (
    <div className="flex flex-col gap-8">
      {needsYou.length > 0 && (
        <Section title="Needs your approval" accent>
          {needsYou.map((t) => (
            <TaskRow key={t.id} task={t} pending={pending} run={run}
              primary={{ label: "Approve", onClick: () => run(() => setTaskStatus(t.id, "DONE")) }} />
          ))}
        </Section>
      )}

      <Section title="In progress" action={
        <button type="button" onClick={() => setAdding((v) => !v)} className="inline-flex items-center gap-1 text-sm" style={{ color: "var(--accent)" }}>
          <Plus size={14} /> Add task
        </button>
      }>
        {adding && <AddTask pending={pending} run={run} onDone={() => setAdding(false)} />}
        {active.length === 0 && !adding && <Empty>Nothing in progress.</Empty>}
        {active.map((t) => (
          <TaskRow key={t.id} task={t} pending={pending} run={run}
            primary={t.status === "OPEN"
              ? { label: "Start", onClick: () => run(() => setTaskStatus(t.id, "IN_PROGRESS")) }
              : { label: "Complete", onClick: () => run(() => setTaskStatus(t.id, "DONE")) }} />
        ))}
      </Section>

      {milestones.length > 0 && (
        <Section title="Sprint milestones">
          <div className="flex flex-col">
            {milestones.map((t, i) => (
              <div key={t.id} className="flex gap-3 pb-5 relative">
                {i < milestones.length - 1 && <div className="absolute left-[11px] top-6 bottom-0 w-px" style={{ background: "var(--border)" }} />}
                <span className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 z-10" style={{ background: t.status === "DONE" ? "var(--navy)" : "var(--cream)", border: `1.5px solid ${t.status === "DONE" ? "var(--navy)" : "var(--border)"}`, color: t.status === "DONE" ? "#fff" : "var(--text-dim)" }}>
                  <Flag size={12} />
                </span>
                <div>
                  <p className="text-sm font-medium" style={{ color: "var(--navy)" }}>{t.title}</p>
                  {t.description && <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{t.description}</p>}
                  {t.dueDate && <p className="text-xs mt-0.5" style={{ color: "var(--text-dim)" }}>{new Date(t.dueDate).toLocaleDateString()}</p>}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {done.length > 0 && (
        <Section title="Done">
          {done.map((t) => (
            <TaskRow key={t.id} task={t} pending={pending} run={run} muted />
          ))}
        </Section>
      )}
    </div>
  );
}

function Section({ title, children, accent, action }: { title: string; children: React.ReactNode; accent?: boolean; action?: React.ReactNode }) {
  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display text-lg font-bold" style={{ color: accent ? "var(--accent)" : "var(--navy)" }}>{title}</h2>
        {action}
      </div>
      <div className="flex flex-col gap-2">{children}</div>
    </section>
  );
}

function TaskRow({ task, pending, run, primary, muted }: {
  task: TaskT; pending: boolean;
  run: (fn: () => Promise<{ ok: boolean; error?: string }>) => void;
  primary?: { label: string; onClick: () => void };
  muted?: boolean;
}) {
  const Icon = task.status === "DONE" ? CheckCircle2 : task.type === "APPROVAL" ? ChevronRight : Circle;
  return (
    <div className="card-base p-4 flex items-start justify-between gap-3">
      <div className="flex items-start gap-3 min-w-0">
        <Icon size={18} className="mt-0.5 shrink-0" style={{ color: task.status === "DONE" ? "var(--green)" : "var(--text-dim)" }} />
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-medium" style={{ color: muted ? "var(--text-dim)" : "var(--navy)", textDecoration: muted ? "line-through" : "none" }}>{task.title}</p>
            <span className="badge" style={{ background: task.owner === "UPREVI" ? "var(--accent-dim)" : "var(--cream)", color: task.owner === "UPREVI" ? "var(--accent)" : "var(--text-muted)" }}>
              {task.owner === "UPREVI" ? "UPREVI team" : "You"}
            </span>
          </div>
          {task.description && <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{task.description}</p>}
          {task.dueDate && <p className="text-xs mt-0.5 flex items-center gap-1" style={{ color: "var(--text-dim)" }}><Clock size={11} />{new Date(task.dueDate).toLocaleDateString()}</p>}
        </div>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        {primary && <button type="button" disabled={pending} onClick={primary.onClick} className="btn-accent px-3 py-1.5 text-xs disabled:opacity-60">{primary.label}</button>}
        <button type="button" disabled={pending} onClick={() => { if (confirm("Delete task?")) run(() => deleteTask(task.id)); }} className="p-1.5 rounded-md" style={{ color: "var(--text-dim)" }}><Trash2 size={14} /></button>
      </div>
    </div>
  );
}

function AddTask({ pending, run, onDone }: {
  pending: boolean;
  run: (fn: () => Promise<{ ok: boolean; error?: string }>) => void;
  onDone: () => void;
}) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<"TODO" | "APPROVAL" | "MILESTONE">("TODO");
  return (
    <div className="card-base p-4 flex flex-col gap-3">
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Task title" className="input-base px-3 py-2 text-sm" />
      <div className="flex items-center gap-2">
        <select value={type} onChange={(e) => setType(e.target.value as typeof type)} className="input-base px-2 py-2 text-sm w-auto">
          <option value="TODO">To-do</option>
          <option value="APPROVAL">Approval</option>
          <option value="MILESTONE">Milestone</option>
        </select>
        <button type="button" disabled={pending || !title.trim()} onClick={() => run(async () => { const r = await createTask({ title, type }); if (r.ok) { onDone(); } return r; })} className="btn-accent px-4 py-2 text-sm disabled:opacity-60">Add</button>
        <button type="button" onClick={onDone} className="btn-ghost px-4 py-2 text-sm">Cancel</button>
      </div>
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-sm" style={{ color: "var(--text-dim)" }}>{children}</p>;
}
