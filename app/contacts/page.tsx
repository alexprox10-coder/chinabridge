import Header from "@/components/Header";
import Calculator from "@/components/Calculator";
import Footer from "@/components/Footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Контакты — ChinaBridge | Напишите нам",
  description: "Свяжитесь с ChinaBridge — ответим в течение 15 минут. Telegram, WhatsApp, Email.",
};

export default function ContactsPage() {
  return (
    <main>
      <Header />
      <div className="pt-20">
        <Calculator />
      </div>
      <Footer />
    </main>
  );
}
