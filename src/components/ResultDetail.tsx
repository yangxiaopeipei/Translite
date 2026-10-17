import { TranslationResult } from "../types";
import { sourceLanguageName, targetLanguageName } from "../languages";

export function escapeMarkdown(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/([\\`*_{}[\]()#+.!|~-])/g, "\\$1");
}
function quote(text: string): string {
  return escapeMarkdown(text)
    .split("\n")
    .map((line) => `> ${line || " "}`)
    .join("\n");
}
export function buildReadingMarkdown(
  result: TranslationResult,
  fromClipboard = false,
): string {
  const engine = result.engine === "deepl" ? "DeepL" : "Google 翻译";
  return [
    `${sourceLanguageName(result.sourceLang)} → ${targetLanguageName(result.targetLang)}`,
    "",
    `#### 原文 · ${Array.from(result.query).length} 字${fromClipboard ? " · 来自剪贴板" : ""}`,
    quote(
      result.query ||
        "没有读到选中的文本。请选中文字后再次按划词快捷键，或先复制文字。",
    ),
    "",
    "---",
    "",
    `#### ${engine}${result.degraded ? " · 自动回退" : ""}`,
    quote(result.translation),
    "",
    result.notice ? `*提示：${escapeMarkdown(result.notice)}*` : "",
  ].join("\n");
}
