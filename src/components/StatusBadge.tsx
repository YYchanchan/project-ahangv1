import React from "react";

export interface StatusBadgeProps {
  status: string;
  label?: string;
  className?: string;
}

export function StatusBadge({ status, label, className = "" }: StatusBadgeProps) {
  let colorClasses = "";
  switch (status) {
    case "in_zoo":
      colorClasses = "bg-[#2F5233]/10 text-[#2F5233] border-[#2F5233]/20";
      break;
    case "retired":
      colorClasses = "bg-amber-100 text-amber-800 border-amber-200";
      break;
    case "transferred":
      colorClasses = "bg-blue-50 text-[#5A6B7C] border-blue-100";
      break;
    case "deceased":
      colorClasses = "bg-stone-100 text-stone-600 border-stone-200";
      break;
    case "on_trip":
      colorClasses = "bg-purple-50 text-purple-700 border-purple-100";
      break;
    case "need_info":
      colorClasses = "bg-red-50 text-[#B83B26] border-red-100 animate-pulse";
      break;
    default:
      colorClasses = "bg-stone-50 text-stone-500 border-stone-100";
  }

  const defaultLabels: Record<string, string> = {
    in_zoo: "在园",
    retired: "退休",
    transferred: "出差/出借",
    deceased: "离世",
    on_trip: "出差",
    need_info: "资料待补充",
  };
  const displayedLabel = label || defaultLabels[status] || status;

  return (
    <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full border ${colorClasses} ${className}`}>
      {displayedLabel}
    </span>
  );
}
