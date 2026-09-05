"use client";

import { createContext, useContext } from "react";

export type Theme = "light" | "dark";

export interface ThemeValue {
  theme: Theme;
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeValue>({
  theme: "light",
  toggleTheme: () => {},
});

/** Read the theme + toggle from the nearest dashboard/admin shell. */
export const useTheme = () => useContext(ThemeContext);

/** Synchronously read the stored theme (safe on the server). */
export function readStoredTheme(storageKey: string): Theme {
  if (typeof window === "undefined") return "light";
  try {
    return localStorage.getItem(storageKey) === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}
