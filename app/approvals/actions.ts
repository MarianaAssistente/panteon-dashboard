"use server";

import { supabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

export async function approveTask(taskId: string, feedback?: string) {
  await supabase
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

export async function adjustTask(taskId: string, feedback: string) {
  await supabase
    .from("tasks")
    .update({
      approval_status: "adjusted",
      feedback,
      status: "in_progress",
    })
    .eq("id", taskId);

  revalidatePath("/approvals");
  revalidatePath("/");
  revalidatePath("/tasks");
}

export async function rejectTask(taskId: string, feedback: string) {
  await supabase
    .from("tasks")
    .update({
      approval_status: "rejected",
      feedback,
      status: "blocked",
    })
    .eq("id", taskId);

  revalidatePath("/approvals");
  revalidatePath("/");
  revalidatePath("/tasks");
}
