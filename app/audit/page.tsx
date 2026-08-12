import type { Metadata } from "next";
import AuditClient from "./AuditClient";

export const metadata: Metadata = {
  title: "AI Business Audit — ChinaBridge | Бесплатный анализ импорта",
  description:
    "Введите сайт вашей компании — AI за 60 секунд найдёт потенциал снижения себестоимости, прямые категории из Китая и SEO-возможности.",
};

export default function AuditPage() {
  return <AuditClient />;
}
