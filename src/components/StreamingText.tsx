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
    // Elegant typewriter effect: types character groups / small words in very fast, smooth ticks.
    // Splitting by space characters gives a beautiful word-by-word flow that is identical to top-tier AI chat frameworks.
    const words = textRef.current.split(' ');
    let currentIndex = 0;
    setDisplayedText('');

    let timeoutId: any;

    const stream = () => {
      if (currentIndex < words.length) {
        // Smoothly send chunks of 1-2 words at a very snappy rate
        const chunkLength = words[currentIndex].length > 15 ? 1 : 2;
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

        // Varied human-like sub-50ms typing delay
        const delay = Math.random() * 15 + 15; // 15-30ms
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
