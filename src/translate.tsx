import { LaunchProps } from "@raycast/api";
import { TranslationView } from "./components/TranslationView";
import { SelectionContext } from "./utils/selection";

export default function TranslateCommand({
  launchContext,
}: LaunchProps<{ launchContext?: SelectionContext }>) {
  const selection =
    launchContext?.variant === "selection" ? launchContext : undefined;
  return (
    <TranslationView
      key={selection?.requestId ?? "input"}
      initialText={selection?.text}
      variant={selection ? "selection" : "input"}
      fromClipboard={selection?.fromClipboard}
    />
  );
}
