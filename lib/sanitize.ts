import DOMPurify from "isomorphic-dompurify";

export function sanitizeHtml(html: string): string {
  if (!html) return "";
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      "p", "br", "hr", "h1", "h2", "h3", "h4", "h5", "h6",
      "ul", "ol", "li", "dl", "dt", "dd",
      "blockquote", "pre", "code",
      "strong", "b", "em", "i", "u", "s", "strike", "del",
      "a", "img", "figure", "figcaption",
      "table", "thead", "tbody", "tr", "th", "td",
      "div", "span", "section", "article",
      "iframe", "video", "source",
    ],
    ALLOWED_ATTR: [
      "href", "target", "rel", "title",
      "src", "alt", "width", "height",
      "class", "id", "style",
      "data-*",
      "frameborder", "allowfullscreen", "allow",
    ],
    ALLOW_DATA_ATTR: true,
  });
}
