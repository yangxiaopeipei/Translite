export type EngineId = "deepl" | "google";
export interface TranslationResult {
  query: string;
  sourceLang: string;
  targetLang: string;
  translation: string;
  engine: EngineId;
  degraded?: boolean;
  notice?: string;
}
export interface TranslateRequest {
  text: string;
  sourceLang: string;
  targetLang: string;
  engine?: EngineId;
  signal?: AbortSignal;
  autoTarget?: boolean;
}
