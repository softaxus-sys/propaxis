import { cookies } from "next/headers";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, type Locale } from "./config";
import { en } from "./dictionaries/en";
import { ar } from "./dictionaries/ar";
import type { Dictionary } from "./dictionaries/types";

const DICTIONARIES: Record<Locale, Dictionary> = { en, ar };

export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const value = store.get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

export async function getDictionary(): Promise<Dictionary> {
  const locale = await getLocale();
  return DICTIONARIES[locale];
}
