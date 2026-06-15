/**
 * 把后端存储的「任意富文本」规整成 wangEditor-next 能正确解析的「规范 HTML」。
 *
 * 背景：
 *   wangEditor-next 的 setHtml / createEditor({html}) 用的是「严格解析器」，
 *   只接受 wangEditor 自己生成格式的 HTML —— 顶层子节点必须是块级元素（<p>/<h*>/<ul> 等）。
 *   而题库导入的解析/题干常是「散文本 + 顶层 <img>」(没有 <p> 包裹)。严格解析器会保留
 *   能识别的 <img> void 节点，但 Slate 根节点规整会丢掉顶层裸文本节点 —— 于是「文本消失、
 *   只剩一张无法编辑的图片」。
 *
 * 解决：进入编辑前，先用 formatRichText 得到与「预览」一致的浏览器友好 HTML，
 *   再把顶层的「文本/内联元素/图片」连续段落包进 <p>，块级元素原样透传。
 *   这样编辑器起手内容 = 预览内容，且是 wangEditor 规范格式，文本不再丢失。
 *
 * 注意：本函数仅供管理后台富文本「编辑」入口使用，不与 frontend / mini-program 共享。
 */
import { formatRichText } from "@/utils/rich-text";

/** 顶层视为「块级」的标签：原样透传，不再包 <p>。与 rich-text.ts 的 BLOCK_TAG_RE 对齐。 */
const BLOCK_TAGS = new Set([
  "P",
  "DIV",
  "H1",
  "H2",
  "H3",
  "H4",
  "H5",
  "H6",
  "UL",
  "OL",
  "LI",
  "TABLE",
  "THEAD",
  "TBODY",
  "TR",
  "TD",
  "TH",
  "PRE",
  "BLOCKQUOTE",
  "FIGURE",
  "SECTION",
  "ARTICLE",
  "HR",
]);

function isBlankText(node: Node): boolean {
  return node.nodeType === Node.TEXT_NODE && !(node.textContent ?? "").trim();
}

/** 把顶层的裸文本 / 内联元素 / <img> 连续段包进 <p>，块级元素原样保留。 */
function wrapTopLevelInlines(html: string): string {
  const src = document.createElement("template");
  src.innerHTML = html;

  const out = document.createElement("template");
  let buffer: Node[] = [];

  const flush = () => {
    if (!buffer.length) return;
    // 纯空白段（块级元素之间的换行缩进）直接丢弃，避免产生空 <p>
    if (buffer.every(isBlankText)) {
      buffer = [];
      return;
    }
    const p = document.createElement("p");
    buffer.forEach((n) => p.appendChild(n));
    out.content.appendChild(p);
    buffer = [];
  };

  // 先快照，appendChild 会把节点移出 src.content
  Array.from(src.content.childNodes).forEach((node) => {
    const isBlock =
      node.nodeType === Node.ELEMENT_NODE && BLOCK_TAGS.has((node as Element).tagName);
    if (isBlock) {
      flush();
      out.content.appendChild(node);
    } else {
      buffer.push(node);
    }
  });
  flush();

  return out.innerHTML;
}

/**
 * 规整任意存储富文本 → wangEditor 可正确解析的 HTML。
 * 空内容返回空串。
 */
export function toEditorHtml(text: string | null | undefined): string {
  if (!text) return "";
  return wrapTopLevelInlines(formatRichText(text));
}
