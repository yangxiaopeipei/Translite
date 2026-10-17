import { useEffect, useState } from "react";
import {
  Action,
  ActionPanel,
  Clipboard,
  Detail,
  Form,
  Icon,
  Keyboard,
  LaunchType,
  Toast,
  openExtensionPreferences,
  launchCommand,
  showToast,
} from "@raycast/api";
import { showFailureToast, useCachedState } from "@raycast/utils";
import { MAX_TEXT_LENGTH, translate } from "../engines";
import { getPreferences } from "../preferences";
import {
  SOURCE_LANGUAGES,
  TARGET_LANGUAGES,
  toSourceCode,
  toTargetCode,
} from "../languages";
import { EngineId, TranslationResult } from "../types";
import { isSpeechAvailable, speak } from "../utils/speech";
import { buildReadingMarkdown } from "./ResultDetail";

interface TranslationViewProps {
  initialText?: string;
  variant?: "input" | "selection";
  fromClipboard?: boolean;
}
export function TranslationView({
  initialText = "",
  variant = "input",
  fromClipboard = false,
}: TranslationViewProps) {
  const preferences = getPreferences();
  const [text, setText] = useState(initialText);
  const [fromClip, setFromClip] = useState(fromClipboard);
  const [source, setSource] = useCachedState<string>(
    `${variant}-source-v2`,
    preferences.defaultSource,
  );
  const [target, setTarget] = useCachedState<string>(
    `${variant}-target-v2`,
    preferences.defaultTarget,
  );
  const [engine, setEngine] = useCachedState<EngineId>(
    "engine-v2",
    preferences.primaryEngine,
  );
  const [autoTarget, setAutoTarget] = useState(true);
  const [revision, setRevision] = useState(0);
  const [state, setState] = useState<{
    result?: TranslationResult;
    error?: string;
    loading: boolean;
    key?: string;
  }>({
    loading: false,
  });
  const query = text.trim();
  const count = Array.from(query).length;
  const key = JSON.stringify([
    query,
    source,
    target,
    engine,
    autoTarget,
    revision,
  ]);
  const result = state.key === key ? state.result : undefined;
  const error = state.key === key ? state.error : undefined;
  const loading = Boolean(query) && (state.key !== key || state.loading);

  useEffect(() => {
    setText(initialText);
    setFromClip(fromClipboard);
  }, [initialText, fromClipboard]);
  useEffect(() => {
    const controller = new AbortController();
    setState({ loading: Boolean(query), key });
    if (!query) return () => controller.abort();
    const timer = setTimeout(() => {
      void translate({
        text: query,
        sourceLang: source,
        targetLang: target,
        engine,
        autoTarget,
        signal: controller.signal,
      })
        .then((value) => {
          if (!controller.signal.aborted)
            setState({ result: value, loading: false, key });
        })
        .catch((failure: unknown) => {
          if (!controller.signal.aborted)
            setState({
              error:
                failure instanceof Error ? failure.message : String(failure),
              loading: false,
              key,
            });
        });
    }, 320);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, source, target, engine, autoTarget, key]);

  function updateText(value: string, clipboard = false) {
    setText(value);
    setFromClip(clipboard);
  }
  function changeTarget(value: string) {
    setTarget(value);
    setAutoTarget(false);
  }
  async function reread() {
    try {
      await launchCommand({
        name: "translate-selection",
        type: LaunchType.UserInitiated,
      });
    } catch (failure) {
      await showFailureToast(failure, { title: "读取选中文本失败" });
    }
  }
  async function pasteClipboard() {
    try {
      const value = await Clipboard.readText();
      if (!value?.trim()) {
        await showToast({
          style: Toast.Style.Failure,
          title: "剪贴板没有文本",
        });
        return;
      }
      updateText(value, true);
    } catch (failure) {
      await showFailureToast(failure, { title: "读取剪贴板失败" });
    }
  }
  function swap() {
    if (!result) return;
    setSource(toSourceCode(result.targetLang));
    setTarget(toTargetCode(result.sourceLang));
    updateText(result.translation);
    setAutoTarget(false);
  }
  async function readAloud(value: string, language: string) {
    try {
      await speak(value, language);
    } catch (failure) {
      await showFailureToast(failure, { title: "朗读失败" });
    }
  }

  const actions = (
    <ActionPanel>
      {result ? (
        <Action.CopyToClipboard
          title="复制译文"
          content={result.translation}
          shortcut={Keyboard.Shortcut.Common.Copy}
        />
      ) : (
        <Action
          title="翻译"
          icon={Icon.Globe}
          onAction={() => setRevision((value) => value + 1)}
        />
      )}
      {result && !(variant === "selection" && fromClip) ? (
        <Action.Paste
          title={variant === "selection" ? "替换选中的文本" : "粘贴译文"}
          content={result.translation}
          shortcut={{
            macOS: { modifiers: ["cmd", "shift"], key: "v" },
            Windows: { modifiers: ["ctrl", "shift"], key: "v" },
          }}
        />
      ) : null}
      <Action
        title="翻译剪贴板"
        icon={Icon.Clipboard}
        shortcut={{
          macOS: { modifiers: ["cmd", "shift"], key: "b" },
          Windows: { modifiers: ["ctrl", "shift"], key: "b" },
        }}
        onAction={pasteClipboard}
      />
      {variant === "selection" ? (
        <Action
          title="重新读取选中的文本"
          icon={Icon.ArrowClockwise}
          shortcut={{
            macOS: { modifiers: ["cmd", "shift"], key: "r" },
            Windows: { modifiers: ["ctrl", "shift"], key: "r" },
          }}
          onAction={reread}
        />
      ) : null}
      {result && preferences.enableSpeech && isSpeechAvailable() ? (
        <ActionPanel.Section title="朗读">
          <Action
            title="朗读原文"
            icon={Icon.SpeakerUp}
            onAction={() => readAloud(result.query, result.sourceLang)}
          />
          <Action
            title="朗读译文"
            icon={Icon.SpeakerUp}
            onAction={() => readAloud(result.translation, result.targetLang)}
          />
        </ActionPanel.Section>
      ) : null}
      <ActionPanel.Section title="翻译设置">
        <ActionPanel.Submenu title="切换翻译服务" icon={Icon.Globe}>
          <Action
            title={`DeepL${engine === "deepl" ? " ✓" : ""}`}
            onAction={() => setEngine("deepl")}
          />
          <Action
            title={`Google 翻译${engine === "google" ? " ✓" : ""}`}
            onAction={() => setEngine("google")}
          />
        </ActionPanel.Submenu>
        {variant === "selection" ? (
          <>
            <ActionPanel.Submenu title="源语言" icon={Icon.Text}>
              {SOURCE_LANGUAGES.map((language) => (
                <Action
                  key={language.code}
                  title={`${language.name}${source === language.code ? " ✓" : ""}`}
                  onAction={() => setSource(language.code)}
                />
              ))}
            </ActionPanel.Submenu>
            <ActionPanel.Submenu title="目标语言" icon={Icon.Globe}>
              {TARGET_LANGUAGES.map((language) => (
                <Action
                  key={language.code}
                  title={`${language.name}${(result?.targetLang ?? target) === language.code ? " ✓" : ""}`}
                  onAction={() => changeTarget(language.code)}
                />
              ))}
            </ActionPanel.Submenu>
          </>
        ) : null}
        {result ? (
          <Action
            title="交换原文与译文"
            icon={Icon.ArrowClockwise}
            shortcut={{
              macOS: { modifiers: ["cmd", "shift"], key: "l" },
              Windows: { modifiers: ["ctrl", "shift"], key: "l" },
            }}
            onAction={swap}
          />
        ) : null}
        <Action
          title={autoTarget ? "自动换向已开启 · 关闭" : "开启自动换向"}
          icon={Icon.ArrowRight}
          onAction={() => setAutoTarget(!autoTarget)}
        />
        {query ? (
          <Action
            title="重新翻译"
            icon={Icon.ArrowClockwise}
            shortcut={Keyboard.Shortcut.Common.Refresh}
            onAction={() => setRevision((value) => value + 1)}
          />
        ) : null}
        <Action
          title="打开扩展设置"
          icon={Icon.Gear}
          onAction={openExtensionPreferences}
        />
      </ActionPanel.Section>
    </ActionPanel>
  );

  const engineName =
    (result?.engine ?? engine) === "deepl" ? "DeepL" : "Google 翻译";
  const status = error
    ? `翻译失败：${error}`
    : loading
      ? "正在翻译…"
      : "输入原文开始翻译";
  if (variant === "selection") {
    const markdown = buildReadingMarkdown(
      result ?? {
        query,
        sourceLang: source,
        targetLang: target,
        engine,
        translation: status,
      },
      fromClip,
    );
    return (
      <Detail
        navigationTitle="划词翻译"
        isLoading={loading}
        markdown={markdown}
        actions={actions}
      />
    );
  }

  return (
    <Form
      navigationTitle="翻译"
      isLoading={loading}
      enableDrafts={false}
      actions={actions}
    >
      <Form.TextArea
        id="original"
        title="原文"
        autoFocus
        value={text}
        onChange={(value) => updateText(value)}
        placeholder="输入或粘贴文字，自动翻译…"
        error={
          count > MAX_TEXT_LENGTH ? `最多 ${MAX_TEXT_LENGTH} 字` : undefined
        }
      />
      <Form.Dropdown
        id="source"
        title="源语言"
        value={source}
        onChange={setSource}
      >
        {SOURCE_LANGUAGES.map((language) => (
          <Form.Dropdown.Item
            key={language.code}
            value={language.code}
            title={language.name}
          />
        ))}
      </Form.Dropdown>
      <Form.Dropdown
        id="target"
        title="目标语言"
        value={result?.targetLang ?? target}
        onChange={changeTarget}
      >
        {TARGET_LANGUAGES.map((language) => (
          <Form.Dropdown.Item
            key={language.code}
            value={language.code}
            title={language.name}
          />
        ))}
      </Form.Dropdown>
      <Form.Separator />
      <Form.Description
        title={engineName}
        text={result?.translation ?? status}
      />
      {fromClip ? <Form.Description title="来源" text="剪贴板" /> : null}
      {result?.notice ? (
        <Form.Description title="提示" text={result.notice} />
      ) : null}
    </Form>
  );
}
