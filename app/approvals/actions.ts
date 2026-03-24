"use server";

import { supabaseAdmin } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";

export async function approveTask(taskId: string, feedback?: string) {
  await supabaseAdmin
    .from("tasks")
    .update({
      approval_status: "approved",
      feedback: feedback || null,
      status: "done",
      completed_at: new Date().toISOString(),
    })
    .eq("id", taskId);

  revalidatePath("/approvals");
  revalidatePath("/");
  revalidatePath("/tasks");
}

export async function adjustTask(
  taskId: string,
  feedback: string,
  agentId: string,
  taskCode: string
) {
  await supabaseAdmin
    .from("tasks")
    .update({
      approval_status: "adjusted",
      feedback,
      status: "in_progress",
    })
    .eq("id", taskId);

  const message = `[Ajuste solicitado por Yuri — ${taskCode}]: ${feedback}`;
  await supabaseAdmin.from("knowledge").insert({
    code: `DISPATCH-CMD-${Date.now()}`,
    title: "Dispatch para agente",
    content: JSON.stringify({
      agent_id: agentId,
      message,
      task_code: taskCode,
      action: "adjusted",
    }),
    category: "processo",
    importance: "alto",
  });

  revalidatePath("/approvals");
  revalidatePath("/");
  revalidatePath("/tasks");
}

export async function rejectTask(
  taskId: string,
  feedback: string,
  agentId: string,
  taskCode: string
) {
  await supabaseAdmin
    .from("tasks")
    .update({
      approval_status: "rejected",
      feedback,
      status: "blocked",
    })
    .eq("id", taskId);

  const message = `[Reprovado por Yuri — ${taskCode}]: ${feedback}`;
  await supabaseAdmin.from("knowledge").insert({
    code: `DISPATCH-CMD-${Date.now()}`,
    title: "Dispatch para agente",
    content: JSON.stringify({
      agent_id: agentId,
      message,
      task_code: taskCode,
      action: "rejected",
    }),
    category: "processo",
    importance: "alto",
  });

  revalidatePath("/approvals");
  revalidatePath("/");
  revalidatePath("/tasks");
}
