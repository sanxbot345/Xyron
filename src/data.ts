import { SuggestionChip } from './types';

export const CHIP_PRESETS: SuggestionChip[] = [
  {
    id: 'prog-1',
    category: 'programming',
    label: 'Write Clean Code Function',
    shortLabel: 'Clean Code',
    prompt: 'Please write a clean, efficient, and type-safe TypeScript utility function to validate email inputs and standard telephone number formats.'
  },
  {
    id: 'debug-1',
    category: 'debugging',
    label: 'Analyze & Fix Bug',
    shortLabel: 'Fix Bug',
    prompt: 'Here is my React code which has a potential memory leak or infinite re-render inside useEffect. Please analyze and fix it:\n\n```jsx\nuseEffect(() => {\n  const interval = setInterval(() => {\n    fetchData();\n  }, 1000);\n}, []);\n```'
  },
  {
    id: 'arch-1',
    category: 'architecture',
    label: 'Design Node.js API Architecture',
    shortLabel: 'API Architecture',
    prompt: 'I want to design a secure, modular REST API architecture using Node.js, Express, and PostgreSQL that supports high scalability. Provide a directory structure and best practices.'
  },
  {
    id: 'edu-1',
    category: 'education',
    label: 'Explain Asynchronous Concepts',
    shortLabel: 'Async JS Concept',
    prompt: 'Explain the concepts of Asynchronous operations, Promises, and Async/Await in JavaScript in a simple, step-by-step manner suitable for beginners.'
  },
  {
    id: 'bot-1',
    category: 'bot',
    label: 'Design a Telegram Bot',
    shortLabel: 'Telegram Bot',
    prompt: 'Can you show me a step-by-step guide to building a simple, responsive Telegram Bot in Node.js using node-telegram-bot-api to handle auto-replies?'
  }
];

export const WELCOME_MESSAGE = "Hello! I am Fluxel, your professional AI Assistant. I am ready to help you with programming, debugging, architecture, and script creation. What would you like us to build today?";

