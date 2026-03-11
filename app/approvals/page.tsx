import { supabase, Task } from "@/lib/supabase";
import ApprovalCard from "@/components/ApprovalCard";

async function getPendingApprovals(): Promise<Task[]> {
  const { data } = await supabase
    .from("tasks")
    .select("*, agents(id, name, role, model)")
    .eq("approval_status", "pending")
    .order("priority", { ascending: true })
    .order("updated_at", { ascending: false });

  return (data ?? []) as Task[];
}

export const revalidate = 30;

export default async function ApprovalsPage() {
  const tasks = await getPendingApprovals();

  return (
    <div className="max-w-3xl mx-auto pb-20 md:pb-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-[#F5F5F5]">Central de Aprovações</h1>
          {tasks.length > 0 && (
            <span className="bg-red-500 text-white text-sm font-bold px-2.5 py-0.5 rounded-full">
              {tasks.length}
            </span>
          )}
        </div>
        <p className="text-[#F5F5F5]/40 text-sm mt-1">
          {tasks.length === 0
            ? "Nada aguardando sua aprovação."
            : `${tasks.length} ${tasks.length === 1 ? "item aguarda" : "itens aguardam"} sua decisão.`}
        </p>
      </div>

      {/* Items */}
      {tasks.length > 0 ? (
        <div className="space-y-6">
          {tasks.map((task) => (
            <ApprovalCard key={task.id} task={task} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="text-5xl">✓</div>
          <p className="text-[#F5F5F5]/30 text-sm text-center">
            Todos os itens foram revisados.
            <br />Nada pendente por aqui.
          </p>
        </div>
      )}
    </div>
  );
}
