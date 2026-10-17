import { getPreferenceValues } from "@raycast/api";

export interface Preferences {
  apiKey: string;
  defaultTarget: string;
  defaultSource: string;
  /** 原文已经是目标语言时，改译成这个语言（避免中译中）。 */
  alternateTarget: string;
  /** 主引擎：deepl 或 google，另一个自动兜底。 */
  primaryEngine: "deepl" | "google";
  enableSpeech: boolean;
  selectionClipboardFallback: boolean;
}

export function getPreferences(): Preferences {
  const p = getPreferenceValues<Preferences>();
  return {
    apiKey: (p.apiKey ?? "").trim(),
    defaultTarget: p.defaultTarget || "ZH-HANS",
    defaultSource: p.defaultSource ?? "",
    alternateTarget: p.alternateTarget || "EN-US",
    primaryEngine: p.primaryEngine === "google" ? "google" : "deepl",
    enableSpeech: Boolean(p.enableSpeech),
    // 未显式关闭就视为开启：划词取不到内容时宁可多用一次剪贴板，也别空白页
    selectionClipboardFallback: p.selectionClipboardFallback !== false,
  };
}
