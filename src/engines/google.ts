import { TranslateRequest } from "../types";
import { TranslateError } from "./deepl";
import { fetchWithTimeout } from "../utils/request";

export function googleCode(code: string): string {
  if (!code) return "auto";
  const upper = code.toUpperCase();
  if (upper === "ZH-HANT" || upper === "ZH-TW") return "zh-TW";
  if (upper.startsWith("ZH")) return "zh-CN";
  return upper.split("-")[0].toLowerCase();
}

/** Bound GET URL size and preserve Unicode surrogate pairs. */
export function splitGoogleText(text: string): string[] {
  const chars = Array.from(text);
  const parts: string[] = [];
  for (let i = 0; i < chars.length;) {
    let end = i;
    let encodedSize = 0;
    while (end < chars.length && end - i < 800) {
      const size = Buffer.byteLength(chars[end], "utf8") * 3;
      if (encodedSize + size > 5500) break;
      encodedSize += size;
      end++;
    }
    if (end < chars.length) {
      for (let j = end - 1; j > i + 400; j--) {
        if (/[\n。！？.!?\s]/.test(chars[j])) {
          end = j + 1;
          break;
        }
      }
    }
    parts.push(chars.slice(i, end).join(""));
    i = end;
  }
  return parts;
}

export async function translateWithGoogle(
  request: TranslateRequest,
): Promise<{ text: string; sourceLang: string }> {
  const output: string[] = [];
  let sourceLang = request.sourceLang;
  for (const chunk of splitGoogleText(request.text)) {
    request.signal?.throwIfAborted();
    const params = new URLSearchParams({
      client: "gtx",
      sl: googleCode(request.sourceLang),
      tl: googleCode(request.targetLang),
      dt: "t",
      q: chunk,
    });
    try {
      const response = await fetchWithTimeout(
        `https://translate.googleapis.com/translate_a/single?${params}`,
        {},
        request.signal,
      );
      if (!response.ok)
        throw new TranslateError(`Google 翻译请求失败（${response.status}）`);
      const data: unknown = JSON.parse(response.body);
      if (!Array.isArray(data) || !Array.isArray(data[0]))
        throw new TranslateError("Google 翻译返回了无法解析的内容");
      const text = data[0]
        .map((segment: unknown) =>
          Array.isArray(segment) && typeof segment[0] === "string"
            ? segment[0]
            : "",
        )
        .join("");
      if (!text.trim()) throw new TranslateError("Google 翻译返回了空译文");
      output.push(text);
      if (!sourceLang && typeof data[2] === "string")
        sourceLang = data[2].toUpperCase();
    } catch (error) {
      if (error instanceof TranslateError) throw error;
      throw new TranslateError(
        `无法连接 Google 翻译：${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
  return { text: output.join(""), sourceLang };
}
