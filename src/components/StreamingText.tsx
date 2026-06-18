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
    let currentIndex = 0;
    setDisplayedText('');

    let timeoutId: any;

    const fullText = textRef.current;
    
    // Smooth character-by-character typing. 
    // Dynamically scale chunk size for large text to ensure it finishes within ~20-30 ticks (~400ms).
    const charsPerTick = Math.max(3, Math.ceil(fullText.length / 30));

    const stream = () => {
      if (currentIndex < fullText.length) {
        currentIndex += charsPerTick;
        setDisplayedText(fullText.slice(0, currentIndex));

        // Auto-scroll the workspace area smoothly and rapidly to follow typing without bouncing
        const scrollContainer = document.getElementById('workspace_container')?.querySelector('.overflow-y-auto');
        if (scrollContainer) {
          scrollContainer.scrollTo({
            top: scrollContainer.scrollHeight,
            behavior: 'auto'
          });
        }

        // Extremely fast typing speed (~8-12ms per frame) for smoother animation
        const delay = 8 + Math.random() * 4; 
        timeoutId = setTimeout(stream, delay);
      } else {
        setDisplayedText(fullText);
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
