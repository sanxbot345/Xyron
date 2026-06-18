import { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Trash2, 
  Cpu, 
  Code2, 
  ShieldAlert, 
  RefreshCw, 
  BookOpen, 
  Menu, 
  X, 
  ArrowRight,
  Terminal,
  Compass,
  Zap,
  CheckCircle2,
  AlertCircle,
  Plus,
  MessageSquare,
  FileCode,
  Globe,
  Film,
  Mic,
  MicOff,
  ArrowUp,
  Settings,
  Server,
  Coffee,
  Layers,
  Boxes,
  Eye,
  EyeOff,
  Brain
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Message, SuggestionChip, ChatSession } from './types';
import { CHIP_PRESETS, WELCOME_MESSAGE } from './data';
import { MarkdownRenderer } from './components/MarkdownRenderer';
import { StreamingText } from './components/StreamingText';

// Assistant helper functions for deep thinking extraction
function parseThoughtAndContent(text: string) {
  const thinkStartTag = '<think>';
  const thinkEndTag = '</think>';
  
  const startIdx = text.indexOf(thinkStartTag);
  if (startIdx !== -1) {
    const endIdx = text.indexOf(thinkEndTag);
    if (endIdx !== -1) {
      // Completed thinking tag
      const thought = text.substring(startIdx + thinkStartTag.length, endIdx).trim();
      const content = text.substring(endIdx + thinkEndTag.length).trim();
      return { thought, content };
    } else {
      // In progress thinking
      const thought = text.substring(startIdx + thinkStartTag.length).trim();
      return { thought, content: "" };
    }
  }
  
  return { thought: null, content: text };
}

interface StreamingThinkingTextProps {
  text: string;
  onComplete: () => void;
}

function StreamingThinkingText({ text, onComplete }: StreamingThinkingTextProps) {
  const [displayedText, setDisplayedText] = useState('');
  const textRef = useRef(text);
  textRef.current = text;

  useEffect(() => {
    const words = textRef.current.split(' ');
    let currentIndex = 0;
    setDisplayedText('');

    let timeoutId: any;

    const stream = () => {
      if (currentIndex < words.length) {
        // Snappy streaming speed for deep-thinking, typing 2-3 words per tick
        const chunkLength = words[currentIndex].length > 15 ? 1 : 2;
        const nextWords = words.slice(currentIndex, currentIndex + chunkLength).join(' ');
        setDisplayedText(prev => prev + (prev ? ' ' : '') + nextWords);
        currentIndex += chunkLength;

        // Rapid scroll syncing
        const scrollContainer = document.getElementById('workspace_container')?.querySelector('.overflow-y-auto');
        if (scrollContainer) {
          scrollContainer.scrollTo({
            top: scrollContainer.scrollHeight,
            behavior: 'auto'
          });
        }

        const delay = Math.random() * 8 + 8; // super responsive 8-16ms
        timeoutId = setTimeout(stream, delay);
      } else {
        setDisplayedText(textRef.current);
        onComplete();
      }
    };

    stream();

    return () => {
      clearTimeout(timeoutId);
    };
  }, [text, onComplete]);

  return <>{displayedText}</>;
}

interface MessageBubbleContentProps {
  text: string;
  isFluxell: boolean;
  isStreaming?: boolean;
  msgId: string;
  onTypewriterComplete: (id: string) => void;
  isDark: boolean;
}

function MessageBubbleContent({ text, isFluxell, isStreaming, msgId, onTypewriterComplete, isDark }: MessageBubbleContentProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const { thought, content } = parseThoughtAndContent(text ?? "");
  const [thoughtFinished, setThoughtFinished] = useState(false);

  useEffect(() => {
    if (!isStreaming) {
      setThoughtFinished(true);
    } else {
      setThoughtFinished(false);
    }
  }, [isStreaming, text]);

  if (thought !== null) {
    const showThoughtStreaming = isStreaming && !thoughtFinished;
    const showContentStreaming = isStreaming && thoughtFinished;

    return (
      <div className="space-y-3">
        {/* Thought Process Box */}
        <div className={`rounded-xl border transition-all duration-300 overflow-hidden ${
          isDark 
            ? 'border-indigo-500/15 bg-indigo-950/20 shadow-[0_4px_20px_rgba(99,102,241,0.03)]' 
            : 'border-indigo-100/80 bg-indigo-50/15 shadow-[0_4px_16px_rgba(99,102,241,0.02)] border-dashed'
        }`}>
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className={`w-full flex items-center justify-between px-4 py-3 text-xs font-bold transition-all duration-150 select-none cursor-pointer ${
              isDark 
                ? 'text-indigo-300 hover:bg-indigo-950/40' 
                : 'text-indigo-600 hover:bg-indigo-100/40'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Brain className={`h-4 w-4 shrink-0 ${isStreaming && !thoughtFinished ? 'animate-pulse text-indigo-400' : 'text-indigo-500'}`} />
              <span className="tracking-wide">
                {isStreaming && !thoughtFinished ? "Sedang Berpikir..." : "Proses Berpikir"}
              </span>
            </div>
            <div className="flex items-center gap-1.5 opacity-80">
              <span className="text-[10px] font-semibold font-sans">
                {isExpanded ? "Sembunyikan" : "Tampilkan"}
              </span>
              <motion.span
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                className="text-[9px]"
              >
                ▼
              </motion.span>
            </div>
          </button>
          
          <AnimatePresence initial={true}>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className={`px-4 pb-3.5 border-t ${
                  isDark ? 'border-indigo-950/60' : 'border-indigo-100/50'
                }`}
              >
                <div 
                  id={`thought-${msgId}`} 
                  className={`text-xs leading-relaxed font-mono whitespace-pre-wrap select-text pt-3 max-h-60 overflow-y-auto scrollbar-thin border-l-2 pl-3 ${
                    isDark 
                      ? 'text-indigo-200/60 border-indigo-500/15' 
                      : 'text-indigo-805/65 border-indigo-400/20'
                  }`}
                >
                  {showThoughtStreaming ? (
                    <StreamingThinkingText 
                      text={thought} 
                      onComplete={() => {
                        setThoughtFinished(true);
                        if (!content) {
                          onTypewriterComplete(msgId);
                        }
                      }} 
                    />
                  ) : (
                    thought
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Real response content after thinking */}
        {content && (
          showContentStreaming ? (
            <StreamingText 
              text={content} 
              onComplete={() => onTypewriterComplete(msgId)} 
            />
          ) : (
            !showThoughtStreaming && <MarkdownRenderer content={content} />
          )
        )}
      </div>
    );
  }

  // Fallback if no thought block is present
  return isFluxell ? (
    isStreaming ? (
      <StreamingText 
        text={text} 
        onComplete={() => onTypewriterComplete(msgId)} 
      />
    ) : (
      <MarkdownRenderer content={text} />
    )
  ) : (
    <p className="text-xs md:text-sm whitespace-pre-wrap leading-relaxed select-text font-medium">{text}</p>
  );
}

// Helper to convert browser File objects to Base64 data string
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const base64Data = result.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = error => reject(error);
  });
};

export default function App() {
  // Multi-session chat history state setup
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    const saved = localStorage.getItem('xyron_sessions_v9');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.length > 0) {
          // Reset isStreaming flag on all messages during reload to prevent typing animation repeat
          const sanitized = parsed.map((s: ChatSession) => ({
            ...s,
            messages: s.messages.map(m => m.isStreaming ? { ...m, isStreaming: false } : m)
          }));
          return sanitized;
        }
      } catch (e) {
        console.error('Failed to parse sessions v9', e);
      }
    }
    // Backward compatibility conversion:
    const oldHistory = localStorage.getItem('xyron_chat_history');
    let initialMessages: Message[] = [
      {
        id: 'welcome',
        sender: 'fluxell',
        text: WELCOME_MESSAGE,
        timestamp: Date.now()
      }
    ];
    if (oldHistory) {
      try {
        const parsedOld = JSON.parse(oldHistory);
        if (parsedOld && parsedOld.length > 0) {
          initialMessages = parsedOld;
        }
      } catch (e) {}
    }

    const defaultSession: ChatSession = {
      id: 'session-default',
      title: 'Obrolan Baru',
      messages: initialMessages,
      timestamp: Date.now()
    };
    return [defaultSession];
  });

  const [activeSessionId, setActiveSessionId] = useState<string>(() => {
    const savedActive = localStorage.getItem('xyron_active_session_id_v9');
    if (savedActive) return savedActive;
    return 'session-default';
  });

  const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0];
  const messages = activeSession ? activeSession.messages : [];

  const setMessages = (newMessages: Message[] | ((prev: Message[]) => Message[])) => {
    setSessions(prevSessions => {
      return prevSessions.map(s => {
        if (s.id === activeSessionId) {
          const resolvedMessages = typeof newMessages === 'function' ? newMessages(s.messages) : newMessages;
          
          let newTitle = s.title;
          if (s.title === 'Obrolan Baru' || s.title === 'New Chat' || s.title === 'Percakapan Kosong' || !s.title || s.title.trim() === '') {
            const firstUserMsg = resolvedMessages.find(m => m.sender === 'user');
            if (firstUserMsg) {
              newTitle = firstUserMsg.text.length > 25 
                ? firstUserMsg.text.substring(0, 25).trim() + '...'
                : firstUserMsg.text;
            }
          }

          return {
            ...s,
            messages: resolvedMessages,
            title: newTitle,
            timestamp: Date.now()
          };
        }
        return s;
      });
    });
  };

  const createNewSession = () => {
    // Prevent creating multiple empty sessions: if current is already empty, just close sidebar and keep it active
    const currentIsNew = activeSession && !activeSession.messages.some(m => m.sender === 'user');
    if (currentIsNew) {
      setShowSidebar(false);
      return;
    }

    // Clean up any other existing empty sessions (except active) when creating a new session
    const cleanedSessions = sessions.filter(s => s.messages.some(m => m.sender === 'user') || s.id === activeSessionId);

    const newSessionId = `session-${Date.now()}`;
    const newSession: ChatSession = {
      id: newSessionId,
      title: 'Obrolan Baru',
      messages: [
        {
          id: 'welcome',
          sender: 'xyron',
          text: WELCOME_MESSAGE,
          timestamp: Date.now()
        }
      ],
      timestamp: Date.now()
    };
    setSessions([newSession, ...cleanedSessions]);
    setActiveSessionId(newSessionId);
    setShowSidebar(false);
  };

  const deleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setShowSidebar(false);
    
    const newSessionId = `session-${Date.now()}`;
    const newSession: ChatSession = {
      id: newSessionId,
      title: 'Obrolan Baru',
      messages: [
        {
          id: 'welcome',
          sender: 'xyron',
          text: WELCOME_MESSAGE,
          timestamp: Date.now()
        }
      ],
      timestamp: Date.now()
    };

    const filtered = sessions.filter(s => s.id !== sessionId);
    const activeAndFilled = filtered.filter(s => s.messages.some(m => m.sender === 'user'));

    if (sessions.length <= 1) {
      setSessions([newSession]);
      setActiveSessionId(newSessionId);
      return;
    }
    
    if (activeSessionId === sessionId) {
      setSessions([newSession, ...activeAndFilled]);
      setActiveSessionId(newSessionId);
    } else {
      const cleaned = filtered.filter(s => s.messages.some(m => m.sender === 'user') || s.id === activeSessionId);
      if (cleaned.length === 0) {
        setSessions([newSession]);
        setActiveSessionId(newSessionId);
      } else {
        setSessions(cleaned);
      }
    }
  };

  const [firebaseStatus] = useState<{ firebaseConnected: boolean; hasConfig: boolean }>({
    firebaseConnected: false,
    hasConfig: false
  });

  // Sync sessions to localStorage (fully local and isolated per device)
  useEffect(() => {
    localStorage.setItem('xyron_sessions_v9', JSON.stringify(sessions));
  }, [sessions]);

  // Sync activeSessionId to localStorage
  useEffect(() => {
    localStorage.setItem('xyron_active_session_id_v9', activeSessionId);
  }, [activeSessionId]);

  // Disable copying, cutting, and text dragging to protect all text content
  useEffect(() => {
    const handleCopyCut = (e: ClipboardEvent) => {
      e.preventDefault();
    };

    const handleDragStart = (e: DragEvent) => {
      const target = e.target as HTMLElement;
      if (target && !target.closest('input') && !target.closest('textarea')) {
        e.preventDefault();
      }
    };

    document.addEventListener('copy', handleCopyCut);
    document.addEventListener('cut', handleCopyCut);
    document.addEventListener('dragstart', handleDragStart);

    return () => {
      document.removeEventListener('copy', handleCopyCut);
      document.removeEventListener('cut', handleCopyCut);
      document.removeEventListener('dragstart', handleDragStart);
    };
  }, []);

  const [inputText, setInputText] = useState('');
  const [isPending, setIsPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showSidebar, setShowSidebar] = useState(false);
  const [deleteOverlaySessionId, setDeleteOverlaySessionId] = useState<string | null>(null);

  // Plus menu overlay, attachments, and thinking states
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [lastSentFile, setLastSentFile] = useState<File | null>(null);
  const [thinkingModel, setThinkingModel] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [aiMode, setAiMode] = useState<'fast' | 'code'>('fast');
  
  // Theme and Settings State
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [customApiKey, setCustomApiKey] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('fluxell_custom_api_key') || '';
    }
    return '';
  });
  const [showApiKeyPlain, setShowApiKeyPlain] = useState(false);
  const [theme, setTheme] = useState<'default' | 'light' | 'dark'>(() => {
    // Force set 'dark' in localStorage to migrate any existing light-mode settings
    if (typeof window !== 'undefined') {
      localStorage.setItem('fluxell_theme', 'dark');
    }
    return 'dark';
  });
  
  const [systemIsDark, setSystemIsDark] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = (e: MediaQueryListEvent) => {
      setSystemIsDark(e.matches);
    };
    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, []);

  const isDark = true; // Always absolute black/dark AI theme as requested

  useEffect(() => {
    localStorage.setItem('fluxell_theme', 'dark');
  }, [theme]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  const toggleListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setErrorMessage('Browser Anda tidak mendukung fitur Voice-to-Text secara langsung. Silakan gunakan Google Chrome atau Safari.');
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    } else {
      setErrorMessage(null); // Clear any previous error before starting
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'id-ID';

      rec.onstart = () => {
        setIsListening(true);
      };

      rec.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'aborted') {
          // Silent cancel/aborted state, do not display error message
          return;
        }
        if (event.error === 'not-allowed') {
          setErrorMessage('Microphone access blocked. Please grant microphone permissions to this application/tab in your browser, or open in a new tab.');
        } else {
          setErrorMessage(`Failed to process voice: ${event.error || 'System error occurred'}`);
        }
      };

      rec.onend = () => {
        setIsListening(false);
      };

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInputText(prev => {
            const trimmedPrev = prev.trim();
            return trimmedPrev ? `${trimmedPrev} ${transcript}` : transcript;
          });
        }
      };

      recognitionRef.current = rec;
      try {
        rec.start();
      } catch (err) {
        console.error('Error starting recognition:', err);
        setErrorMessage('Failed to start speech recorder. Please try again.');
      }
    }
  };

  // Close plus menu when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const container = document.getElementById('plus_menu_container');
      if (container && !container.contains(e.target as Node)) {
        setShowPlusMenu(false);
      }
    };

    if (showPlusMenu) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [showPlusMenu]);

  const handleFileClick = () => {
    fileInputRef.current?.click();
    setShowPlusMenu(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAttachedFile(e.target.files[0]);
    }
  };

  const toggleThinking = () => {
    setThinkingModel(!thinkingModel);
    setShowPlusMenu(false);
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync scroll on new messages or typing state changes instantly (no smooth-scroll feedback collision)
  useEffect(() => {
    if (messages.length > 1 || isPending) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
    }
  }, [messages, isPending]);

  // Handle textarea autosize
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [inputText]);

  const handleInputFocus = () => {
    // Keep focus natural without forcing the whole chat to jump
    // the layout's 100dvh constraint will naturally shrink to reveal input.
  };

  const handleSendMessage = async (customText?: string, customFile?: File | null) => {
    const fileForPrompt = customFile !== undefined ? customFile : attachedFile;
    const textToSend = customText !== undefined ? customText.trim() : inputText.trim();
    if ((!textToSend && !fileForPrompt) || isPending) return;

    setErrorMessage(null);
    if (customText === undefined) {
      setInputText('');
    }

    // Capture file attachment details and set lastSentFile for retry reference
    setLastSentFile(fileForPrompt);
    setAttachedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    // Prepare preview properties for Message visual bubble render
    let attachmentUrl: string | undefined = undefined;
    if (fileForPrompt) {
      try {
        if (fileForPrompt.type.startsWith('image/') || fileForPrompt.type.startsWith('video/') || fileForPrompt.type.startsWith('audio/')) {
          attachmentUrl = URL.createObjectURL(fileForPrompt);
        }
      } catch (e) {
        console.error('Failed to create Object URL:', e);
      }
    }

    const userMessageId = `user-${Date.now()}`;
    const userMsg: Message = {
      id: userMessageId,
      sender: 'user',
      text: textToSend || (fileForPrompt ? `Menganalisis file: ${fileForPrompt.name}` : ''),
      timestamp: Date.now(),
      attachmentUrl,
      attachmentName: fileForPrompt ? fileForPrompt.name : undefined,
      attachmentType: fileForPrompt ? fileForPrompt.type : undefined
    };

    // Update UI immediately with user message
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setIsPending(true);

    // Decorate prompt with system directives depending on active modes
    let modifiedPrompt = textToSend || (fileForPrompt ? `Review and analyze the attached file: ${fileForPrompt.name}` : '');
    
    if (aiMode === 'code') {
      modifiedPrompt += "\n\n[SYSTEM CODE MODE: User has enabled Code & Smart Analysis Mode. Provide ultra-clean code solutions, write deep architectural reviews, perform a comprehensive analysis, ensure the logic is bug-free, and explain the syntax in a detailed, structured, and professional manner.]";
    } else if (aiMode === 'fast') {
      modifiedPrompt += "\n\n[SYSTEM FAST MODE: User has enabled Fast Mode. Provide a super concise, rapid, and to-the-point answer. Eliminate any verbose explanations so the response renders instantly.]";
    }

    if (thinkingModel) {
      modifiedPrompt += "\n\n[SYSTEM: Enable deep thinking mode. Before giving your final answer, you MUST detail your logical analysis, structural considerations, and step-by-step reasoning inside a `<think>...</think>` block at the beginning of your response. Keep it structured and comprehensive like a true reasoning model.]";
    }
    if (fileForPrompt) {
      modifiedPrompt += `\n\n[SYSTEM: Attached user document/file is named "${fileForPrompt.name}" (${(fileForPrompt.size / 1024).toFixed(1)} KB) of type "${fileForPrompt.type || 'unknown'}". Seamlessly integrate the relevant context of this file/document into your architectural explanation.]`;
    }

    try {
      // Convert file to Base64 to send to back-end
      let fileDataPayload = null;
      if (fileForPrompt) {
        try {
          const base64Data = await fileToBase64(fileForPrompt);
          fileDataPayload = {
            name: fileForPrompt.name,
            mimeType: fileForPrompt.type || 'application/octet-stream',
            data: base64Data
          };
        } catch (fileErr) {
          console.error("Failed to convert file to Base64:", fileErr);
        }
      }

      const response = await fetch('/api/fluxell/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: modifiedPrompt,
          // Exclude the last message from history as it's sent as 'message' parameter
          history: messages.slice(1), // skip the welcome greeting to keep context clean
          thinking: thinkingModel,
          aiMode: aiMode,
          fileData: fileDataPayload,
          customApiKey: customApiKey || undefined
        })
      });

      let data;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) {
        data = await response.json();
      } else {
        const textResponse = await response.text();
        console.error("Non-JSON Response:", textResponse);
        throw new Error("Server returned an invalid format. High demand or traffic congestion is active (503).");
      }

      if (!response.ok) {
        throw new Error(data?.error || 'A system error occurred while contacting Fluxel.');
      }

      const fluxellMsg: Message = {
        id: `fluxell-${Date.now()}`,
        sender: 'fluxell',
        text: data.text,
        timestamp: Date.now(),
        isStreaming: true,
        sources: data.sources
      };

      setMessages(prev => [...prev, fluxellMsg]);

    } catch (error: any) {
      console.error('Chat error:', error);
      setErrorMessage(error.message || 'Connection lost. Please check your internet connection or try again in a few moments.');
      
      const errorMsg: Message = {
        id: `error-${Date.now()}`,
        sender: 'fluxell',
        text: `⚠️ **Failed to load response**\n\n${error.message || 'Failed to connect to the Fluxel core server.'}\n\n*Please try sending your message again.*`,
        timestamp: Date.now(),
        isError: true
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsPending(false);
    }
  };

  const handleTypewriterComplete = (msgId: string) => {
    setMessages(prev => 
      prev.map(m => m.id === msgId ? { ...m, isStreaming: false } : m)
    );
  };

  const clearChatHistory = () => {
    if (window.confirm('Are you sure you want to clear your entire chat history with Fluxel?')) {
      const initialChat: Message[] = [
        {
          id: 'welcome',
          sender: 'fluxell',
          text: WELCOME_MESSAGE,
          timestamp: Date.now()
        }
      ];
      setMessages(initialChat);
      localStorage.setItem('xyron_chat_history', JSON.stringify(initialChat));
      setErrorMessage(null);
    }
  };

  const handleRetry = () => {
    const userMsgs = messages.filter(m => m.sender === 'user');
    if (userMsgs.length > 0) {
      const lastUserMsg = userMsgs[userMsgs.length - 1];
      setMessages(prev => prev.filter(m => !m.isError));
      setErrorMessage(null);
      handleSendMessage(lastUserMsg.text, lastSentFile);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const categories = [
    { value: 'all', label: 'All Features' },
    { value: 'programming', label: 'Programming' },
    { value: 'debugging', label: 'Debugging' },
    { value: 'architecture', label: 'Architecture' },
    { value: 'education', label: 'Education' },
    { value: 'bot', label: 'Bots & APIs' }
  ];

  const filteredChips = selectedCategory === 'all' 
    ? CHIP_PRESETS 
    : CHIP_PRESETS.filter(chip => chip.category === selectedCategory);

  return (
    <div className={`flex relative h-full w-full transition-colors duration-300 font-sans overflow-hidden ${
      isDark ? 'bg-black text-[#f1f5f9]' : 'bg-[#f8fafc] text-slate-800'
    }`} id="app_root">
      
      {/* 1. SIDEBAR PANEL (Desktop & Collapsible Mobile Grid) */}
      <aside 
        id="side_panel"
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col transition-all duration-300 xl:translate-x-0 xl:static xl:flex ${
          showSidebar ? 'translate-x-0' : '-translate-x-full'
        } ${
          isDark ? 'border-r border-neutral-900 bg-black' : 'border-r border-slate-200 bg-slate-100 text-slate-900'
        }`}
      >
        {/* Sidebar Header */}
        <div className={`flex h-20 xl:h-16 items-center justify-between px-6 pt-5 xl:pt-0 transition-colors duration-300 ${
          isDark ? 'bg-black' : 'bg-slate-100'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 overflow-hidden items-center justify-center rounded-xl border shadow-sm transition-colors ${
              isDark ? 'border-neutral-900 bg-zinc-950' : 'border-slate-200 bg-white shadow-xs'
            }`}>
              <img 
                src="/favicon.jpg" 
                alt="Fluxel Logo" 
                className="h-full w-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <h1 className={`font-display text-lg font-bold tracking-tight flex items-center gap-1.5 font-sans transition-colors ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>
                Fluxel
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </h1>
              <p className={`text-[10px] uppercase tracking-wider font-semibold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Professional AI</p>
            </div>
          </div>
          <button 
            onClick={() => setShowSidebar(false)} 
            className={`rounded-lg p-1.5 transition-colors xl:hidden cursor-pointer ${
              isDark ? 'text-slate-400 hover:bg-slate-900 hover:text-white' : 'text-slate-500 hover:bg-slate-200 hover:text-slate-900'
            }`}
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Sidebar Body */}
        <div className="flex-grow flex flex-col min-h-0">
          {/* Obrolan Baru (New Chat Button) */}
          <div className={`p-4 border-b shrink-0 transition-colors ${
            isDark ? 'border-slate-950' : 'border-slate-200 bg-slate-100/10'
          }`}>
            <button
              onClick={createNewSession}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-550 text-white shadow-md shadow-indigo-600/10 px-4 py-2.5 text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer active:scale-98 select-none"
            >
              <Plus className="h-4 w-4 shrink-0" />
              <span>New Chat</span>
            </button>
          </div>

          {/* Session List */}
          <div className="flex-1 overflow-y-auto px-2 py-4 space-y-1.5 scrollbar-thin scrollbar-transparent">
            <div className="px-3 mb-2 shrink-0">
              <span className={`text-[10px] font-extrabold uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Chat History</span>
            </div>

            {sessions.filter(s => s.messages.some(m => m.sender === 'user')).map(s => {
              const isActive = s.id === activeSessionId;
              return (
                <div
                  key={s.id}
                  onClick={() => {
                    setActiveSessionId(s.id);
                    setShowSidebar(false); // Close sidebar on mobile select
                  }}
                  className={`group relative flex items-center justify-between gap-1 rounded-xl px-3 py-1.5 text-xs font-medium transition-all duration-200 cursor-pointer border select-none overflow-hidden ${
                    isActive
                      ? isDark 
                        ? 'bg-slate-900/80 text-white border-slate-800 shadow-sm shadow-slate-950/40'
                        : 'bg-white text-indigo-950 border-slate-200 shadow-[0_1px_3px_rgba(15,23,42,0.04)] font-bold'
                      : isDark
                        ? 'bg-transparent text-slate-400 hover:bg-slate-900/30 hover:text-slate-200 border-transparent'
                        : 'bg-transparent text-slate-600 hover:bg-slate-200 hover:text-slate-950 border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1 py-1">
                    <MessageSquare className={`h-4 w-4 shrink-0 transition-colors ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                    <span className="truncate leading-none font-sans font-medium">{s.title}</span>
                  </div>
                  {/* Redundant trash bin element always visible for mobile / desktop hover */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteOverlaySessionId(s.id);
                    }}
                    className={`p-1.5 rounded-lg transition-all cursor-pointer relative z-10 shrink-0 ${
                      isDark 
                        ? 'hover:bg-red-950/30 hover:text-red-400 text-slate-500' 
                        : 'hover:bg-red-50 hover:text-red-600 text-slate-400 hover:text-red-600 font-bold'
                    }`}
                    title="Delete Chat"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>

                  {deleteOverlaySessionId === s.id && (
                    <div 
                      className={`absolute inset-0 z-25 flex items-center justify-between px-3 rounded-xl transition-all duration-200 border ${
                        isDark 
                          ? 'bg-red-950 border-red-800 text-red-100' 
                          : 'bg-red-50 border-red-200 text-red-900'
                      }`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span className="font-semibold text-xs truncate max-w-[100px] sm:max-w-none">Delete?</span>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteSession(s.id, e);
                            setDeleteOverlaySessionId(null);
                          }}
                          className="px-2 py-1 rounded-md bg-red-600 hover:bg-red-500 text-white font-bold text-[10px] sm:text-xs shadow-xs transition-all active:scale-95 cursor-pointer"
                        >
                          Delete
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteOverlaySessionId(null);
                          }}
                          className={`p-1 rounded-md transition-colors cursor-pointer ${
                            isDark ? 'hover:bg-red-900/40 text-red-400' : 'hover:bg-red-100 text-red-700'
                          }`}
                          title="Keep Chat"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>


        </div>
      </aside>

      {/* Backdrop for mobile active sidebar */}
      {showSidebar && (
        <div 
          onClick={() => setShowSidebar(false)}
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-xs xl:hidden"
        />
      )}

      {/* 2. CHAT WORKSPACE */}
      <main 
        className={`flex flex-1 flex-col h-full relative overflow-hidden transition-colors duration-300 ${
          isDark ? 'bg-black' : 'bg-slate-50'
        }`} 
        id="workspace_container"
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setIsDragging(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setAttachedFile(e.dataTransfer.files[0]);
          }
        }}
      >
        
        {/* Top Header Bar with Typewriter Fluxell Accent */}
        <header className={`flex h-16 items-center justify-between px-4 sm:px-6 border-b backdrop-blur-md select-none shrink-0 z-10 transition-colors duration-300 ${
          isDark ? 'border-neutral-900 bg-black/60' : 'border-slate-200 bg-white/70 shadow-xs'
        }`}>
          <div className="flex items-center gap-3">
            {/* Sidebar toggle button inside the header */}
            <button
               onClick={() => setShowSidebar(prev => !prev)}
              className={`p-2 -ml-2 rounded-xl transition-all cursor-pointer relative ${
                isDark ? 'text-slate-400 hover:bg-slate-950 hover:text-white' : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
              title={showSidebar ? "Close Menu" : "Open Menu"}
            >
              <Menu className="h-5 w-5" />
            </button>
            
            {/* Logo next to header name and Header Text Fluxell grouped closer */}
            <div className="flex items-center gap-1.5 ml-0.5">
              <div className={`flex h-8 w-8 overflow-hidden items-center justify-center rounded-lg border shadow-xs transition-colors ${
                isDark ? 'border-neutral-900 bg-black' : 'border-slate-200 bg-white'
              }`}>
                <img 
                  src="/favicon.jpg" 
                  alt="Fluxel Logo" 
                  className="h-full w-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              
              {/* Header Text Fluxell without animated cursor */}
              <div className="flex items-center gap-1.5">
                <span className={`font-sans font-extrabold text-sm sm:text-base tracking-tight flex items-center min-w-fit transition-colors ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}>
                  {Array.from("Fluxel").map((char, index) => (
                    <motion.span
                      key={`${activeSessionId}-${index}`}
                      initial={{ opacity: 0, scale: 0.6, filter: 'blur(3px)' }}
                      animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                      transition={{
                        duration: 0.3,
                        delay: index * 0.12,
                        ease: "easeOut"
                      }}
                    >
                      {char}
                    </motion.span>
                  ))}
                </span>
                
                {/* Pulse status indicator */}
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </div>
            </div>
          </div>
        </header>
        
        {/* Drag and drop overlay portal */}
        <AnimatePresence>
          {isDragging && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/95 backdrop-blur-md border-[2px] border-dashed border-indigo-500/40 m-4 rounded-3xl"
            >
              <div className="flex flex-col items-center gap-4 text-center p-6 select-none max-w-sm">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-455 border border-indigo-500/20 animate-bounce">
                  <FileCode className="h-7 w-7" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100 mb-1">Drop Your File Here</h3>
                  <p className="text-[11px] leading-relaxed text-slate-450">
                    Fluxel will automatically attach this file, document, image, or code to your chat session.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
 
        {/* Workspace Messages Area */}
        <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6 space-y-6">
          <AnimatePresence initial={false}>
            
            {/* Minimalist Welcome Screen resembling Claude AI when chat is empty / initial */}
            {messages.length <= 1 ? (
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                className="max-w-2xl mx-auto py-4 sm:py-12 md:py-16 text-center space-y-6 sm:space-y-8 px-4"
              >
                {/* Brand Logo & Name under logo */}
                <div className="flex flex-col items-center justify-center space-y-3 mb-2">
                  <div className={`relative h-20 w-20 overflow-hidden rounded-[24px] border shadow-2xl p-1 shrink-0 transition-colors ${
                    isDark ? 'bg-black border-slate-800' : 'bg-white border-slate-150'
                  }`}>
                    <img
                      src="/favicon.jpg"
                      alt="Fluxel"
                      className="h-full w-full rounded-[20px] object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <h1 className={`font-display text-2xl font-black tracking-[0.25em] transition-colors ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}>
                    FLUXEL
                  </h1>
                </div>

                {/* Minimalist typography header */}
                <div className="space-y-3">
                  <h2 className={`font-display text-xl sm:text-3xl font-extrabold tracking-tight bg-clip-text text-transparent flex flex-wrap justify-center gap-x-[0.25em] gap-y-1 transition-all ${
                    isDark ? 'bg-gradient-to-r from-white via-slate-100 to-slate-400' : 'bg-gradient-to-r from-slate-900 via-slate-700 to-indigo-950'
                  }`}>
                    {"I am Fluxel, how can I help you today?".split(" ").map((word, wIdx) => (
                      <motion.span
                        key={wIdx}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ 
                          opacity: [0, 1, 1, 0],
                          y: [8, 0, 0, -4]
                        }}
                        transition={{
                          duration: 4.5,
                          repeat: Infinity,
                          repeatType: "loop",
                          delay: wIdx * 0.12,
                          times: [0, 0.08, 0.88, 1],
                          ease: "easeInOut"
                        }}
                        className="inline-block"
                      >
                        {word}
                      </motion.span>
                    ))}
                  </h2>
                  <p className={`text-[11px] sm:text-xs max-w-lg mx-auto font-medium leading-relaxed flex flex-wrap justify-center gap-x-[0.25em] gap-y-1 transition-colors ${
                    isDark ? 'text-slate-400' : 'text-slate-600'
                  }`}>
                    {"A smart AI assistant ready to help you design systems, write code, debug errors, and write scripts in any programming language instantly.".split(" ").map((word, wIdx) => (
                      <motion.span
                        key={wIdx}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          duration: 0.25,
                          delay: 0.4 + (wIdx * 0.025),
                          ease: "easeOut"
                        }}
                        className="inline-block"
                      >
                        {word}
                      </motion.span>
                    ))}
                  </p>
                </div>

                {/* Modular Language Script Assistant Showcase Grid */}
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.15, duration: 0.4 }}
                  className={`space-y-4 max-w-xl mx-auto pt-6 border-t transition-colors ${
                    isDark ? 'border-neutral-900/60' : 'border-slate-150'
                  }`}
                >
                  <p className={`text-[10px] font-bold uppercase tracking-widest font-mono ${
                    isDark ? 'text-slate-500' : 'text-slate-450'
                  }`}>
                    Select a programming language to start writing scripts:
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {[
                      { name: 'PHP', prompt: 'I need a PHP script for ', icon: Server, imageUrl: '/php.png', color: 'text-indigo-400 group-hover:text-indigo-300' },
                      { name: 'JavaScript', prompt: 'Please write a JavaScript script for ', icon: Code2, imageUrl: '/javascript.png', color: 'text-yellow-500 group-hover:text-yellow-650' },
                      { name: 'Python', prompt: 'I want a Python script for ', icon: Terminal, imageUrl: '/python.png', color: 'text-blue-500 group-hover:text-blue-600' },
                      { name: 'C++', prompt: 'Please build a C++ script for ', icon: Cpu, imageUrl: '/cpp.png', color: 'text-rose-500 group-hover:text-rose-600' },
                      { name: 'HTML & CSS', prompt: 'Design and code an HTML & CSS layout for ', icon: Layers, imageUrl: '/html.png', color: 'text-cyan-500 group-hover:text-cyan-650' },
                      { name: 'Java', prompt: 'Please create a Java script for ', icon: Coffee, imageUrl: '/java.jpg', color: 'text-amber-605 group-hover:text-amber-500' },
                      { name: 'Others', prompt: 'Help me write a script in ', icon: Boxes, imageUrl: '/others.jpg', color: 'text-emerald-500 group-hover:text-emerald-600' },
                    ].map((lang, idx) => {
                      const IconComponent = lang.icon;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setInputText(lang.prompt)}
                          className={`group relative flex flex-col items-center justify-center rounded-xl border transition-all duration-200 cursor-pointer select-none active:scale-97 p-4 text-center ${
                            isDark 
                              ? 'border-neutral-900 bg-black/80 hover:border-indigo-950/70 hover:bg-[#070709]' 
                              : 'border-slate-200 bg-white hover:border-indigo-200/60 hover:bg-slate-50/70 hover:shadow-sm'
                          }`}
                        >
                          <div className={`h-10 w-10 rounded-lg mb-2 border transition-all duration-200 flex items-center justify-center overflow-hidden shrink-0 ${
                            lang.imageUrl ? 'p-0' : 'p-2'
                          } ${
                            isDark 
                              ? 'bg-neutral-950/50 border-neutral-900/50 group-hover:bg-indigo-950/20 group-hover:border-indigo-950/45' 
                              : 'bg-slate-50/70 border-slate-150/70 group-hover:bg-indigo-50/50 group-hover:border-indigo-200/50'
                          }`}>
                            {lang.imageUrl ? (
                              <img 
                                src={lang.imageUrl} 
                                alt={lang.name} 
                                className="h-full w-full object-cover rounded-md"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <IconComponent className={`h-5 w-5 ${lang.color}`} />
                            )}
                          </div>
                          <span className={`text-xs font-bold font-sans transition-colors duration-150 ${
                            isDark ? 'text-slate-200 group-hover:text-indigo-400' : 'text-slate-800 group-hover:text-indigo-600'
                          }`}>
                            {lang.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              </motion.div>
            ) : (
              // Chat conversation timeline
              <div className="max-w-3xl mx-auto space-y-6">
                {messages.map((msg, index) => {
                  // Skip displaying the default welcome greeting in the timeline to keep it very elegant
                  if (msg.id === 'welcome') return null;
 
                  const isFluxell = msg.sender === 'xenova' || msg.sender === 'xyron' || msg.sender === 'fluxell';
                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.28, ease: 'easeOut' }}
                      className={`flex w-full ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      {/* Content Bubble container - Full Screen on mobile for AI, shrink-to-fit for user */}
                      <div 
                        className={`rounded-[18px] px-4 py-3 shadow-sm transition-colors duration-300 ${
                          !isFluxell 
                            ? 'w-auto max-w-[85%] sm:max-w-[70%] bg-red-600 text-white rounded-tr-xs selection:bg-red-100 selection:text-red-900 shadow-sm shadow-red-950/20' 
                            : msg.isError 
                              ? isDark
                                ? 'w-fit min-w-[60px] max-w-full sm:max-w-[85%] bg-red-950/20 border border-red-900/30 rounded-tl-xs'
                                : 'w-fit min-w-[60px] max-w-full sm:max-w-[85%] bg-red-50 border border-red-250/70 text-red-950 rounded-tl-xs'
                              : isDark
                                ? 'w-fit min-w-[60px] max-w-full sm:max-w-[85%] bg-[#0a0a0c] border border-zinc-900/80 rounded-tl-xs shadow-sm'
                                : 'w-fit min-w-[60px] max-w-full sm:max-w-[85%] bg-white border border-slate-200/80 text-slate-800 rounded-tl-xs shadow-[0_1.5px_4px_rgba(15,23,42,0.025)]'
                        }`}
                      >
                        {/* User Attachment Render */}
                        {!isFluxell && (msg.attachmentName || msg.attachmentUrl) && (
                          <div className="mb-3 rounded-xl bg-slate-950/40 p-2 border border-white/5 flex items-center gap-2.5 max-w-full select-none">
                            {msg.attachmentType?.startsWith('image/') && msg.attachmentUrl ? (
                              <div className="relative h-11 w-11 overflow-hidden rounded-lg bg-black/50 border border-white/10 shrink-0">
                                <img src={msg.attachmentUrl} alt="Preview" className="h-full w-full object-cover" />
                              </div>
                            ) : msg.attachmentType?.startsWith('video/') && msg.attachmentUrl ? (
                              <div className="relative h-11 w-11 overflow-hidden rounded-lg bg-black/50 border border-white/10 shrink-0 flex items-center justify-center">
                                <video src={msg.attachmentUrl} className="h-full w-full object-cover" preload="metadata" />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                  <Film className="h-3.5 w-3.5 text-white/90" />
                                </div>
                              </div>
                            ) : (
                              <div className="h-11 w-11 overflow-hidden rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-white/85">
                                <FileCode className="h-5 w-5" />
                              </div>
                            )}
                            <div className="min-w-0 flex-1 leading-tight">
                              <p className="text-[10.5px] font-bold truncate text-white">{msg.attachmentName}</p>
                              <p className="text-[8.5px] text-white/60 font-mono tracking-tight uppercase mt-0.5">{msg.attachmentType || 'File'}</p>
                            </div>
                          </div>
                        )}
 
                        {/* Core Response */}
                        <MessageBubbleContent
                          text={msg.text}
                          isFluxell={isFluxell}
                          isStreaming={msg.isStreaming}
                          msgId={msg.id}
                          onTypewriterComplete={handleTypewriterComplete}
                          isDark={isDark}
                        />
 
                        {msg.isError && (
                          <div className="mt-4 pt-3.5 border-t border-red-950/40 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between select-none">
                            <span className="text-[11px] text-red-400 font-semibold leading-relaxed">
                              {"Quota exceeded? Please wait a few moments or add your API Key in Settings > Secrets."}
                            </span>
                            <button
                              type="button"
                              onClick={handleRetry}
                              className="inline-flex items-center gap-1.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/35 px-4 py-2 text-xs font-bold text-red-300 hover:text-red-200 transition-all cursor-pointer active:scale-95 shadow-sm shadow-red-900/10 shrink-0"
                            >
                              <RefreshCw className="h-3.5 w-3.5" />
                              <span>Retry Send</span>
                            </button>
                          </div>
                        )}
 
                        {/* Grounding Sources / Citations */}
                        {isFluxell && msg.sources && msg.sources.length > 0 && (
                          <div className={`mt-4 pt-3.5 border-t space-y-2 select-none transition-colors duration-300 ${
                            isDark ? 'border-slate-900/80' : 'border-slate-150'
                          }`}>
                            <div className={`flex items-center gap-1.5 text-[10.5px] font-bold ${
                              isDark ? 'text-slate-400' : 'text-slate-500'
                            }`}>
                              <Globe className="h-3 w-3 text-indigo-400" />
                              <span>Reference Sources ({msg.sources.length})</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {msg.sources.map((src, srcIdx) => (
                                <a
                                  key={srcIdx}
                                  href={src.uri}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`inline-flex items-center gap-1.5 max-w-[220px] rounded-lg border px-2.5 py-1 text-[10px] font-bold transition-all duration-150 shadow-xs ${
                                    isDark 
                                      ? 'bg-[#121620] hover:bg-[#1a2130] border-slate-850 text-indigo-300 hover:text-indigo-200' 
                                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-indigo-650 hover:text-indigo-700'
                                  }`}
                                  title={src.title}
                                >
                                  <span className="truncate">{src.title}</span>
                                </a>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Timestamp Row */}
                        <div className="flex items-center justify-end gap-1.5 mt-2.5 opacity-40 select-none">
                          <span className="text-[9px] font-medium font-mono">
                            {new Date(msg.timestamp).toLocaleTimeString('en-US', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}

                {/* Live Error Alert (If active outside of message log) */}
                {errorMessage && (
                  <div className="flex items-start gap-2.5 rounded-xl border border-red-900/40 bg-red-950/15 p-4 text-red-400 text-xs leading-relaxed">
                    <AlertCircle className="h-4 w-4 shrink-0 text-red-400/90 mt-0.5" />
                    <div className="flex-1">
                      <span className="font-semibold">Connection Failed:</span> {errorMessage}
                    </div>
                  </div>
                )}

                {/* Fluxell Generation Loader indicator without avatar emblem */}
                {isPending && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-start w-full animate-pulse-typing"
                  >
                    <div className={`rounded-[18px] rounded-tl-xs px-4 py-3.5 space-y-2 w-fit min-w-[120px] max-w-full sm:max-w-[85%] border transition-all duration-300 select-none ${
                      isDark ? 'bg-[#0a0a0c] border-zinc-900/80 shadow-sm' : 'bg-white border-slate-200 shadow-md'
                    }`}>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex h-1.5 w-1.5 rounded-full bg-indigo-500 animate-ping"></span>
                        <p className={`text-[10px] font-bold tracking-wider uppercase font-display ${
                          isDark ? 'text-slate-450' : 'text-slate-500'
                        }`}>Thinking...</p>
                      </div>
                      <div className="flex items-center gap-1.5 py-1">
                        <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:-0.3s]"></div>
                        <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:-0.15s]"></div>
                        <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-bounce"></div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            )}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>        {/* Workspace Bottom Command Center console input */}
        <footer className="px-3 md:px-6 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-2 bg-transparent shrink-0 max-w-4xl mx-auto w-full">
          <div className="max-w-3xl mx-auto">
            
            {/* Native file input ref */}
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              className="hidden" 
            />

            {/* Pills and Active Status Badges row (elegant modern tags) */}
            {(attachedFile || thinkingModel) && (
              <div className="flex flex-wrap gap-2 mb-3 px-3 select-none">
                
                {/* Active File Pill */}
                {attachedFile && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex items-center gap-2 rounded-full border border-sky-950 bg-sky-950/20 px-3 py-1 text-[11px] font-bold text-sky-400 backdrop-blur-xs"
                  >
                    <FileCode className="h-3.5 w-3.5 animate-pulse" />
                    <span className="max-w-[155px] truncate">{attachedFile.name} ({(attachedFile.size / 1024).toFixed(0)} KB)</span>
                    <button 
                      type="button" 
                      onClick={() => setAttachedFile(null)} 
                      className="ml-1 text-sky-500 hover:text-sky-305 transition-colors cursor-pointer"
                    >
                      <X className="h-3.5 w-3.5 hover:scale-110" />
                    </button>
                  </motion.div>
                )}

                {/* Active Thinking Mode Pill */}
                {thinkingModel && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex items-center gap-2 rounded-full border border-indigo-950 bg-indigo-950/20 px-3 py-1 text-[11px] font-bold text-indigo-400 backdrop-blur-xs"
                  >
                    <Cpu className="h-3.5 w-3.5 animate-spin-slow" />
                    <span>Thinking Mode Active</span>
                    <button 
                      type="button" 
                      onClick={() => setThinkingModel(false)} 
                      className="ml-1 text-indigo-505 hover:text-indigo-300 transition-colors cursor-pointer"
                    >
                      <X className="h-3.5 w-3.5 hover:scale-110" />
                    </button>
                  </motion.div>
                )}

              </div>
            )}

            {/* Input Bar composite - Floating design styled dark/black with smaller buttons & paper-plane send icon */}
            <div 
              className={`relative flex flex-col w-full rounded-[24px] p-3 transition-all duration-300 transform translate-y-0 hover:-translate-y-0.5 focus-within:-translate-y-0.5 backdrop-blur-md ${
                isDark 
                  ? 'bg-black/95 border border-zinc-900/90 shadow-[0_15px_45px_rgba(0,0,0,0.95),0_0_25px_rgba(99,102,241,0.02)] focus-within:border-zinc-800 hover:border-zinc-800 focus-within:shadow-[0_20px_55px_rgba(0,0,0,0.98),0_0_35px_rgba(99,102,241,0.08)]' 
                  : 'bg-white border border-slate-200 shadow-[0_10px_30px_rgba(15,23,42,0.05),0_0_25px_rgba(99,102,241,0.01)] focus-within:border-indigo-400 hover:border-slate-300 focus-within:shadow-[0_15px_40px_rgba(15,23,42,0.08),0_0_35px_rgba(99,102,241,0.05)]'
              }`} 
              id="plus_menu_container"
            >
              
              <textarea
                ref={textareaRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyPress}
                onFocus={handleInputFocus}
                placeholder="Ask Fluxel..."
                rows={2}
                disabled={isPending}
                className={`w-full bg-transparent border-0 px-2 pt-1 pb-2 text-sm md:text-base focus:outline-none focus:ring-0 resize-none min-h-[50px] max-h-[180px] leading-relaxed font-sans scrollbar-none transition-colors ${
                  isDark ? 'text-slate-100 placeholder-slate-500' : 'text-slate-900 placeholder-slate-400'
                }`}
              />

              {/* Toolbar with divided sections: left side has Fast vs Code, right side has tools */}
              <div className="flex justify-between items-center mt-2 px-1 pb-0.5">
                
                {/* Mode Selector - Mepet ke pinggir kiri */}
                <div className={`flex items-center p-0.5 rounded-[10px] border select-none transition-colors ${
                  isDark ? 'bg-neutral-950 border-zinc-900/80' : 'bg-slate-100/70 border-slate-205/65'
                }`}>
                  {/* FAST Button */}
                  <button
                    type="button"
                    onClick={() => setAiMode('fast')}
                    className={`flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all duration-200 cursor-pointer active:scale-95 ${
                      aiMode === 'fast'
                        ? 'bg-amber-500/15 text-amber-500 border border-amber-500/30'
                        : isDark
                          ? 'text-slate-450 hover:text-slate-200 border border-transparent'
                          : 'text-slate-500 hover:text-slate-800 border border-transparent'
                    }`}
                    title="Fast: Quick & concise responses"
                  >
                    <img 
                      src="/fast.png" 
                      alt="Lightning" 
                      className="h-3.5 w-3.5 rounded-sm object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <span>Fast</span>
                  </button>

                  {/* CODE Button */}
                  <button
                    type="button"
                    onClick={() => setAiMode('code')}
                    className={`flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all duration-200 cursor-pointer active:scale-95 ${
                      aiMode === 'code'
                        ? 'bg-indigo-505/15 text-indigo-500 border border-indigo-500/30'
                        : isDark
                          ? 'text-slate-455 hover:text-slate-200 border border-transparent'
                          : 'text-slate-500 hover:text-slate-800 border border-transparent'
                    }`}
                    title="Code: Smart analysis & script writing"
                  >
                    <img 
                      src="/code.jpg" 
                      alt="VSCode" 
                      className="h-3.5 w-3.5 rounded-sm object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <span>Code</span>
                  </button>
                </div>

                {/* Right tools (Mic, Plus, Send) */}
                <div className="flex items-center gap-2">
                  
                  {/* Voice microphone button */}
                  <button
                    type="button"
                    onClick={toggleListening}
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-all duration-200 cursor-pointer active:scale-95 ${
                      isListening 
                        ? 'bg-rose-500 hover:bg-rose-600 text-white border-rose-500 shadow-md' 
                        : isDark
                          ? 'bg-neutral-950 text-slate-300 border-zinc-900 hover:bg-zinc-900 shadow-sm'
                          : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200 shadow-xs'
                    }`}
                    title={isListening ? "Recording... Click to stop" : "Voice to Text"}
                  >
                    <Mic className={`h-4 w-4 ${isListening ? 'animate-pulse text-white' : ''}`} />
                  </button>

                  {/* Plus toggle button representing additional overlay features */}
                  <div className="relative shrink-0">
                    <button
                      type="button"
                      onClick={() => setShowPlusMenu(!showPlusMenu)}
                      className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-200 cursor-pointer active:scale-95 ${
                        showPlusMenu || attachedFile || thinkingModel
                          ? 'bg-indigo-600 text-white border border-transparent' 
                          : isDark
                            ? 'bg-neutral-950 text-slate-305 border border-zinc-900/60 hover:bg-zinc-900 shadow-sm'
                            : 'bg-slate-100 text-slate-600 border border-transparent hover:bg-slate-200 shadow-xs'
                      }`}
                      title="Additional Options"
                    >
                      <Plus className={`h-4 w-4 transition-transform duration-250 ${showPlusMenu ? 'rotate-45' : ''}`} />
                    </button>

                    {/* Popover Menu Overlay inside Light Input Box style */}
                    <AnimatePresence>
                      {showPlusMenu && (
                        <motion.div
                          initial={{ opacity: 0, y: 12, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 12, scale: 0.95 }}
                          transition={{ duration: 0.15, ease: 'easeOut' }}
                          className={`absolute bottom-11 right-0 z-50 w-44 rounded-2xl border p-1.5 shadow-xl backdrop-blur-md transition-all duration-300 ${
                            isDark 
                              ? 'border-zinc-900 bg-neutral-950' 
                              : 'border-slate-200 bg-white shadow-md'
                          }`}
                        >
                          {/* FILE OPTION */}
                           <button
                             type="button"
                             onClick={handleFileClick}
                             className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-semibold transition-all duration-150 cursor-pointer ${
                               isDark 
                                 ? 'text-slate-200 hover:bg-zinc-900' 
                                 : 'text-slate-700 hover:bg-slate-50'
                             }`}
                           >
                            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-sky-500/10 text-sky-400">
                              <FileCode className="h-3.5 w-3.5" />
                            </div>
                            <span>File</span>
                          </button>

                          {/* BERPIKIR OPTION */}
                          <button
                            type="button"
                            onClick={toggleThinking}
                            className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-xs font-semibold transition-all duration-150 cursor-pointer ${
                              thinkingModel 
                                ? 'bg-indigo-600/10 text-indigo-500 hover:bg-indigo-600/20' 
                                : isDark
                                  ? 'text-slate-200 hover:bg-zinc-900'
                                  : 'text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`flex h-6 w-6 items-center justify-center rounded-lg ${thinkingModel ? 'bg-indigo-500/20' : isDark ? 'bg-zinc-900' : 'bg-slate-100'} text-indigo-400`}>
                                <Cpu className="h-3.5 w-3.5 animate-pulse" />
                              </div>
                              <span>Thinking</span>
                            </div>
                            {thinkingModel && (
                              <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
                            )}
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Send Button representing paper-plane */}
                  <button
                    type="button"
                    onClick={() => handleSendMessage()}
                    disabled={(!inputText.trim() && !attachedFile) || isPending}
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-all duration-200 cursor-pointer active:scale-95 ${
                      (!inputText.trim() && !attachedFile) 
                        ? isDark
                          ? 'bg-neutral-950 border-zinc-900/80 text-neutral-700 cursor-not-allowed opacity-60'
                          : 'bg-slate-50 border-slate-200 text-slate-350 cursor-not-allowed opacity-60'
                        : isDark
                          ? 'bg-neutral-950 text-slate-200 border-zinc-900 hover:bg-zinc-900 shadow-sm hover:text-white'
                          : 'bg-indigo-650 text-white border-transparent hover:bg-indigo-600 shadow-sm shadow-indigo-600/10'
                    }`}
                    title="Kirim Pesan"
                  >
                    <Send className="h-4 w-4" />
                  </button>

                </div>
              </div>

            </div>
          </div>
        </footer>

      </main>

      {/* Settings Modal Component Overlay */}
      <AnimatePresence>
        {showSettingsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSettingsModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            
            {/* Dialog Content Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: 'spring', duration: 0.4 }}
              className={`relative z-10 w-full max-w-md overflow-hidden rounded-3xl border p-6 shadow-2xl transition-all ${
                isDark 
                  ? 'border-neutral-900 bg-neutral-950 text-white' 
                  : 'border-slate-200 bg-white text-slate-900'
              }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-white/5">
                <div className="flex items-center gap-2.5">
                  <Settings className="h-5 w-5 text-indigo-400 shrink-0" />
                  <h3 className="font-display text-base font-bold tracking-tight">API & Theme Settings</h3>
                </div>
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className={`rounded-xl p-1.5 transition-colors cursor-pointer ${
                    isDark ? 'text-slate-400 hover:bg-neutral-900 hover:text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Body */}
              <div className="mt-5 space-y-5">
                {/* 1. Api Key Section */}
                <div className="space-y-2">
                  <label className="block text-[11px] uppercase tracking-wider font-bold text-slate-400">
                    Google Gemini API Key
                  </label>
                  <div className="relative font-mono">
                    <input
                      type={showApiKeyPlain ? 'text' : 'password'}
                      value={customApiKey}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCustomApiKey(val);
                        localStorage.setItem('fluxell_custom_api_key', val);
                      }}
                      placeholder="Enter your free API Key..."
                      className={`w-full rounded-2xl border px-4 py-3 text-xs font-mono transition-all outline-none ${
                        isDark
                          ? 'bg-neutral-900 border-neutral-800 text-slate-100 placeholder-slate-600 focus:border-indigo-500/80 focus:bg-neutral-900/60'
                          : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:bg-white'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKeyPlain(!showApiKeyPlain)}
                      className={`absolute top-1/2 right-3 -translate-y-1/2 rounded-lg p-1 transition-colors cursor-pointer ${
                        isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      {showApiKeyPlain ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-[10px] leading-relaxed text-slate-500">
                    💡 **Optional & Secure**: Saved locally in your browser. Use this if the server's free quota limit is reached (*RESOURCE_EXHAUSTED*). Get your free API Key from <a href="https://aistudio.google.com/" target="_blank" rel="noopener noreferrer" className="text-indigo-400 font-semibold underline hover:text-indigo-300">Google AI Studio</a>.
                  </p>
                </div>

                {/* 2. Model Info */}
                <div className={`rounded-2xl p-3.5 border text-[11px] leading-relaxed ${
                  isDark ? 'bg-neutral-900/40 border-neutral-900/60 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}>
                  <span className="font-bold block text-[10px] uppercase tracking-wider mb-1 text-slate-300">
                    AI Core Engine
                  </span>
                  Powered by the state-of-the-art **Gemini 3.5 Flash** model for smart reasoning and thorough analysis, with automated fallback to **Gemini 3.1 Flash-Lite** to maintain extremely fast response times during server high demand surges.
                </div>

                {/* 3. Theme status */}
                <div className="space-y-1.5 pt-2 border-t border-white/5">
                  <label className="block text-[11px] uppercase tracking-wider font-bold text-slate-400">
                    Aesthetics & Theme
                  </label>
                  <div className="flex items-center gap-2 justify-between">
                    <span className="text-xs text-slate-350 font-medium">Cosmic Dark Slate Mode</span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full select-none">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Active (Always On)
                    </span>
                  </div>
                </div>
              </div>

              {/* Action */}
              <div className="mt-6 pt-4 border-t border-white/5 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setShowSettingsModal(false);
                  }}
                  className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-550 text-white py-2.5 text-xs font-bold transition-all cursor-pointer active:scale-95 text-center shadow-lg shadow-indigo-600/15"
                >
                  Save & Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
