/**
 * 富文本「点击进入编辑」时，把光标放到用户点击的位置。
 *
 * 难点：预览态（纯 HTML）点击后会整体换成 WangEditor（顶部多了一条工具栏），
 *   屏幕坐标对不上，用 caretRangeFromPoint 的像素映射不可靠。
 *   因此改用「字符偏移」：先在预览 DOM 上算出点击落在第几个字符，
 *   再在 WangEditor 的 Slate 文档里定位到同一字符偏移处。
 *
 * 预览文本（formatRichText 产物）与编辑器文本基本一致（toEditorHtml 只是补 <p> 包裹，
 *   不改文字；图片在两侧都计 0 长度）。换行 <br> 在两侧可能差一两个字符，属可接受误差。
 */
import { SlateTransforms, SlateNode } from "@wangeditor-next/editor";

/**
 * 计算点击点在「预览内容元素」里的全局字符偏移。
 * 命中非文本（图片、空白、元素边界）或不在内容内 → 返回 null（调用方回退到末尾）。
 */
export function getPreviewCaretOffset(contentEl: HTMLElement, x: number, y: number): number | null {
  const doc = document as Document & {
    caretRangeFromPoint?: (x: number, y: number) => Range | null;
    caretPositionFromPoint?: (x: number, y: number) => { offsetNode: Node; offset: number } | null;
  };

  let domNode: Node | null = null;
  let domOffset = 0;
  if (typeof doc.caretRangeFromPoint === "function") {
    const r = doc.caretRangeFromPoint(x, y);
    if (r) {
      domNode = r.startContainer;
      domOffset = r.startOffset;
    }
  } else if (typeof doc.caretPositionFromPoint === "function") {
    const p = doc.caretPositionFromPoint(x, y);
    if (p) {
      domNode = p.offsetNode;
      domOffset = p.offset;
    }
  }

  if (!domNode || domNode.nodeType !== Node.TEXT_NODE || !contentEl.contains(domNode)) {
    return null;
  }

  const walker = document.createTreeWalker(contentEl, NodeFilter.SHOW_TEXT);
  let total = 0;
  let n: Node | null;
  while ((n = walker.nextNode())) {
    if (n === domNode) return total + domOffset;
    total += (n.textContent ?? "").length;
  }
  return null;
}

/**
 * 纯函数：按文档顺序的文本段（path + 长度），定位第 offset 个字符落在哪个文本段内。
 * 超出总长 → 返回 null（调用方回退到末尾）。导出以便单测。
 */
export function findSlatePoint<T>(
  entries: Array<{ path: T; len: number }>,
  offset: number
): { path: T; offset: number } | null {
  if (offset < 0) return null;
  let remaining = offset;
  for (const e of entries) {
    if (remaining <= e.len) return { path: e.path, offset: remaining };
    remaining -= e.len;
  }
  return null;
}

/**
 * 把 WangEditor 光标定位到指定字符偏移并聚焦；offset 为 null 或定位失败时聚焦到末尾。
 */
export function focusEditorAtOffset(editor: any, offset: number | null): void {
  try {
    if (offset == null) {
      editor.focus(true);
      return;
    }
    const entries: Array<{ path: unknown; len: number }> = [];
    for (const [node, path] of SlateNode.texts(editor)) {
      entries.push({ path, len: (node as { text: string }).text.length });
    }
    const point = findSlatePoint(entries, offset);
    if (!point) {
      editor.focus(true);
      return;
    }
    SlateTransforms.select(editor, { anchor: point, focus: point } as any);
    editor.restoreSelection();
  } catch {
    try {
      editor.focus(true);
    } catch {
      /* noop */
    }
  }
}
