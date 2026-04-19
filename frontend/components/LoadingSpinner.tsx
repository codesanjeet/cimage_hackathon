"use client";
// components/LoadingSpinner.tsx

export default function LoadingSpinner({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizeMap = { sm: "w-4 h-4 border-2", md: "w-7 h-7 border-2", lg: "w-12 h-12 border-[3px]" };
  return (
    <span
      className={`inline-block rounded-full border-indigo-500 border-t-transparent animate-spin ${sizeMap[size]}`}
      role="status"
      aria-label="Loading"
    />
  );
}