import { DISPLAY_STATUS_LABELS } from "@/lib/contract";

export default function StatusBadge({ status }: { status: string }) {
  const info = DISPLAY_STATUS_LABELS[status] ?? { label: status, color: "bg-gray-100 text-gray-700" };
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${info.color}`}>
      {info.label}
    </span>
  );
}
