// A rich_text_field metafield (Shopify's JSON tree) as HTML — what Liquid's metafield_tag outputs
const escape = (text = '') => text.replace(/[&<>"]/g, (char) => `&#${char.charCodeAt(0)};`);

function node(item) {
  const inner = (item.children ?? []).map(node).join('');
  switch (item.type) {
    case 'root':
      return inner;
    case 'paragraph':
      return `<p>${inner}</p>`;
    case 'heading':
      return `<h${item.level || 2}>${inner}</h${item.level || 2}>`;
    case 'list':
      return item.listType === 'ordered' ? `<ol>${inner}</ol>` : `<ul>${inner}</ul>`;
    case 'list-item':
      return `<li>${inner}</li>`;
    case 'link':
      return `<a href="${escape(item.url)}"${item.target ? ` target="${escape(item.target)}"` : ''}>${inner}</a>`;
    case 'text': {
      let text = escape(item.value);
      if (item.bold) text = `<strong>${text}</strong>`;
      if (item.italic) text = `<em>${text}</em>`;
      return text;
    }
    default:
      return inner;
  }
}

export function richTextHtml(value) {
  if (!value) return '';
  try {
    return node(JSON.parse(value));
  } catch {
    return '';
  }
}
