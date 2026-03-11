interface MetricCardProps {
  label: string;
  value: string | number;
  icon?: string;
  highlight?: boolean;
}

export default function MetricCard({ label, value, icon, highlight }: MetricCardProps) {
  return (
    <div className={`bg-[#141414] border rounded-xl p-4 transition-all duration-200 ${
      highlight
        ? "border-[#D4AF37]/30 bg-[#D4AF37]/5"
        : "border-[#D4AF37]/15 hover:border-[#D4AF37]/25"
    }`}>
      <div className="flex items-center justify-between mb-1">
        {icon && <span className="text-xl">{icon}</span>}
      </div>
      <p className={`text-2xl font-bold ${highlight ? "text-[#D4AF37]" : "text-[#F5F5F5]"}`}>
        {value}
      </p>
      <p className="text-[#F5F5F5]/40 text-xs mt-1">{label}</p>
    </div>
  );
}
