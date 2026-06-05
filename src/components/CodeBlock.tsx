import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

interface CodeBlockProps {
  language: string;
  value: string;
}

export function CodeBlock({ language, value }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  return (
    <div className="my-4 overflow-hidden rounded-lg border border-slate-800 bg-slate-950 font-mono text-xs md:text-sm shadow-lg">
      <div className="flex items-center justify-between bg-slate-900/90 px-4 py-2 text-slate-400 border-b border-slate-800/60 select-none">
        <span className="font-semibold tracking-wider text-indigo-400 text-[10px] md:text-xs uppercase">
          {language || 'code'}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 hover:gap-1.5 rounded-md bg-slate-800/80 hover:bg-slate-700 hover:text-white px-2.5 py-1 text-[11px] md:text-xs text-slate-300 transition-all duration-200 active:scale-95 cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 text-emerald-400" />
              <span className="text-emerald-400 font-medium">Selesai disalin</span>
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              <span>Salin Kode</span>
            </>
          )}
        </button>
      </div>
      <div className="overflow-x-auto p-4 text-slate-300 leading-relaxed font-mono">
        <pre className="whitespace-pre">
          <code>{value}</code>
        </pre>
      </div>
    </div>
  );
}
