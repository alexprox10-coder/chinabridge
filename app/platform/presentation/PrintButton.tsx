"use client";

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="px-4 py-1.5 bg-green-600 text-white text-xs font-semibold rounded-lg"
    >
      🖨️ Скачать PDF
    </button>
  );
}
