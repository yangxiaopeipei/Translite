import { showFailureToast } from "@raycast/utils";
import { launchSelection } from "./utils/selection";

/** No-view launcher runs for every hotkey invocation, instead of resuming a retained result view. */
export default async function TranslateSelectionCommand() {
  try {
    await launchSelection();
  } catch (error) {
    await showFailureToast(error, { title: "读取选中文本失败" });
  }
}
