import { TranslateRequest } from "../types";
import { fetchWithTimeout } from "../utils/request";

const FREE_HOST = "https://api-free.deepl.com";
const PRO_HOST = "https://api.deepl.com";
const TIMEOUT_MS = 15_000;

export class TranslateError extends Error {
  readonly recoverable: boolean;

  constructor(message: string, recoverable = true) {
    super(message);
    this.name = "TranslateError";
    this.recoverable = recoverable;
  }
}

interface DeepLTranslation {
  detected_source_language?: string;
  text?: string;
}

interface DeepLResponse {
  translations?: DeepLTranslation[];
  message?: string;
}

/** 免费版 Key 以 :fx 结尾，必须走 api-free 域名。 */
function hostFor(apiKey: string): string {
  return apiKey.trim().endsWith(":fx") ? FREE_HOST : PRO_HOST;
}

function explain(status: number, message?: string): TranslateError {
  const detail = message ? `（${message}）` : "";
  switch (status) {
    case 400:
      return new TranslateError(`DeepL 请求参数有误${detail}`, false);
    case 401:
    case 403:
      return new TranslateError(
        `DeepL API Key 无效或类型不匹配${detail}，请到扩展偏好设置检查`,
        false,
      );
    case 404:
      return new TranslateError("DeepL 接口不存在，请升级扩展", false);
    case 413:
      return new TranslateError("文本过长，DeepL 拒绝处理", false);
    case 414:
      return new TranslateError("请求 URL 过长，请缩短文本", false);
    case 429:
      return new TranslateError(`DeepL 限流${detail}，稍后重试`);
    case 456:
      return new TranslateError(`DeepL 免费额度已用尽${detail}`, false);
    case 503:
      return new TranslateError(`DeepL 暂时不可用${detail}`);
    default:
      return new TranslateError(`DeepL 请求失败（${status}）${detail}`);
  }
}

export async function translateWithDeepL(
  request: TranslateRequest & { apiKey: string },
): Promise<{ text: string; sourceLang: string }> {
  const apiKey = request.apiKey.trim();
  if (!apiKey) {
    throw new TranslateError(
      "未配置 DeepL API Key，请在扩展偏好设置中填写",
      false,
    );
  }

  const body = new URLSearchParams();
  body.set("text", request.text);
  body.set("target_lang", request.targetLang);
  if (request.sourceLang) body.set("source_lang", request.sourceLang);
  body.set("preserve_formatting", "1");

  let response: Awaited<ReturnType<typeof fetchWithTimeout>>;
  try {
    response = await fetchWithTimeout(
      `${hostFor(apiKey)}/v2/translate`,
      {
        method: "POST",
        headers: {
          // DeepL 已弃用 body 里的 auth_key，必须走 Authorization 头
          Authorization: `DeepL-Auth-Key ${apiKey}`,
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
        },
        body: body.toString(),
      },
      request.signal,
      TIMEOUT_MS,
    );
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new TranslateError(`无法连接 DeepL：${reason}`);
  }

  if (!response.ok) {
    let serverMessage: string | undefined;
    try {
      const parsed = JSON.parse(response.body) as DeepLResponse;
      serverMessage = parsed.message;
    } catch {
      /* 忽略解析失败，状态码足够说明问题 */
    }
    throw explain(response.status, serverMessage);
  }

  let data: DeepLResponse;
  try {
    data = JSON.parse(response.body) as DeepLResponse;
  } catch {
    throw new TranslateError("DeepL 返回了无法解析的内容");
  }
  const first = data.translations?.[0];
  const text = first?.text?.trim();
  if (!text) {
    throw new TranslateError("DeepL 返回了空译文");
  }
  return {
    text,
    sourceLang: first?.detected_source_language ?? request.sourceLang ?? "",
  };
}
