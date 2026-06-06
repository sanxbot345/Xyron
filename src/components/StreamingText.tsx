import { useState, useEffect, useRef } from 'react';
import { MarkdownRenderer } from './MarkdownRenderer';

interface StreamingTextProps {
  text: string;
  onComplete?: () => void;
}

export function StreamingText({ text, onComplete }: StreamingTextProps) {
  const [displayedText, setDisplayedText] = useState('');
  const textRef = useRef(text);
  textRef.current = text;

  useEffect(() => {
    // Split by spaces into word chunks
    const words = textRef.current.split(' ');
    let currentIndex = 0;
    setDisplayedText('');

    let timeoutId: any;

    // Adaptive chunking: small messages scroll fine-grained, 
    // while long scripts scale chunk sizes so rendering finishes in ~35-45 ticks (under 1s).
    // This maintains a constant speed and avoids browser CPU bottlenecks from rendering heavy Markdown repeatedly.
    const targetTicks = 40; 
    const chunkLength = Math.max(2, Math.ceil(words.length / targetTicks));

    const stream = () => {
      if (currentIndex < words.length) {
        const nextWords = words.slice(currentIndex, currentIndex + chunkLength).join(' ');
        setDisplayedText(prev => prev + (prev ? ' ' : '') + nextWords);
        currentIndex += chunkLength;

        // Auto-scroll the workspace area smoothly and rapidly to follow typing without bouncing
        const scrollContainer = document.getElementById('workspace_container')?.querySelector('.overflow-y-auto');
        if (scrollContainer) {
          scrollContainer.scrollTo({
            top: scrollContainer.scrollHeight,
            behavior: 'auto'
          });
        }

        // Fast typing speed (10-20ms)
        const delay = Math.random() * 10 + 10; 
        timeoutId = setTimeout(stream, delay);
      } else {
        setDisplayedText(textRef.current);
        onComplete?.();
        
        // Final smooth scroll adjustment to make sure the complete response fits beautifully
        const scrollContainer = document.getElementById('workspace_container')?.querySelector('.overflow-y-auto');
        if (scrollContainer) {
          setTimeout(() => {
            scrollContainer.scrollTo({
              top: scrollContainer.scrollHeight,
              behavior: 'smooth'
            });
          }, 50);
        }
      }
    };

    stream();

    return () => {
      clearTimeout(timeoutId);
    };
  }, [text, onComplete]);

  return <MarkdownRenderer content={displayedText} />;
}
