import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { toBcp47 } from "../languages";

const execFileAsync = promisify(execFile);

/** macOS 内置语音。 */
const MAC_VOICES: Record<string, string> = {
  "zh-CN": "Tingting",
  "zh-TW": "Meijia",
  "en-US": "Samantha",
  "en-GB": "Daniel",
  "ja-JP": "Kyoko",
  "ko-KR": "Yuna",
  "de-DE": "Anna",
  "fr-FR": "Thomas",
  "es-ES": "Jorge",
  "ru-RU": "Yuri",
  "it-IT": "Alice",
  "pt-BR": "Luciana",
  "pt-PT": "Joana",
  "nl-NL": "Xander",
  "pl-PL": "Zosia",
  "tr-TR": "Yelda",
  "id-ID": "Damayanti",
  "ar-SA": "Maged",
  "uk-UA": "Oksana",
};

/** 英式 / 美式覆盖，供音标区的两个入口使用。 */
const ENGLISH_VARIANTS: Record<"uk" | "us", string> = {
  uk: "Daniel",
  us: "Samantha",
};

export function isSpeechAvailable(): boolean {
  return process.platform === "darwin" || process.platform === "win32";
}

function cultureFor(langCode: string, variant?: "uk" | "us"): string {
  const bcp = toBcp47(langCode);
  if (variant && (bcp === "en-US" || bcp === "en-GB"))
    return variant === "uk" ? "en-GB" : "en-US";
  return bcp;
}

/** Windows：用 Windows PowerShell 5.1 调 .NET 的 System.Speech 合成。 */
function buildPowerShellScript(culture: string, text: string): string {
  const safe = text.replace(/'/g, "''");
  return [
    "Add-Type -AssemblyName System.Speech;",
    "$s = New-Object System.Speech.Synthesis.SpeechSynthesizer;",
    `$v = $s.GetInstalledVoices() | Where-Object { $_.VoiceInfo.Culture.Name -eq '${culture}' } | Select-Object -First 1;`,
    "if ($v) { $s.SelectVoice($v.VoiceInfo.Name) };",
    `$s.Speak('${safe}');`,
    "$s.Dispose();",
  ].join(" ");
}

export async function speak(
  text: string,
  langCode: string,
  variant?: "uk" | "us",
): Promise<void> {
  const trimmed = text.trim();
  if (!trimmed) return;

  if (process.platform === "darwin") {
    const bcp = toBcp47(langCode);
    const voice =
      variant && (bcp === "en-US" || bcp === "en-GB")
        ? ENGLISH_VARIANTS[variant]
        : MAC_VOICES[bcp];
    await execFileAsync(
      "say",
      voice ? ["-v", voice, "--", trimmed] : ["--", trimmed],
      { timeout: 30_000 },
    );
    return;
  }

  if (process.platform === "win32") {
    const culture = cultureFor(langCode, variant);
    await execFileAsync(
      "powershell.exe",
      [
        "-NoProfile",
        "-NonInteractive",
        "-Command",
        buildPowerShellScript(culture, trimmed),
      ],
      { timeout: 30_000, windowsHide: true },
    );
    return;
  }

  throw new Error("当前平台不支持系统朗读");
}
