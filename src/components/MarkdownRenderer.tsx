import ReactMarkdown from 'react-markdown';
import { CodeBlock } from './CodeBlock';

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div className="max-w-none text-slate-200 text-sm leading-relaxed break-words">
      <ReactMarkdown
        components={{
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const isMultiline = String(children).includes('\n') || match;
            const codeString = String(children).replace(/\n$/, '');

            if (isMultiline) {
              return (
                <CodeBlock
                  language={match ? match[1] : 'code'}
                  value={codeString}
                />
              );
            }

            return (
              <code
                className="bg-slate-900/80 text-pink-400 font-mono text-[11px] md:text-xs px-1.5 py-0.5 rounded border border-slate-800/85"
                {...props}
              >
                {children}
              </code>
            );
          },
          ul({ children }) {
            return <ul className="list-disc pl-6 my-2.5 space-y-1.5 text-slate-300">{children}</ul>;
          },
          ol({ children }) {
            return <ol className="list-decimal pl-6 my-2.5 space-y-1.5 text-slate-300">{children}</ol>;
          },
          li({ children }) {
            return <li className="text-slate-300 leading-relaxed text-xs md:text-sm">{children}</li>;
          },
          h1({ children }) {
            return (
              <h1 className="text-base md:text-lg font-bold text-slate-100 font-display mt-5 mb-2.5 tracking-tight border-b border-slate-800 pb-1 flex items-center gap-2">
                {children}
              </h1>
            );
          },
          h2({ children }) {
            return (
              <h2 className="text-sm md:text-base font-bold text-slate-200 font-display mt-4 mb-2 tracking-tight">
                {children}
              </h2>
            );
          },
          h3({ children }) {
            return (
              <h3 className="text-xs md:text-sm font-semibold text-slate-350 mt-3.5 mb-1.5">
                {children}
              </h3>
            );
          },
          p({ children }) {
            return <p className="text-xs md:text-sm text-slate-300 my-2 leading-relaxed">{children}</p>;
          },
          hr() {
            return <hr className="border-slate-850 my-5" />;
          },
          strong({ children }) {
            return <strong className="font-semibold text-indigo-350">{children}</strong>;
          },
          blockquote({ children }) {
            return (
              <blockquote className="border-l-4 border-indigo-500 bg-indigo-950/20 px-4 py-2.5 my-3 rounded-r italic text-slate-400 text-xs leading-relaxed">
                {children}
              </blockquote>
            );
          },
          table({ children }) {
            return (
              <div className="overflow-x-auto my-4 rounded-xl border border-slate-800 bg-slate-900/30">
                <table className="min-w-full divide-y divide-slate-800 text-xs text-left">
                  {children}
                </table>
              </div>
            );
          },
          thead({ children }) {
            return <thead className="bg-slate-900/90 text-slate-400 uppercase tracking-widest text-[10px]">{children}</thead>;
          },
          tbody({ children }) {
            return <tbody className="divide-y divide-slate-800/60">{children}</tbody>;
          },
          tr({ children }) {
            return <tr className="hover:bg-slate-900/20 transition-colors">{children}</tr>;
          },
          th({ children }) {
            return <th className="px-4 py-2.5 font-bold">{children}</th>;
          },
          td({ children }) {
            return <td className="px-4 py-2.5 text-slate-300 font-mono text-[11px] leading-normal">{children}</td>;
          }
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
