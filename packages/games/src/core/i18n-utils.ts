/**
 * 可本地化字串：可為 string 或 `{ locale: string }` 多語 map。
 *
 * 設計取捨：
 * - 之前版本硬編 `{ 'zh-TW': string; en: string }`，加新 locale（`ja` / `zh-CN`...）
 *   會讓所有 consumer 的 prize 物件型別炸掉。
 * - 現版放寬成 `Partial<Record<string, string>>`：consumer 可擺任意 locale key，
 *   runtime 由 `resolveLocalized()` 依當前 `lang` 尋址，fallback 鏈 `lang → 'en' → 第一個非空值`。
 */
export type LocalizableText = string | Partial<Record<string, string>>;

/**
 * 將可本地化字串依當前語系解析為單一字串。
 * Fallback 順序：`text[lang]` → `text.en` → 任一非空值 → `''`。
 * 已是 string 時直接回傳。
 */
export function resolveLocalized(text: LocalizableText, lang: string): string {
  if (typeof text === 'string') return text;
  const direct = text[lang];
  if (direct !== undefined) return direct;
  if (text.en !== undefined) return text.en;
  for (const v of Object.values(text)) {
    if (v !== undefined) return v;
  }
  return '';
}
