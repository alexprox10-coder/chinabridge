"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Props {
  href: string;
  label?: string;
}

export function BackLink({ href, label = "Назад" }: Props) {
  const router = useRouter();

  return (
    <button
      onClick={() => router.back()}
      className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors text-sm mb-4 group"
    >
      <span className="group-hover:-translate-x-0.5 transition-transform">←</span>
      <span>{label}</span>
    </button>
  );
}

export function BackLinkStatic({ href, label = "Назад" }: Props) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors text-sm mb-4 group"
    >
      <span className="group-hover:-translate-x-0.5 transition-transform">←</span>
      <span>{label}</span>
    </Link>
  );
}
