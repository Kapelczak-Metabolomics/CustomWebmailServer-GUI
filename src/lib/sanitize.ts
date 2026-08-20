import DOMPurify from "dompurify";

const ALLOWED_TAGS = [
  "p", "br", "strong", "em", "b", "i", "u", "s", "strike",
  "ul", "ol", "li", "a", "span", "div", "img",
  "table", "tr", "td", "th", "thead", "tbody", "tfoot",
  "blockquote", "code", "pre", "hr", "h1", "h2", "h3", "h4", "h5", "h6",
  "sub", "sup", "dl", "dt", "dd", "figure", "figcaption",
];

const ALLOWED_ATTR = [
  "href", "src", "alt", "title", "class", "style",
  "target", "rel", "width", "height", "colspan", "rowspan",
];

export function sanitizeHtml(html: string): string {
  if (!html) return "";
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS: ["script", "iframe", "object", "embed", "form", "input", "style"],
    FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover", "onfocus", "onblur"],
  });
}
