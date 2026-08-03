"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import { ru, zh } from "./translations";
import type { Lang } from "./types";

type Dict = typeof ru;
type TFunc = (key: keyof Dict) => string;

interface I18nCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: TFunc;
}

const I18nContext = createContext<I18nCtx>({
  lang: "ru",
  setLang: () => {},
  t: (k) => String(k),
});

export function I18nProvider({
  children,
  initialLang,
}: {
  children: React.ReactNode;
  initialLang: Lang;
}) {
  const [lang, setLangState] = useState<Lang>(initialLang);

  useEffect(() => {
    // On client, check localStorage for user preference
    const saved = localStorage.getItem("cb_partner_lang") as Lang | null;
    if (saved === "ru" || saved === "zh") setLangState(saved);
    else {
      // Detect browser language
      const nav = navigator.language.toLowerCase();
      if (nav.startsWith("zh")) setLangState("zh");
    }
  }, []);

  function setLang(l: Lang) {
    setLangState(l);
    localStorage.setItem("cb_partner_lang", l);
    document.cookie = `cb_partner_lang=${l}; path=/; max-age=${60 * 60 * 24 * 365}`;
  }

  const dict: Dict = lang === "zh" ? zh : ru;
  const t: TFunc = (key) => dict[key] ?? String(key);

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export const useI18n = () => useContext(I18nContext);
