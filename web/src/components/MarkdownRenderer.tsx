'use client';

import React, { useState } from 'react';
import { ExternalLink, Check, Copy, CheckSquare, Square } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

/**
 * Parses inline markdown: **bold**, *italic*, `code`, [link](url), ~~strikethrough~~
 */
function renderInline(text: string): React.ReactNode {
  if (!text) return null;

  // Split by link syntax [label](url), bold **text**, code `code`, italic *text*
  const tokens: React.ReactNode[] = [];
  let remaining = text;
  let keyIdx = 0;

  // Regex to match links, bold, code, italic
  const inlineRegex = /(\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|`([^`]+)`|\*([^*]+)\*|~~([^~]+)~~)/;

  while (remaining) {
    const match = remaining.match(inlineRegex);
    if (!match || match.index === undefined) {
      tokens.push(remaining);
      break;
    }

    // Push text before match
    if (match.index > 0) {
      tokens.push(remaining.slice(0, match.index));
    }

    const fullMatch = match[0];

    // 1. Link [label](url)
    if (match[2] && match[3]) {
      const label = match[2];
      const url = match[3];
      tokens.push(
        <a
          key={`link-${keyIdx++}`}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#0047FF] hover:text-blue-800 underline underline-offset-2 font-medium inline-flex items-center gap-0.5 transition-colors"
        >
          <span>{label}</span>
          <ExternalLink className="w-3 h-3 inline shrink-0" />
        </a>
      );
    }
    // 2. Bold **text**
    else if (match[4]) {
      tokens.push(
        <strong key={`b-${keyIdx++}`} className="font-bold text-neutral-900">
          {match[4]}
        </strong>
      );
    }
    // 3. Inline Code `code`
    else if (match[5]) {
      tokens.push(
        <code
          key={`code-${keyIdx++}`}
          className="font-mono text-[11px] sm:text-xs bg-neutral-100 text-[#0047FF] px-1.5 py-0.5 rounded border border-neutral-200/90 font-semibold"
        >
          {match[5]}
        </code>
      );
    }
    // 4. Italic *text*
    else if (match[6]) {
      tokens.push(
        <em key={`em-${keyIdx++}`} className="italic text-neutral-700">
          {match[6]}
        </em>
      );
    }
    // 5. Strikethrough ~~text~~
    else if (match[7]) {
      tokens.push(
        <del key={`del-${keyIdx++}`} className="line-through text-neutral-400">
          {match[7]}
        </del>
      );
    }

    remaining = remaining.slice(match.index + fullMatch.length);
  }

  return <>{tokens}</>;
}

function CodeBlockCard({ code, lang }: { code: string; lang?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-2.5 rounded-xl border border-neutral-200/90 bg-neutral-900 text-neutral-100 overflow-hidden shadow-xs">
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-neutral-800/80 border-b border-neutral-700/80 text-[10px] font-mono uppercase text-neutral-300">
        <span className="font-bold text-[#DFFF4F]">{lang || 'CODE'}</span>
        <button
          onClick={handleCopy}
          className="hover:text-white flex items-center gap-1 transition cursor-pointer"
          title="Copy code"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
      <pre className="p-3.5 text-xs font-mono overflow-x-auto leading-relaxed text-neutral-200">
        <code>{code}</code>
      </pre>
    </div>
  );
}

/**
 * Rich Markdown Renderer:
 * Parses headings without literal hashtags (###), bullet points, bold markers,
 * tables, checklists, code blocks, and links into modern, high-contrast UI.
 */
export function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  if (!content || typeof content !== 'string') return null;

  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;
  let elementKey = 0;

  while (i < lines.length) {
    const rawLine = lines[i];
    const trimmedLine = rawLine.trim();

    // 1. Fenced Code Block: ```lang ... ```
    if (trimmedLine.startsWith('```')) {
      const lang = trimmedLine.replace(/^```/, '').trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing ```
      elements.push(
        <CodeBlockCard
          key={`code-block-${elementKey++}`}
          code={codeLines.join('\n')}
          lang={lang}
        />
      );
      continue;
    }

    // 2. Headings: #, ##, ###, ####
    if (trimmedLine.startsWith('#')) {
      const headingMatch = trimmedLine.match(/^(#{1,6})\s+(.*)$/);
      if (headingMatch) {
        const level = headingMatch[1].length;
        const text = headingMatch[2].trim();

        if (level === 1) {
          elements.push(
            <h1
              key={`h1-${elementKey++}`}
              className="text-base sm:text-lg font-black text-neutral-900 tracking-tight mt-3 mb-1.5 pb-1 border-b border-neutral-100 flex items-center gap-2"
            >
              {renderInline(text)}
            </h1>
          );
        } else if (level === 2) {
          elements.push(
            <h2
              key={`h2-${elementKey++}`}
              className="text-sm sm:text-base font-bold text-neutral-900 tracking-tight mt-2.5 mb-1 flex items-center gap-2"
            >
              {renderInline(text)}
            </h2>
          );
        } else if (level === 3) {
          elements.push(
            <h3
              key={`h3-${elementKey++}`}
              className="text-xs sm:text-sm font-bold text-neutral-900 mt-2 mb-1 flex items-center gap-1.5"
            >
              {renderInline(text)}
            </h3>
          );
        } else {
          elements.push(
            <h4
              key={`h4-${elementKey++}`}
              className="text-xs font-bold text-neutral-700 uppercase tracking-wider mt-1.5 mb-0.5"
            >
              {renderInline(text)}
            </h4>
          );
        }
        i++;
        continue;
      }
    }

    // 3. Blockquote: > text
    if (trimmedLine.startsWith('>')) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        quoteLines.push(lines[i].trim().replace(/^>\s*/, ''));
        i++;
      }
      elements.push(
        <div
          key={`quote-${elementKey++}`}
          className="my-2 border-l-3 border-[#0047FF] bg-blue-50/50 rounded-r-lg px-3 py-2 text-xs text-neutral-700 italic space-y-1"
        >
          {quoteLines.map((ql, qidx) => (
            <p key={qidx}>{renderInline(ql)}</p>
          ))}
        </div>
      );
      continue;
    }

    // 4. Checklist: - [ ] or - [x]
    if (/^[-*]\s*\[[ xX]\]\s*/.test(trimmedLine)) {
      const checklistItems: { checked: boolean; text: string }[] = [];
      while (i < lines.length && /^[-*]\s*\[[ xX]\]\s*/.test(lines[i].trim())) {
        const itemLine = lines[i].trim();
        const isChecked = /^[-*]\s*\[[xX]\]/.test(itemLine);
        const itemText = itemLine.replace(/^[-*]\s*\[[ xX]\]\s*/, '');
        checklistItems.push({ checked: isChecked, text: itemText });
        i++;
      }
      elements.push(
        <div key={`checklist-${elementKey++}`} className="my-2 space-y-1 bg-neutral-50/70 border border-neutral-200/80 rounded-xl p-2.5">
          {checklistItems.map((item, cidx) => (
            <div key={cidx} className="flex items-start gap-2 text-xs text-neutral-800">
              {item.checked ? (
                <CheckSquare className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <Square className="w-3.5 h-3.5 text-neutral-400 shrink-0 mt-0.5" />
              )}
              <span className={item.checked ? 'line-through text-neutral-400' : ''}>
                {renderInline(item.text)}
              </span>
            </div>
          ))}
        </div>
      );
      continue;
    }

    // 5. Unordered Bullet List: - item or * item
    if (/^[-*]\s+/.test(trimmedLine) && !trimmedLine.startsWith('---')) {
      const bulletItems: string[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i].trim()) && !lines[i].trim().startsWith('---')) {
        bulletItems.push(lines[i].trim().replace(/^[-*]\s+/, ''));
        i++;
      }
      elements.push(
        <ul key={`ul-${elementKey++}`} className="my-1.5 space-y-1.5 pl-1">
          {bulletItems.map((item, bidx) => (
            <li key={bidx} className="flex items-start gap-2 text-xs sm:text-sm text-neutral-800 leading-relaxed">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0047FF] mt-2 shrink-0" />
              <div className="flex-1">{renderInline(item)}</div>
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // 6. Numbered List: 1. item
    if (/^\d+\.\s+/.test(trimmedLine)) {
      const numItems: { num: string; text: string }[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        const itemLine = lines[i].trim();
        const numMatch = itemLine.match(/^(\d+)\.\s+(.*)$/);
        if (numMatch) {
          numItems.push({ num: numMatch[1], text: numMatch[2] });
        }
        i++;
      }
      elements.push(
        <ol key={`ol-${elementKey++}`} className="my-1.5 space-y-2 pl-0.5">
          {numItems.map((item, nidx) => (
            <li key={nidx} className="flex items-start gap-2.5 text-xs sm:text-sm text-neutral-800 leading-relaxed">
              <span className="font-mono text-[11px] font-bold text-[#0047FF] bg-blue-50 border border-blue-200/80 rounded-md px-1.5 py-0.2 shrink-0 mt-0.5">
                {item.num}.
              </span>
              <div className="flex-1">{renderInline(item.text)}</div>
            </li>
          ))}
        </ol>
      );
      continue;
    }

    // 7. Horizontal Rule: ---
    if (/^---+$/.test(trimmedLine)) {
      elements.push(<hr key={`hr-${elementKey++}`} className="my-3 border-neutral-200/80" />);
      i++;
      continue;
    }

    // 8. Empty line
    if (!trimmedLine) {
      i++;
      continue;
    }

    // 9. Standard Paragraph
    elements.push(
      <p key={`p-${elementKey++}`} className="text-xs sm:text-sm text-neutral-800 leading-relaxed my-1.5">
        {renderInline(trimmedLine)}
      </p>
    );
    i++;
  }

  return <div className={`markdown-content space-y-1 font-sans ${className}`}>{elements}</div>;
}

