import { Fragment, type ReactNode } from "react";

// Minimal, safe Markdown renderer for assistant replies. Returns React nodes
// (never dangerouslySetInnerHTML), so all text is escaped by React. Supports
// the subset the model actually emits: headings, bold/italic, inline code,
// links, and ordered/unordered lists.

const INLINE = /(\*\*([^*]+)\*\*)|(`([^`]+)`)|(\[([^\]]+)\]\(([^)\s]+)\))|(\*([^*]+)\*)|(_([^_]+)_)/;

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let rest = text;
  let i = 0;
  while (rest.length) {
    const m = INLINE.exec(rest);
    if (!m) {
      nodes.push(<Fragment key={`${keyPrefix}-t${i}`}>{rest}</Fragment>);
      break;
    }
    if (m.index > 0) {
      nodes.push(
        <Fragment key={`${keyPrefix}-t${i}`}>
          {rest.slice(0, m.index)}
        </Fragment>,
      );
    }
    const key = `${keyPrefix}-m${i}`;
    if (m[1]) {
      nodes.push(<strong key={key}>{m[2]}</strong>);
    } else if (m[3]) {
      nodes.push(
        <code
          key={key}
          className="rounded bg-brand-100 px-1 py-0.5 font-mono text-[0.85em]"
        >
          {m[4]}
        </code>,
      );
    } else if (m[5]) {
      nodes.push(
        <a
          key={key}
          href={m[7]}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-highlight-700 underline"
        >
          {m[6]}
        </a>,
      );
    } else if (m[8]) {
      nodes.push(<em key={key}>{m[9]}</em>);
    } else if (m[10]) {
      nodes.push(<em key={key}>{m[11]}</em>);
    }
    rest = rest.slice(m.index + m[0].length);
    i++;
  }
  return nodes;
}

type ListNode = { ordered: boolean; text: string; children: ListNode[] };

const isListItem = (l: string) => /^\s*([-*]|\d+\.)\s+/.test(l);

// Build a nested list tree from raw item lines, using leading indentation to
// determine nesting depth.
function buildListTree(rawItems: string[]): ListNode[] {
  const root: ListNode[] = [];
  const stack: { indent: number; list: ListNode[] }[] = [
    { indent: -1, list: root },
  ];
  for (const raw of rawItems) {
    const indent = (/^(\s*)/.exec(raw)?.[1] ?? "").length;
    const ordered = /^\s*\d+\.\s+/.test(raw);
    const text = raw.replace(/^\s*([-*]|\d+\.)\s+/, "");
    while (stack.length > 1 && indent < stack[stack.length - 1]!.indent) {
      stack.pop();
    }
    if (stack.length > 1 && indent === stack[stack.length - 1]!.indent) {
      stack.pop();
    }
    const node: ListNode = { ordered, text, children: [] };
    stack[stack.length - 1]!.list.push(node);
    stack.push({ indent, list: node.children });
  }
  return root;
}

function renderList(nodes: ListNode[], keyPrefix: string): ReactNode {
  if (nodes.length === 0) return null;
  const ordered = nodes[0]!.ordered;
  const className = ordered
    ? "list-decimal space-y-1 pl-5"
    : "list-disc space-y-1 pl-5";
  const children = nodes.map((n, idx) => (
    <li key={idx}>
      {renderInline(n.text, `${keyPrefix}-${idx}`)}
      {n.children.length > 0
        ? renderList(n.children, `${keyPrefix}-${idx}c`)
        : null}
    </li>
  ));
  return ordered ? (
    <ol key={keyPrefix} className={className}>
      {children}
    </ol>
  ) : (
    <ul key={keyPrefix} className={className}>
      {children}
    </ul>
  );
}

export function Markdown({ text }: { text: string }) {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const at = (idx: number) => lines[idx] ?? "";
  const blocks: ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = at(i);
    if (!line.trim()) {
      i++;
      continue;
    }

    const heading = /^(#{1,6})\s+(.*)$/.exec(line);
    if (heading) {
      blocks.push(
        <p key={`b${key++}`} className="text-sm font-semibold text-brand-900">
          {renderInline(heading[2] ?? "", `h${key}`)}
        </p>,
      );
      i++;
      continue;
    }

    if (isListItem(line)) {
      // Gather the whole list region. Tolerate blank lines BETWEEN items (the
      // model often double-spaces them) — otherwise each item becomes its own
      // single-item <ol> and the numbering restarts at 1 every time. Indented
      // non-item lines are treated as continuations of the previous item.
      const region: string[] = [];
      while (i < lines.length) {
        const cur = at(i);
        if (isListItem(cur)) {
          region.push(cur);
          i++;
          continue;
        }
        if (!cur.trim()) {
          let j = i;
          while (j < lines.length && !at(j).trim()) j++;
          if (j < lines.length && isListItem(at(j))) {
            i = j;
            continue;
          }
          break;
        }
        if (/^\s+\S/.test(cur) && region.length > 0) {
          region[region.length - 1] += ` ${cur.trim()}`;
          i++;
          continue;
        }
        break;
      }
      blocks.push(renderList(buildListTree(region), `b${key++}`));
      continue;
    }

    const para: string[] = [line];
    i++;
    while (
      i < lines.length &&
      at(i).trim() &&
      !/^\s*([-*]|\d+\.)\s+/.test(at(i)) &&
      !/^#{1,6}\s/.test(at(i))
    ) {
      para.push(at(i));
      i++;
    }
    blocks.push(
      <p key={`b${key++}`}>{renderInline(para.join(" "), `p${key}`)}</p>,
    );
  }

  return <div className="space-y-2">{blocks}</div>;
}
