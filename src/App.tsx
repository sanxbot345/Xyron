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
  MicOff
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
  isXyron: boolean;
  isStreaming?: boolean;
  msgId: string;
  onTypewriterComplete: (id: string) => void;
}

function MessageBubbleContent({ text, isXyron, isStreaming, msgId, onTypewriterComplete }: MessageBubbleContentProps) {
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
        <div className="rounded-xl border border-indigo-950 bg-indigo-950/10 overflow-hidden">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center justify-between px-3.5 py-2.5 text-[11.5px] font-bold text-indigo-400 hover:bg-indigo-950/20 transition-all select-none cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Cpu className="h-3.5 w-3.5 animate-spin-slow text-indigo-400" />
              <span>{isStreaming && !thoughtFinished ? "Sedang Berpikir..." : "Proses Berpikir"}</span>
            </div>
            <span className="text-[10px] text-indigo-500 font-medium font-sans">
              {isExpanded ? "Sembunyikan" : "Tampilkan"}
            </span>
          </button>
          
          <AnimatePresence initial={true}>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="px-3.5 pb-3 border-t border-slate-950"
              >
                <div id={`thought-${msgId}`} className="text-xs text-indigo-300/80 leading-relaxed font-mono whitespace-pre-wrap select-text pt-2.5 max-h-48 overflow-y-auto scrollbar-thin">
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
  return isXyron ? (
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
        if (parsed && parsed.length > 0) return parsed;
      } catch (e) {
        console.error('Failed to parse sessions v9', e);
      }
    }
    // Backward compatibility conversion:
    const oldHistory = localStorage.getItem('xyron_chat_history');
    let initialMessages: Message[] = [
      {
        id: 'welcome',
        sender: 'xyron',
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

  // Sync sessions to localStorage
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

  // New States for Plus menu overlay, attachments, and thinking
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [lastSentFile, setLastSentFile] = useState<File | null>(null);
  const [thinkingModel, setThinkingModel] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isListening, setIsListening] = useState(false);
  
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
        if (event.error === 'not-allowed') {
          setErrorMessage('Akses mikrofon diblokir. Harap berikan izin akses mikrofon untuk aplikasi ini di peramban Anda, atau jalankan aplikasi ini di tab baru.');
        } else {
          setErrorMessage(`Gagal memproses suara: ${event.error || 'Terjadi kesalahan sistem'}`);
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
        setErrorMessage('Gagal memulai perekam suara. Silakan coba lagi.');
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

  // Dynamic Viewport Height management for mobile virtual keyboard
  useEffect(() => {
    if (!window.visualViewport) return;

    const handleViewportResize = () => {
      const vv = window.visualViewport;
      if (!vv) return;
      const appRoot = document.getElementById('app_root');
      if (appRoot) {
        // Set height of root dynamically to the actual visual viewport height (excluding keyboard on mobile!)
        appRoot.style.height = `${vv.height}px`;
      }
      // Re-scroll to bottom of chat when viewport changes (e.g. keyboard opens)
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    window.visualViewport.addEventListener('resize', handleViewportResize);
    window.visualViewport.addEventListener('scroll', handleViewportResize);
    
    // Initial sync
    handleViewportResize();

    return () => {
      window.visualViewport?.removeEventListener('resize', handleViewportResize);
      window.visualViewport?.removeEventListener('scroll', handleViewportResize);
    };
  }, []);

  // Sync scroll on new messages or typing state changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isPending]);

  // Handle textarea autosize
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [inputText]);

  const handleInputFocus = () => {
    // When focusing, scroll down smoothly after keyboard has begun transitioning in
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 250);
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
    let modifiedPrompt = textToSend || (fileForPrompt ? `Kaji dan analisis file terlampir: ${fileForPrompt.name}` : '');
    if (thinkingModel) {
      modifiedPrompt += "\n\n[SISTEM: Aktifkan mode berpikir mendalam. Sebelum Anda memberikan jawaban final, Anda WAJIB menjabarkan analisis logis, pertimbangan arsitektur, dan rincian penalaran Anda di dalam blok `<think>...</think>` pada bagian awal respon Anda. Lakukan secara detail layaknya reasoning model.]";
    }
    if (fileForPrompt) {
      modifiedPrompt += `\n\n[SISTEM: Dokumen/file terlampir oleh pengguna bernama "${fileForPrompt.name}" (${(fileForPrompt.size / 1024).toFixed(1)} KB) bertipe "${fileForPrompt.type || 'unknown'}". Integrasikan konteks lampiran file ini ke dalam penjelasan arsitektur Anda secara relevan.]`;
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
          console.error("Gagal mengonversi file ke Base64:", fileErr);
        }
      }

      const response = await fetch('/api/xyron/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: modifiedPrompt,
          // Exclude the last message from history as it's sent as 'message' parameter
          history: messages.slice(1), // skip the welcome greeting to keep context clean
          thinking: thinkingModel,
          fileData: fileDataPayload
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Terjadi kesalahan sistem saat menghubungi Xyron.');
      }

      const xyronMsg: Message = {
        id: `xyron-${Date.now()}`,
        sender: 'xyron',
        text: data.text,
        timestamp: Date.now(),
        isStreaming: true,
        sources: data.sources
      };

      setMessages(prev => [...prev, xyronMsg]);

    } catch (error: any) {
      console.error('Chat error:', error);
      setErrorMessage(error.message || 'Koneksi terputus. Silakan periksa koneksi internet atau coba beberapa saat lagi.');
      
      const errorMsg: Message = {
        id: `error-${Date.now()}`,
        sender: 'xyron',
        text: `⚠️ **Gagal memuat respons**\n\n${error.message || 'Gagal tersambung dengan server otak Xyron.'}\n\n*Silakan coba kirim ulang masukan Anda.*`,
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
    if (window.confirm('Apakah Anda yakin ingin menghapus seluruh riwayat percakapan dengan Xyron?')) {
      const initialChat: Message[] = [
        {
          id: 'welcome',
          sender: 'xyron',
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
    { value: 'all', label: 'Semua Fitur' },
    { value: 'programming', label: 'Clean Code' },
    { value: 'debugging', label: 'Bug Fix' },
    { value: 'architecture', label: 'Arsitektur' },
    { value: 'education', label: 'Edukasi' },
    { value: 'bot', label: 'Bot & API' }
  ];

  const filteredChips = selectedCategory === 'all' 
    ? CHIP_PRESETS 
    : CHIP_PRESETS.filter(chip => chip.category === selectedCategory);

  return (
    <div className="flex h-full w-full bg-[#090b10] text-slate-100 font-sans overflow-hidden" id="app_root">
      
      {/* 1. SIDEBAR PANEL (Desktop & Collapsible Mobile Grid) */}
      <aside 
        id="side_panel"
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-slate-900 bg-[#0d1017] transition-transform duration-300 xl:translate-x-0 xl:static xl:flex ${
          showSidebar ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-slate-950">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 overflow-hidden items-center justify-center rounded-xl border border-slate-800 bg-[#0d1017]/80 shadow-md">
              <img 
                src="/xyron.jpg" 
                alt="Xyron Logo" 
                className="h-full w-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <h1 className="font-display text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                XYRON
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </h1>
              <p className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">Professional AI</p>
            </div>
          </div>
          <button 
            onClick={() => setShowSidebar(false)} 
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-900 hover:text-white xl:hidden cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Sidebar Body */}
        <div className="flex-grow flex flex-col min-h-0">
          {/* Obrolan Baru (New Chat Button) */}
          <div className="p-4 border-b border-slate-950 shrink-0">
            <button
              onClick={createNewSession}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-550 text-white shadow-md shadow-indigo-600/10 px-4 py-2.5 text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer active:scale-98 select-none"
            >
              <Plus className="h-4 w-4 shrink-0" />
              <span>Obrolan Baru</span>
            </button>
          </div>

          {/* Session List */}
          <div className="flex-1 overflow-y-auto px-2 py-4 space-y-1.5 scrollbar-thin scrollbar-transparent">
            <div className="px-3 mb-2 shrink-0">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Riwayat Chat</span>
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
                  className={`group relative flex items-center justify-between gap-2.5 rounded-xl px-3 py-2.5 text-xs font-medium transition-all duration-200 cursor-pointer border select-none ${
                    isActive
                      ? 'bg-slate-900/80 text-white border-slate-800'
                      : 'bg-transparent text-slate-450 hover:bg-slate-900/30 hover:text-slate-200 border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <MessageSquare className={`h-4 w-4 shrink-0 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} />
                    <span className="truncate leading-none font-sans font-medium">{s.title}</span>
                  </div>

                  <button
                    onClick={(e) => deleteSession(s.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-red-950/30 hover:text-red-400 text-slate-500 transition-all cursor-pointer duration-150 relative z-10 shrink-0"
                    title="Hapus Obrolan"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
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

      {/* Subtle Floating Sidebar Opener (when sidebar is closed) */}
      {!showSidebar && (
        <button
          onClick={() => setShowSidebar(true)}
          className="fixed top-4 left-4 z-50 rounded-full p-2.5 bg-[#0d1017]/90 hover:bg-slate-900 text-slate-400 border border-slate-800/80 hover:text-white transition-all duration-200 cursor-pointer shadow-lg backdrop-blur-xs select-none"
          title="Buka Menu"
          id="sidebar_toggle_float"
        >
          <Menu className="h-4.5 w-4.5" />
        </button>
      )}

      {/* 2. CHAT WORKSPACE */}
      <main 
        className="flex flex-1 flex-col h-full bg-[#090b10] relative overflow-hidden" 
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
        
        {/* Drag and drop overlay portal */}
        <AnimatePresence>
          {isDragging && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#090b10]/92 backdrop-blur-md border-[2px] border-dashed border-indigo-500/40 m-4 rounded-3xl"
            >
              <div className="flex flex-col items-center gap-4 text-center p-6 select-none max-w-sm">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-455 border border-indigo-500/20 animate-bounce">
                  <FileCode className="h-7 w-7" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100 mb-1">Letakkan File Anda di Sini</h3>
                  <p className="text-[11px] leading-relaxed text-slate-450">
                    Xyron akan melampirkan berkas, dokumen, gambar, atau kode ini ke dalam sesi obrolan Anda secara otomatis.
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
                className="max-w-2xl mx-auto py-16 md:py-24 text-center space-y-8 px-4"
              >
                {/* Minimalist typography header */}
                <div className="space-y-3">
                  <h2 className="font-display text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-450 bg-clip-text text-transparent">
                    Saya Xyron, Ada yang bisa saya bantu?
                  </h2>
                  <p className="text-xs md:text-sm text-slate-400 max-w-lg mx-auto font-medium">
                    Asisten AI profesional untuk pemrograman, analisis bug, penataan arsitektur, dan penciptaan website modern terstruktur.
                  </p>

                </div>
              </motion.div>
            ) : (
              // Chat conversation timeline
              <div className="max-w-3xl mx-auto space-y-6">
                {messages.map((msg, index) => {
                  // Skip displaying the default welcome greeting in the timeline to keep it very elegant
                  if (msg.id === 'welcome') return null;

                  const isXyron = msg.sender === 'xyron';
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
                        className={`rounded-[18px] px-4 py-3 shadow-sm ${
                          !isXyron 
                            ? 'w-auto max-w-[85%] sm:max-w-[70%] bg-indigo-600 text-white rounded-tr-xs selection:bg-slate-200 selection:text-indigo-900' 
                            : msg.isError 
                              ? 'w-full sm:max-w-[85%] bg-red-950/20 border border-red-900/30 rounded-tl-xs'
                              : 'w-full sm:max-w-[85%] bg-[#0d1017] border border-slate-900 rounded-tl-xs'
                        }`}
                      >
                        {/* User Attachment Render */}
                        {!isXyron && (msg.attachmentName || msg.attachmentUrl) && (
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
                          isXyron={isXyron}
                          isStreaming={msg.isStreaming}
                          msgId={msg.id}
                          onTypewriterComplete={handleTypewriterComplete}
                        />

                        {msg.isError && (
                          <div className="mt-4 pt-3.5 border-t border-red-950/40 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between select-none">
                            <span className="text-[11px] text-red-400 font-semibold leading-relaxed">
                              {"Quota terlampaui? Anda bisa menunggu sesaat atau memasukkan API Key baru di Settings > Secrets."}
                            </span>
                            <button
                              type="button"
                              onClick={handleRetry}
                              className="inline-flex items-center gap-1.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/35 px-4 py-2 text-xs font-bold text-red-300 hover:text-red-200 transition-all cursor-pointer active:scale-95 shadow-sm shadow-red-900/10 shrink-0"
                            >
                              <RefreshCw className="h-3.5 w-3.5" />
                              <span>Coba Kirim Ulang</span>
                            </button>
                          </div>
                        )}

                        {/* Grounding Sources / Citations */}
                        {isXyron && msg.sources && msg.sources.length > 0 && (
                          <div className="mt-4 pt-3.5 border-t border-slate-900/80 space-y-2 select-none">
                            <div className="flex items-center gap-1.5 text-slate-400 text-[10.5px] font-bold">
                              <Globe className="h-3 w-3 text-indigo-400" />
                              <span>Sumber Referensi ({msg.sources.length})</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {msg.sources.map((src, srcIdx) => (
                                <a
                                  key={srcIdx}
                                  href={src.uri}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 max-w-[220px] rounded-lg bg-[#121620] hover:bg-[#1a2130] border border-slate-850 px-2.5 py-1 text-[10px] font-bold text-indigo-300 hover:text-indigo-200 transition-all duration-150 shadow-sm"
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
                            {new Date(msg.timestamp).toLocaleTimeString('id-ID', { 
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
                      <span className="font-semibold">Koneksi Gagal:</span> {errorMessage}
                    </div>
                  </div>
                )}

                {/* Xyron Generation Loader indicator without avatar emblem */}
                {isPending && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-start w-full animate-pulse-typing"
                  >
                    <div className="bg-[#0d1017] border border-slate-900 rounded-[18px] rounded-tl-xs px-4 py-3.5 space-y-2 w-full sm:max-w-[85%] select-none">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex h-1.5 w-1.5 rounded-full bg-indigo-500 animate-ping"></span>
                        <p className="text-[10px] font-semibold text-slate-450 tracking-wider uppercase font-display">Xyron sedang memproses...</p>
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
        </div>



        {/* Workspace Bottom Command Center console input */}
        <footer className="px-4 md:px-6 py-4 bg-transparent">
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
              <div className="flex flex-wrap gap-2 mb-3.5 px-3 select-none">
                
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
                    <span>Mode Berpikir Aktif</span>
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

            {/* Input Bar composite */}
            <div className="relative flex items-end gap-2 bg-[#0d1017]/80 backdrop-blur-md border border-slate-900 rounded-[100px] p-1.5 pl-3 focus-within:border-indigo-500/30 focus-within:ring-1 focus-within:ring-indigo-500/20 transition-all duration-200 shadow-inner" id="plus_menu_container">
              
              {/* Plus Button Container with Overlay Menu */}
              <div className="relative shrink-0 mb-0.5">
                <button
                  type="button"
                  onClick={() => setShowPlusMenu(!showPlusMenu)}
                  className={`flex h-10 w-10 items-center justify-center rounded-full transition-all duration-200 cursor-pointer active:scale-95 ${
                    showPlusMenu || attachedFile || thinkingModel
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/15' 
                      : 'bg-[#131924] hover:bg-slate-950 text-slate-350 hover:text-white border border-slate-900'
                  }`}
                  title="Opsi Tambahan"
                >
                  <Plus className={`h-5 w-5 transition-transform duration-250 ${showPlusMenu ? 'rotate-45' : ''}`} />
                </button>

                {/* Popover Menu Overlay */}
                <AnimatePresence>
                  {showPlusMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 15, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 15, scale: 0.95 }}
                      transition={{ duration: 0.18, ease: 'easeOut' }}
                      className="absolute bottom-14 left-0 z-50 w-44 rounded-2xl border border-slate-850 bg-[#0d1017]/95 p-1.5 shadow-xl backdrop-blur-md"
                    >
                      {/* FILE OPTION */}
                      <button
                        type="button"
                        onClick={handleFileClick}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-semibold text-slate-200 hover:bg-slate-900/50 hover:text-white transition-all duration-150 cursor-pointer"
                      >
                        <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-sky-505/10 text-sky-400">
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
                            ? 'bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30' 
                            : 'text-slate-200 hover:bg-slate-900/50 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`flex h-6 w-6 items-center justify-center rounded-lg ${thinkingModel ? 'bg-indigo-505/20' : 'bg-slate-800/25'} text-indigo-400`}>
                            <Cpu className="h-3.5 w-3.5 animate-pulse" />
                          </div>
                          <span>Berpikir</span>
                        </div>
                        {thinkingModel && (
                          <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse animate-spin-slow" />
                        )}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <textarea
                ref={textareaRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyPress}
                onFocus={handleInputFocus}
                placeholder="Tanya Xyron"
                rows={1}
                disabled={isPending}
                className="flex-1 bg-transparent border-0 px-3 py-2 text-xs md:text-sm text-slate-100 placeholder-slate-505 focus:outline-none focus:ring-0 resize-none min-h-[40px] max-h-[180px] leading-relaxed font-sans scrollbar-none"
              />

              <button
                type="button"
                onClick={toggleListening}
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-all duration-200 cursor-pointer active:scale-95 ${
                  isListening 
                    ? 'bg-rose-500 hover:bg-rose-600 text-white border-rose-500 shadow-[0_0_12px_rgba(239,68,68,0.3)]' 
                    : 'bg-[#131924]/40 hover:bg-[#131924] text-slate-400 hover:text-slate-200 border-slate-900/80 shadow-inner'
                }`}
                title={isListening ? "Sedang merekam, klik untuk selesai..." : "Voice to Text"}
              >
                <Mic className={`h-4.5 w-4.5 ${isListening ? 'animate-pulse text-white' : ''}`} />
              </button>

              <button
                type="button"
                onClick={() => handleSendMessage()}
                disabled={(!inputText.trim() && !attachedFile) || isPending}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-600 hover:bg-indigo-505 text-white transition-all duration-200 disabled:opacity-30 disabled:hover:bg-indigo-600 disabled:cursor-not-allowed cursor-pointer active:scale-95"
              >
                <Send className="h-4.5 w-4.5" />
              </button>

            </div>
          </div>
        </footer>

      </main>

    </div>
  );
}
