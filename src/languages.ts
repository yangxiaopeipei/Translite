/** DeepL 语言代码 ↔ 展示名。目标语言与源语言代码集合不同，这里分开维护。 */

export interface LanguageOption {
  code: string;
  name: string;
  flag: string;
}

export const TARGET_LANGUAGES: LanguageOption[] = [
  { code: "ZH-HANS", name: "简体中文", flag: "🇨🇳" },
  { code: "EN-US", name: "英语（美国）", flag: "🇺🇸" },
  { code: "EN-GB", name: "英语（英国）", flag: "🇬🇧" },
  { code: "JA", name: "日语", flag: "🇯🇵" },
  { code: "KO", name: "韩语", flag: "🇰🇷" },
  { code: "DE", name: "德语", flag: "🇩🇪" },
  { code: "FR", name: "法语", flag: "🇫🇷" },
  { code: "ES", name: "西班牙语", flag: "🇪🇸" },
  { code: "RU", name: "俄语", flag: "🇷🇺" },
  { code: "IT", name: "意大利语", flag: "🇮🇹" },
  { code: "PT-BR", name: "葡萄牙语（巴西）", flag: "🇧🇷" },
  { code: "PT-PT", name: "葡萄牙语（欧洲）", flag: "🇵🇹" },
  { code: "NL", name: "荷兰语", flag: "🇳🇱" },
  { code: "PL", name: "波兰语", flag: "🇵🇱" },
  { code: "TR", name: "土耳其语", flag: "🇹🇷" },
  { code: "ID", name: "印尼语", flag: "🇮🇩" },
  { code: "UK", name: "乌克兰语", flag: "🇺🇦" },
  { code: "AR", name: "阿拉伯语", flag: "🇸🇦" },
];

export const SOURCE_LANGUAGES: LanguageOption[] = [
  { code: "", name: "自动检测", flag: "🌐" },
  { code: "ZH", name: "中文", flag: "🇨🇳" },
  { code: "EN", name: "英语", flag: "🇬🇧" },
  { code: "JA", name: "日语", flag: "🇯🇵" },
  { code: "KO", name: "韩语", flag: "🇰🇷" },
  { code: "DE", name: "德语", flag: "🇩🇪" },
  { code: "FR", name: "法语", flag: "🇫🇷" },
  { code: "ES", name: "西班牙语", flag: "🇪🇸" },
  { code: "RU", name: "俄语", flag: "🇷🇺" },
  { code: "IT", name: "意大利语", flag: "🇮🇹" },
  { code: "PT", name: "葡萄牙语", flag: "🇵🇹" },
  { code: "NL", name: "荷兰语", flag: "🇳🇱" },
  { code: "PL", name: "波兰语", flag: "🇵🇱" },
  { code: "TR", name: "土耳其语", flag: "🇹🇷" },
  { code: "ID", name: "印尼语", flag: "🇮🇩" },
  { code: "UK", name: "乌克兰语", flag: "🇺🇦" },
  { code: "AR", name: "阿拉伯语", flag: "🇸🇦" },
];

const TARGET_MAP = new Map(TARGET_LANGUAGES.map((l) => [l.code, l]));
const SOURCE_MAP = new Map(SOURCE_LANGUAGES.map((l) => [l.code, l]));

export function targetLanguageName(code: string): string {
  return TARGET_MAP.get(code)?.name ?? code;
}

export function sourceLanguageName(code: string): string {
  if (!code) return "自动检测";
  return (
    SOURCE_MAP.get(code.toUpperCase())?.name ??
    SOURCE_MAP.get(primaryLanguage(code))?.name ??
    code
  );
}

export function languageFlag(code: string): string {
  return TARGET_MAP.get(code)?.flag ?? SOURCE_MAP.get(code)?.flag ?? "🏳️";
}

/** 取主语言码：ZH-HANS → ZH、EN-US → EN。用于判断"原文已经是目标语言"。 */
export function primaryLanguage(code: string): string {
  return (code || "").toUpperCase().split("-")[0];
}

/** 目标语言代码 → 源语言代码（DeepL 两端代码不一致，互换语言时需要归一）。 */
export function toSourceCode(code: string): string {
  if (code === "ZH-HANS" || code === "ZH-HANT") return "ZH";
  if (code === "EN-US" || code === "EN-GB") return "EN";
  if (code === "PT-BR" || code === "PT-PT") return "PT";
  const base = code.split("-")[0];
  return SOURCE_MAP.has(base) ? base : code;
}

/** 源语言代码 → 目标语言代码。 */
export function toTargetCode(code: string): string {
  if (!code) return "ZH-HANS";
  if (code === "ZH") return "ZH-HANS";
  if (code === "EN") return "EN-US";
  if (code === "PT") return "PT-BR";
  if (TARGET_MAP.has(code)) return code;
  return "ZH-HANS";
}

/** 语言代码 → BCP-47（给 macOS say / Google 用）。 */
export function toBcp47(code: string): string {
  const map: Record<string, string> = {
    ZH: "zh-CN",
    "ZH-HANS": "zh-CN",
    "ZH-HANT": "zh-TW",
    EN: "en-US",
    "EN-US": "en-US",
    "EN-GB": "en-GB",
    JA: "ja-JP",
    KO: "ko-KR",
    DE: "de-DE",
    FR: "fr-FR",
    ES: "es-ES",
    RU: "ru-RU",
    IT: "it-IT",
    PT: "pt-PT",
    "PT-BR": "pt-BR",
    "PT-PT": "pt-PT",
    NL: "nl-NL",
    PL: "pl-PL",
    TR: "tr-TR",
    ID: "id-ID",
    UK: "uk-UA",
    AR: "ar-SA",
  };
  return map[code] ?? "en-US";
}
