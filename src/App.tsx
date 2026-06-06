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
  ArrowUp
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
  isVexon: boolean;
  isStreaming?: boolean;
  msgId: string;
  onTypewriterComplete: (id: string) => void;
}

function MessageBubbleContent({ text, isVexon, isStreaming, msgId, onTypewriterComplete }: MessageBubbleContentProps) {
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
              <span>{isStreaming && !thoughtFinished ? "Thinking..." : "Thought Process"}</span>
            </div>
            <span className="text-[10px] text-indigo-500 font-medium font-sans">
              {isExpanded ? "Hide" : "Show"}
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
  return isVexon ? (
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
        sender: 'vexon',
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

  const [firebaseStatus, setFirebaseStatus] = useState<{ firebaseConnected: boolean; hasConfig: boolean }>({
    firebaseConnected: false,
    hasConfig: false
  });

  // Sync sessions to localStorage and Firebase Firestore via server
  useEffect(() => {
    localStorage.setItem('xyron_sessions_v9', JSON.stringify(sessions));

    const syncToFirebase = async () => {
      try {
        const res = await fetch('/api/sessions/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessions })
        });
        if (res.ok) {
          const data = await res.json();
          setFirebaseStatus({
            firebaseConnected: !!data.firebaseConnected,
            hasConfig: data.firebaseConnected !== undefined
          });
        }
      } catch (err) {
        console.warn("Failed to sync history with Firebase Firestore:", err);
      }
    };

    const timer = setTimeout(syncToFirebase, 800);
    return () => clearTimeout(timer);
  }, [sessions]);

  // Load sessions and connection status from Firebase Firestore on mount
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const res = await fetch('/api/sessions');
        if (res.ok) {
          const data = await res.json();
          setFirebaseStatus({
            firebaseConnected: !!data.firebaseConnected,
            hasConfig: data.firebaseConnected !== undefined
          });

          if (data && data.firebaseConnected && data.sessions && data.sessions.length > 0) {
            const sanitized = data.sessions.map((s: ChatSession) => ({
              ...s,
              messages: s.messages.map(m => m.isStreaming ? { ...m, isStreaming: false } : m)
            }));
            setSessions(sanitized);

            const hasActive = sanitized.some((s: ChatSession) => s.id === activeSessionId);
            if (!hasActive && sanitized.length > 0) {
              setActiveSessionId(sanitized[0].id);
            }
          }
        }
      } catch (err) {
        console.error('Gagal mengambil history dari Firebase:', err);
      }
    };
    fetchInitialData();
  }, []);

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

  // Plus menu overlay, attachments, and thinking states
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [lastSentFile, setLastSentFile] = useState<File | null>(null);
  const [thinkingModel, setThinkingModel] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [aiMode, setAiMode] = useState<'fast' | 'code'>('fast');
  
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

  // Sync state refs to prevent stale closure in static visualViewport listener
  const messagesRef = useRef(messages);
  const isPendingRef = useRef(isPending);
  useEffect(() => {
    messagesRef.current = messages;
    isPendingRef.current = isPending;
  }, [messages, isPending]);

  // Dynamic Viewport Height & Position management for mobile virtual keyboard
  const adjustViewport = () => {
    if (!window.visualViewport) return;
    const vv = window.visualViewport;
    const appRoot = document.getElementById('app_root');
    if (appRoot) {
      // Pin height and top dynamically to the exact visual viewport bounds (excluding virtual keyboard!)
      appRoot.style.height = `${vv.height}px`;
      appRoot.style.top = `${vv.offsetTop}px`;
    }
    
    // Only scroll parent window back to top if it actually shifted, avoids layout/rendering feedback loop
    if (window.scrollY !== 0 || window.scrollX !== 0) {
      window.scrollTo(0, 0);
    }
    if (document.body.scrollTop !== 0) {
      document.body.scrollTop = 0;
    }
    
    // Force scroll messages area to the bottom instantly to avoid animating scroll fights
    if (messagesRef.current.length > 1 || isPendingRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
    }
  };

  useEffect(() => {
    if (!window.visualViewport) return;

    const handleViewportResize = () => {
      adjustViewport();
    };

    window.visualViewport.addEventListener('resize', handleViewportResize);
    
    // Immediate alignment
    adjustViewport();

    return () => {
      window.visualViewport?.removeEventListener('resize', handleViewportResize);
    };
  }, []);

  // Lock window and document scrolls gently to prevent automatic shifting/panning by mobile browsers on input focus
  useEffect(() => {
    const preventWindowScroll = () => {
      if (window.scrollY !== 0 || window.scrollX !== 0) {
        window.scrollTo(0, 0);
      }
    };
    
    window.addEventListener('scroll', preventWindowScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', preventWindowScroll);
    };
  }, []);

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
    adjustViewport();
    // Progressive viewport checks as keyboard animates/slides up
    setTimeout(adjustViewport, 40);
    setTimeout(adjustViewport, 120);
    setTimeout(adjustViewport, 250);
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
    
    if (aiMode === 'code') {
      modifiedPrompt += "\n\n[SISTEM MODE CODE: Pengguna mengaktifkan Mode Code & Analisis Pintar. Berikan solusi kode super bersih, berikan ulasan arsitektur mendalam, lakukan analisis komprehensif, pastikan logic bebas bug, serta jelaskan sintaks secara mendetail, terstruktur, dan profesional.]";
    } else if (aiMode === 'fast') {
      modifiedPrompt += "\n\n[SISTEM MODE FAST: Pengguna mengaktifkan Mode Fast. Berikan jawaban yang super ringkas, cepat, to-the-point, hilangkan penjelasan yang terlalu bertele-tele agar respon dapat dirender secepat kilat.]";
    }

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

      const response = await fetch('/api/vexon/chat', {
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
          fileData: fileDataPayload
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Terjadi kesalahan sistem saat menghubungi Vexon.');
      }

      const vexonMsg: Message = {
        id: `vexon-${Date.now()}`,
        sender: 'vexon',
        text: data.text,
        timestamp: Date.now(),
        isStreaming: true,
        sources: data.sources
      };

      setMessages(prev => [...prev, vexonMsg]);

    } catch (error: any) {
      console.error('Chat error:', error);
      setErrorMessage(error.message || 'Koneksi terputus. Silakan periksa koneksi internet atau coba beberapa saat lagi.');
      
      const errorMsg: Message = {
        id: `error-${Date.now()}`,
        sender: 'vexon',
        text: `⚠️ **Gagal memuat respons**\n\n${error.message || 'Gagal tersambung dengan server otak Vexon.'}\n\n*Silakan coba kirim ulang masukan Anda.*`,
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
    if (window.confirm('Apakah Anda yakin ingin menghapus seluruh riwayat percakapan dengan Vexon?')) {
      const initialChat: Message[] = [
        {
          id: 'welcome',
          sender: 'vexon',
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
    <div className="flex fixed inset-0 w-full bg-[#090b10] text-slate-100 font-sans overflow-hidden" id="app_root">
      
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
                src="https://i.imgur.com/eUfx6Xy.png" 
                alt="Vexon Logo" 
                className="h-full w-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <h1 className="font-display text-lg font-bold tracking-tight text-white flex items-center gap-1.5 font-sans">
                VEXON
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
              <span>New Chat</span>
            </button>
          </div>

          {/* Session List */}
          <div className="flex-1 overflow-y-auto px-2 py-4 space-y-1.5 scrollbar-thin scrollbar-transparent">
            <div className="px-3 mb-2 shrink-0">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Chat History</span>
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
                    title="Delete Chat"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Firebase Connection Status Indicator */}
        <div className="p-4 border-t border-slate-950 bg-slate-900/10 text-[11px] shrink-0 flex items-center justify-between select-none">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className={`h-2 w-2 rounded-full shrink-0 ${
              firebaseStatus.firebaseConnected 
                ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' 
                : firebaseStatus.hasConfig 
                  ? 'bg-indigo-500/40 shadow-[0_0_8px_rgba(99,102,241,0.2)] animate-pulse'
                  : 'bg-indigo-500/20 shadow-[0_0_8px_rgba(99,102,241,0.1)]'
            }`} />
            <span className="truncate text-slate-400 font-sans font-medium text-[11px]">
              {firebaseStatus.firebaseConnected 
                ? 'Firebase Firestore Connected' 
                : 'Firebase Offline (Local Active)'}
            </span>
          </div>
          {firebaseStatus.firebaseConnected && (
            <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded-md font-bold uppercase shrink-0">Synced</span>
          )}
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
        
        {/* Top Header Bar with Typewriter Vexon Accent */}
        <header className="flex h-16 items-center justify-between px-4 sm:px-6 border-b border-slate-900 bg-[#0d1017]/50 backdrop-blur-md select-none shrink-0 z-10">
          <div className="flex items-center gap-3">
            {/* Sidebar toggle button inside the header */}
            <button
              onClick={() => setShowSidebar(prev => !prev)}
              className="p-2 -ml-2 rounded-xl text-slate-400 hover:bg-slate-950 hover:text-white transition-all cursor-pointer relative"
              title={showSidebar ? "Close Menu" : "Open Menu"}
            >
              <Menu className="h-5 w-5" />
            </button>
            
            {/* Logo next to header name */}
            <div className="flex h-8 w-8 overflow-hidden items-center justify-center rounded-lg border border-slate-800 bg-[#0d1017]/80 shadow-md">
              <img 
                src="https://i.imgur.com/eUfx6Xy.png" 
                alt="Vexon Logo" 
                className="h-full w-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            
            {/* Header Text Vexon without animated cursor */}
            <div className="flex items-center gap-2">
              <span className="font-sans font-extrabold text-sm sm:text-base tracking-tight text-white flex items-center min-w-[70px]">
                {Array.from("Vexon").map((char, index) => (
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
        </header>
        
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
                  <h3 className="text-sm font-bold text-slate-100 mb-1">Drop Your File Here</h3>
                  <p className="text-[11px] leading-relaxed text-slate-450">
                    Vexon will automatically attach this file, document, image, or code to your chat session.
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
                  <div className="relative h-20 w-20 overflow-hidden rounded-[24px] bg-black border border-slate-800 shadow-2xl p-1 shrink-0">
                    <img
                      src="https://i.imgur.com/eUfx6Xy.png"
                      alt="Vexon"
                      className="h-full w-full rounded-[20px] object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <h1 className="font-display text-2xl font-black tracking-[0.25em] text-white">
                    VEXON
                  </h1>
                </div>

                {/* Minimalist typography header */}
                <div className="space-y-3">
                  <h2 className="font-display text-xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent flex flex-wrap justify-center gap-x-[0.25em] gap-y-1">
                    {"I am Vexon, how can I help you today?".split(" ").map((word, wIdx) => (
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
                  <p className="text-[11px] sm:text-xs text-slate-400 max-w-lg mx-auto font-medium leading-relaxed flex flex-wrap justify-center gap-x-[0.25em] gap-y-1">
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
                  className="space-y-4 max-w-xl mx-auto pt-6 border-t border-slate-900/60"
                >
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">
                    Select a programming language to start writing scripts:
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {[
                      { name: 'PHP', tech: 'Laravel, Vanilla', prompt: 'I need a PHP script for ' },
                      { name: 'JavaScript', tech: 'Node.js, React, ES6', prompt: 'Please write a JavaScript script for ' },
                      { name: 'Python', tech: 'FastAPI, Django, Flask', prompt: 'I want a Python script for ' },
                      { name: 'C++', tech: 'OOP, Algorithms', prompt: 'Please build a C++ script for ' },
                      { name: 'HTML & CSS', tech: 'Responsive, Tailwind', prompt: 'Design and code an HTML & CSS layout for ' },
                      { name: 'Java', tech: 'Spring, OOP, Dev', prompt: 'Please create a Java script for ' },
                      { name: 'Others', tech: 'Go, SQL, Rust, C#', prompt: 'Help me write a script in ' },
                    ].map((lang, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setInputText(lang.prompt)}
                        className="group relative flex flex-col justify-between items-center rounded-xl border border-slate-900 bg-[#07090e]/80 p-3 text-center transition-all duration-200 hover:border-indigo-950/70 hover:bg-[#0c0e14] cursor-pointer select-none active:scale-97"
                      >
                        <span className="text-xs font-bold text-slate-200 group-hover:text-indigo-400 transition-colors duration-150">
                          {lang.name}
                        </span>
                        <span className="text-[9px] text-slate-500 font-mono mt-1 w-full truncate">
                          {lang.tech}
                        </span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              </motion.div>
            ) : (
              // Chat conversation timeline
              <div className="max-w-3xl mx-auto space-y-6">
                {messages.map((msg, index) => {
                  // Skip displaying the default welcome greeting in the timeline to keep it very elegant
                  if (msg.id === 'welcome') return null;
 
                  const isVexon = msg.sender === 'xenova' || msg.sender === 'xyron' || msg.sender === 'vexon';
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
                          !isVexon 
                            ? 'w-auto max-w-[85%] sm:max-w-[70%] bg-indigo-600 text-white rounded-tr-xs selection:bg-slate-200 selection:text-indigo-900' 
                            : msg.isError 
                              ? 'w-full sm:max-w-[85%] bg-red-950/20 border border-red-900/30 rounded-tl-xs'
                              : 'w-full sm:max-w-[85%] bg-[#0d1017] border border-slate-900 rounded-tl-xs'
                        }`}
                      >
                        {/* User Attachment Render */}
                        {!isVexon && (msg.attachmentName || msg.attachmentUrl) && (
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
                          isVexon={isVexon}
                          isStreaming={msg.isStreaming}
                          msgId={msg.id}
                          onTypewriterComplete={handleTypewriterComplete}
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
                        {isVexon && msg.sources && msg.sources.length > 0 && (
                          <div className="mt-4 pt-3.5 border-t border-slate-900/80 space-y-2 select-none">
                            <div className="flex items-center gap-1.5 text-slate-400 text-[10.5px] font-bold">
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

                {/* Vexon Generation Loader indicator without avatar emblem */}
                {isPending && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-start w-full animate-pulse-typing"
                  >
                    <div className="bg-[#0d1017] border border-slate-900 rounded-[18px] rounded-tl-xs px-4 py-3.5 space-y-2 w-full sm:max-w-[85%] select-none">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex h-1.5 w-1.5 rounded-full bg-indigo-500 animate-ping"></span>
                        <p className="text-[10px] font-semibold text-slate-450 tracking-wider uppercase font-display">Thinking...</p>
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

            {/* Input Bar composite - Styled dark/black with smaller buttons & paper-plane send icon */}
            <div className="relative flex flex-col w-full bg-black border border-slate-800 dark:border-slate-900 rounded-[22px] p-3 shadow-xl focus-within:border-indigo-950/50 transition-all duration-250" id="plus_menu_container">
              
              <textarea
                ref={textareaRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyPress}
                onFocus={handleInputFocus}
                placeholder="Ask Vexon..."
                rows={2}
                disabled={isPending}
                className="w-full bg-transparent border-0 px-2 pt-1 pb-2 text-sm md:text-base text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-0 resize-none min-h-[50px] max-h-[180px] leading-relaxed font-sans scrollbar-none"
              />

              {/* Toolbar with divided sections: left side has Fast vs Code, right side has tools */}
              <div className="flex justify-between items-center mt-2 px-1 pb-0.5">
                
                {/* Mode Selector - Mepet ke pinggir kiri */}
                <div className="flex items-center bg-[#0d1017] p-0.5 rounded-[10px] border border-slate-800/80 select-none">
                  {/* FAST Button */}
                  <button
                    type="button"
                    onClick={() => setAiMode('fast')}
                    className={`flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all duration-200 cursor-pointer active:scale-95 ${
                      aiMode === 'fast'
                        ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                        : 'text-slate-400 hover:text-slate-200 border border-transparent'
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
                        ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30'
                        : 'text-slate-400 hover:text-slate-200 border border-transparent'
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
                        : 'bg-[#0d1017] text-slate-300 border-slate-800/80 hover:bg-slate-900 shadow-sm'
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
                          ? 'bg-indigo-650 text-white border border-transparent' 
                          : 'bg-[#0d1017] text-slate-300 border border-transparent hover:bg-slate-900 shadow-sm'
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
                          className="absolute bottom-11 right-0 z-50 w-44 rounded-2xl border border-slate-800 bg-[#0d1017] p-1.5 shadow-xl backdrop-blur-md"
                        >
                          {/* FILE OPTION */}
                          <button
                            type="button"
                            onClick={handleFileClick}
                            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-semibold text-slate-200 hover:bg-slate-900 transition-all duration-150 cursor-pointer"
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
                                ? 'bg-indigo-600/10 text-indigo-455 hover:bg-indigo-600/20' 
                                : 'text-slate-200 hover:bg-slate-900'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`flex h-6 w-6 items-center justify-center rounded-lg ${thinkingModel ? 'bg-indigo-505/20' : 'bg-slate-800/25'} text-indigo-400`}>
                                <Cpu className="h-3.5 w-3.5 animate-pulse" />
                              </div>
                              <span>Thinking</span>
                            </div>
                            {thinkingModel && (
                              <span className="h-1.5 w-1.5 rounded-full bg-indigo-505 animate-pulse" />
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
                        ? 'bg-[#0d1017] border-slate-800/60 text-slate-600 cursor-not-allowed opacity-60'
                        : 'bg-[#0d1017] text-slate-200 border-slate-800 hover:bg-slate-900 shadow-sm'
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

    </div>
  );
}
