"use client";

import { createContext, useContext, useMemo, useState } from "react";
import en from "../locales/en.json";
import hi from "../locales/hi.json";

const dictionaries = { en, hi };
const LanguageContext = createContext(null);

function readKey(dictionary, key) {
  return key.split(".").reduce((value, part) => value?.[part], dictionary) ?? key;
}

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    if (typeof window === "undefined") return "en";
    return localStorage.getItem("agrismart-language") || "en";
  });
  const setLanguage = (next) => {
    localStorage.setItem("agrismart-language", next);
    setLanguageState(next);
  };
  const value = useMemo(() => ({ language, setLanguage, t: (key) => readKey(dictionaries[language], key) }), [language]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export const useLanguage = () => useContext(LanguageContext);
