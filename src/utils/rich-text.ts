/**
 * 题干/选项/解析的富文本格式化
 *
 * 后端存储的内容混合了：
 *   - HTML（来自管理后台的 wangEditor）
 *   - markdown 链接 [label](url)（题库 Excel 导入遗留）
 *   - 纯文本带 \n 换行
 *
 * 直接 v-html 渲染会让 [label](url) 显示为字面字符、\n 被浏览器折叠成空格。
 *
 * 实现思路：用浏览器原生 HTML 解析器把输入解析成 DOM 树，
 * 只在 TEXT_NODE 上做 markdown 链接 / 裸 URL / \n 转换；
 * 用 DOM API（href setter / textContent）天然完成属性与文本转义，
 * 避免拼字符串 + v-html 带来的属性注入风险。
 *
 * 注意：本函数不做 HTML sanitize。输入里的 `<script>`、`onerror=` 等
 * 会原样透传到 v-html。调用方需保证内容来源可信（管理后台编辑 + 题库导入），
 * 严格场景应在调用前接 DOMPurify 等库。
 *
 * SYNC: 与 frontend/web-app/src/utils/richText.ts、
 *       frontend/mini-program/src/utils/rich-text.ts 共享语义，常量需保持一致。
 * 修改 URL_CHARS / MARKDOWN_LINK_RE / NAKED_URL_RE / TRAILING_PUNCT_RE / BLOCK_TAG_RE 时请同步。
 */

const LINK_CLASS = "text-blue-500 hover:underline break-all";

const URL_CHARS = String.raw`[a-zA-Z0-9\-._~:/?#@!$&*+,;=%]`;
const MARKDOWN_LINK_RE = new RegExp(String.raw`\[([^\]\n]+)\]\((https?:\/\/${URL_CHARS}+)\)`, "g");
const NAKED_URL_RE = new RegExp(`https?:\\/\\/${URL_CHARS}+`, "g");
const TRAILING_PUNCT_RE = /[，。！？：、；,;.!?:)\]}>"']+$/u;

const BLOCK_TAG_RE =
  /<(p|div|h[1-6]|li|ul|ol|table|tr|td|th|pre|blockquote|figure|section|article)[\s/>]/i;

interface TokenMatch {
  start: number;
  end: number;
  url: string;
  label: string;
  trailing: string;
}

function findMatches(text: string): TokenMatch[] {
  const tokens: TokenMatch[] = [];

  let m: RegExpExecArray | null;
  MARKDOWN_LINK_RE.lastIndex = 0;
  while ((m = MARKDOWN_LINK_RE.exec(text)) !== null) {
    tokens.push({
      start: m.index,
      end: m.index + m[0].length,
      url: m[2],
      label: m[1],
      trailing: "",
    });
  }

  NAKED_URL_RE.lastIndex = 0;
  while ((m = NAKED_URL_RE.exec(text)) !== null) {
    const start = m.index;
    const end = start + m[0].length;
    if (tokens.some((t) => start < t.end && end > t.start)) continue;

    const trailing = m[0].match(TRAILING_PUNCT_RE)?.[0] ?? "";
    const url = trailing ? m[0].slice(0, -trailing.length) : m[0];
    if (!url) continue;
    tokens.push({ start, end, url, label: url, trailing });
  }

  return tokens.sort((a, b) => a.start - b.start);
}

function buildLink(url: string, label: string): HTMLAnchorElement {
  const a = document.createElement("a");
  a.href = url;
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  a.className = LINK_CLASS;
  a.textContent = label;
  return a;
}

function appendTextWithBr(frag: DocumentFragment, text: string, preserveNewline: boolean) {
  if (!text) return;
  if (!preserveNewline) {
    frag.appendChild(document.createTextNode(text));
    return;
  }
  const lines = text.split("\n");
  lines.forEach((line, i) => {
    if (line) frag.appendChild(document.createTextNode(line));
    if (i < lines.length - 1) frag.appendChild(document.createElement("br"));
  });
}

function formatTextNode(node: Text, preserveNewline: boolean) {
  const text = node.textContent ?? "";
  if (!text) return;

  const tokens = findMatches(text);
  const hasNewline = preserveNewline && text.includes("\n");
  if (tokens.length === 0 && !hasNewline) return;

  const frag = document.createDocumentFragment();
  let cursor = 0;
  for (const tok of tokens) {
    appendTextWithBr(frag, text.slice(cursor, tok.start), preserveNewline);
    frag.appendChild(buildLink(tok.url, tok.label));
    if (tok.trailing) {
      appendTextWithBr(frag, tok.trailing, preserveNewline);
    }
    cursor = tok.end;
  }
  appendTextWithBr(frag, text.slice(cursor), preserveNewline);

  node.replaceWith(frag);
}

function walkTextNodes(root: Node, preserveNewline: boolean) {
  const nodes: Text[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let n: Node | null;
  while ((n = walker.nextNode())) nodes.push(n as Text);
  for (const node of nodes) formatTextNode(node, preserveNewline);
}

export function formatRichText(text: string | null | undefined): string {
  if (!text) return "";

  const normalized = text.replace(/\r\n?/g, "\n");
  const looksLikeHtml = BLOCK_TAG_RE.test(normalized);

  const tpl = document.createElement("template");
  tpl.innerHTML = normalized;

  walkTextNodes(tpl.content, !looksLikeHtml);

  return tpl.innerHTML;
}
