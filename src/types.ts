export interface GroundingSource {
  title: string;
  uri: string;
}

export interface Message {
  id: string;
  sender: 'user' | 'xyron';
  text: string;
  timestamp: number;
  isPending?: boolean;
  isError?: boolean;
  isStreaming?: boolean;
  sources?: GroundingSource[];
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentType?: string;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  timestamp: number;
}

export interface SuggestionChip {
  id: string;
  category: 'programming' | 'debugging' | 'architecture' | 'education' | 'bot';
  label: string;
  shortLabel: string;
  prompt: string;
}
