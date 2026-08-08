import type { Metadata } from "next";
import { PartnersDashboard } from "@/components/partners/PartnersDashboard";

export const metadata: Metadata = {
  title: "Партнёрская программа — ChinaBridge",
};

export default function PartnersSettingsPage() {
  return <PartnersDashboard />;
}
