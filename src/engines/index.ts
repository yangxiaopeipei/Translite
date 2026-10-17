import { EngineId, TranslateRequest, TranslationResult } from "../types";
import { getPreferences } from "../preferences";
import { primaryLanguage } from "../languages";
import { TranslateError, translateWithDeepL } from "./deepl";
import { translateWithGoogle } from "./google";

export const MAX_TEXT_LENGTH = 5000;

function likelySource(text: string): string | undefined {
  if (/[\u3040-\u30ff]/.test(text)) return "JA";
  if (/[\uac00-\ud7af]/.test(text)) return "KO";
  if (/[\u3400-\u4dbf\u4e00-\u9fff]/.test(text)) return "ZH";
  if (/[\u0600-\u06ff]/.test(text)) return "AR";
  return undefined;
}

async function run(
  request: TranslateRequest,
  primary: EngineId,
): Promise<TranslationResult> {
  const { apiKey } = getPreferences();
  const order: EngineId[] =
    primary === "google" ? ["google", "deepl"] : ["deepl", "google"];
  const errors: string[] = [];
  for (const engine of order) {
    request.signal?.throwIfAborted();
    try {
      const out =
        engine === "deepl"
          ? await translateWithDeepL({ ...request, apiKey })
          : await translateWithGoogle(request);
      return {
        query: request.text,
        translation: out.text,
        sourceLang: out.sourceLang,
        targetLang: request.targetLang,
        engine,
        degraded: engine !== primary,
        notice: errors.length
          ? `${primary === "deepl" ? "DeepL" : "Google"} 不可用：${errors[0]}`
          : undefined,
      };
    } catch (error) {
      request.signal?.throwIfAborted();
      errors.push(error instanceof Error ? error.message : String(error));
    }
  }
  throw new TranslateError(errors.join("\n"));
}

export async function translate(
  request: TranslateRequest,
): Promise<TranslationResult> {
  const text = request.text.trim();
  if (!text) throw new TranslateError("请输入要翻译的文本", false);
  if (Array.from(text).length > MAX_TEXT_LENGTH)
    throw new TranslateError(
      `最多翻译 ${MAX_TEXT_LENGTH} 个字符，请缩短原文`,
      false,
    );
  const preferences = getPreferences();
  const primary = request.engine ?? preferences.primaryEngine;
  const alternate = preferences.alternateTarget;
  const canSwitch =
    request.autoTarget !== false &&
    !request.sourceLang &&
    primaryLanguage(alternate) !== primaryLanguage(request.targetLang);
  const preSwitch =
    canSwitch && likelySource(text) === primaryLanguage(request.targetLang);
  let outcome = await run(
    {
      ...request,
      text,
      targetLang: preSwitch ? alternate : request.targetLang,
    },
    primary,
  );
  if (
    !preSwitch &&
    canSwitch &&
    primaryLanguage(outcome.sourceLang) === primaryLanguage(request.targetLang)
  ) {
    outcome = await run({ ...request, text, targetLang: alternate }, primary);
  }
  return outcome;
}
