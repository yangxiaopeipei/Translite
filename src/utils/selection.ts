import { randomUUID } from "node:crypto";
import {
  Clipboard,
  LaunchType,
  getSelectedText,
  launchCommand,
  popToRoot,
} from "@raycast/api";
import { getPreferences } from "../preferences";

export interface SelectionContext {
  variant: "selection";
  text: string;
  fromClipboard: boolean;
  requestId: string;
}

export async function readSelection(): Promise<{
  text: string;
  fromClipboard: boolean;
}> {
  try {
    const text = (await getSelectedText()).trim();
    if (text) return { text, fromClipboard: false };
  } catch {
    /* Some applications do not expose their selection. */
  }
  if (getPreferences().selectionClipboardFallback) {
    try {
      const text = (await Clipboard.readText())?.trim();
      if (text) return { text, fromClipboard: true };
    } catch {
      /* Keep an empty state when clipboard access fails. */
    }
  }
  return { text: "", fromClipboard: false };
}

export async function launchSelection(): Promise<void> {
  // Capture before touching navigation: the source application must still be the selection source.
  const selection = await readSelection();
  const context: SelectionContext = {
    variant: "selection",
    ...selection,
    requestId: randomUUID(),
  };
  // Unload the previous view so the next launch cannot resume an old React state.
  await popToRoot({ clearSearchBar: true });
  await launchCommand({
    name: "translate",
    type: LaunchType.UserInitiated,
    context,
  });
}
