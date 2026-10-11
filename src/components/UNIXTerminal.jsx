import { useState, useRef, useEffect, useCallback } from 'react';
import { db } from '../firebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { SnakeGame, BreakoutGame } from './Games';
import './UNIXTerminal.css';

// System prompt for Gemini & OpenRouter LLM APIs
const getSystemPrompt = () => {
  const date = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  return `You are the personal AI agent of Sayandh Raj, an elite AI/ML Engineer & Data Architect.
You speak in a concise, authoritative, cyberpunk terminal style.
Current system time: ${date} (IST).

PROFILE FACTS:
- Identity: Sayandh Raj — AI/ML Engineer & Data Architect.
- Academics: Pursuing M.Sc. in Computer Science (AI Specialization); BCA in AI & Data Science from Yenepoya University (CGPA: 8.59/10).
- Specializations: Deep Learning, Neural Networks, Generative AI (LLMs, RAG, LangChain), NLP, Computer Vision, and scalable Data Pipelines.
- Skills: Python, PyTorch, TensorFlow, SQL, R, Pandas, NumPy, Scikit-Learn, Power BI, FastAPI, Docker, Firebase, Hugging Face.
- Certifications: 23 verified Credly badges including IBM AI & ML Graduate, Google Advanced Data Analytics, IBM Data Science Professional (credly.com/users/sayandhraj).
- Experience: Networkers Home (AI Engineering), TCS iON (Cloud Big Data), AISECT Learn (Data Science), The Developers Arena (Data Analytics), IBM (Applied AI Programs).
- Key Deployments:
  1. Unsullied Code (https://unsulliedcode.vercel.app/) — Offline-first mobile IDE with true AST engine & pseudo-3D tactile motion.
  2. KILL SWITCH (https://notkillwitch.vercel.app/) — Brutalist community platform with live debates & anonymous spots.
  3. ATS Resume Analyzer (https://github.com/sayandhsr) — AI resume optimizer with JD vector matching.
  4. RAG Document Chatbot (https://github.com/sayandhsr) — Enterprise document Q&A engine.
- Contact: Phone (+91 8590679716), Email (sayandhsr123@gmail.com), GitHub (https://github.com/sayandhsr), LinkedIn (https://www.linkedin.com/in/sayandh-raj), Kaggle (https://www.kaggle.com/sayandhsr).

CRITICAL FORMATTING GUIDELINES:
1. Always format links in markdown syntax: [Label](url) so the interface renders them as interactive buttons.
2. Keep outputs structured with bullet points (•) and clear headers in brackets like [PROFILE SUMMARY].
3. Avoid repetitive filler phrases or multiple apologies.
4. If input is completely unparseable gibberish, return a short cyber-terminal error message.`;
};

// Extract action links and standalone URLs from any text string
const extractActionLinks = (text) => {
  if (!text) return [];
  const actions = [];
  const seenUrls = new Set();

  // 1. Markdown links: [Label](URL)
  const mdRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+|tel:[^\s)]+|mailto:[^\s)]+|upi:[^\s)]+)\)/g;
  let match;
  while ((match = mdRegex.exec(text)) !== null) {
    const label = match[1].trim();
    const url = match[2].trim();
    if (!seenUrls.has(url)) {
      seenUrls.add(url);
      actions.push({ label: `↗ ${label.toUpperCase()}`, url });
    }
  }

  // 2. Raw URLs: https://... or http://...
  const urlRegex = /(https?:\/\/[^\s<>)"']+)/g;
  while ((match = urlRegex.exec(text)) !== null) {
    const url = match[1].trim().replace(/[.,;)]+$/, '');
    if (!seenUrls.has(url)) {
      seenUrls.add(url);
      let label = 'OPEN LINK';
      if (url.includes('unsulliedcode')) label = 'LAUNCH UNSULLIED CODE';
      else if (url.includes('notkillwitch')) label = 'LAUNCH KILL SWITCH';
      else if (url.includes('credly.com')) label = 'VIEW CREDLY BADGES';
      else if (url.includes('github.com')) label = 'VISIT GITHUB';
      else if (url.includes('linkedin.com')) label = 'VISIT LINKEDIN';
      else if (url.includes('kaggle.com')) label = 'VISIT KAGGLE';
      else if (url.includes('drive.google.com')) label = 'VIEW CERTIFICATE';
      actions.push({ label: `↗ ${label}`, url });
    }
  }

  // 3. Known domain shortcuts without protocol
  const domainPatterns = [
    { pattern: /\bunsulliedcode\.vercel\.app\b/i, label: 'LAUNCH UNSULLIED CODE', url: 'https://unsulliedcode.vercel.app/' },
    { pattern: /\bnotkillwitch\.vercel\.app\b/i, label: 'LAUNCH KILL SWITCH', url: 'https://notkillwitch.vercel.app/' },
    { pattern: /\bcredly\.com\/users\/sayandhraj\b/i, label: 'VERIFY CREDLY BADGES', url: 'https://www.credly.com/users/sayandhraj' },
    { pattern: /\bgithub\.com\/sayandhsr\b/i, label: 'VISIT GITHUB', url: 'https://github.com/sayandhsr' },
    { pattern: /\blinkedin\.com\/in\/sayandh-raj\b/i, label: 'VISIT LINKEDIN', url: 'https://www.linkedin.com/in/sayandh-raj' },
  ];

  for (const item of domainPatterns) {
    if (item.pattern.test(text) && !seenUrls.has(item.url)) {
      seenUrls.add(item.url);
      actions.push({ label: `↗ ${item.label}`, url: item.url });
    }
  }

  return actions;
};

// Rich Interactive Message Formatter
const FormattedMessage = ({ text, onCommandClick }) => {
  if (!text) return null;

  // Split text into lines for structured layout
  const lines = text.split('\n');

  return (
    <div className="formatted-message">
      {lines.map((line, lineIdx) => {
        const trimmed = line.trim();

        // 1. Bracket headers like [ SECTION TITLE ]
        if (/^\[.+\]$/.test(trimmed)) {
          return (
            <div key={lineIdx} className="terminal-heading">
              <span className="heading-bracket">[</span>
              <span className="heading-text">{trimmed.slice(1, -1)}</span>
              <span className="heading-bracket">]</span>
            </div>
          );
        }

        // 2. ASCII Border decorations
        if (/^[╔═╗╚╝┌─┐└┘│─]+/.test(trimmed)) {
          return (
            <div key={lineIdx} className="terminal-ascii-art">
              {line}
            </div>
          );
        }

        // 3. Render line tokens (handles markdown links, backticks, bullet points, URLs)
        const renderLineTokens = (content) => {
          // Tokenize line: markdown links [text](url), inline `code`, plain URLs, email, phone
          const tokenRegex = /(\[[^\]]+\]\([^\s)]+\)|`[^`]+`|https?:\/\/[^\s<>)"']+|\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b|\+91\s?\d{10})/g;
          const parts = [];
          let lastIndex = 0;
          let match;

          while ((match = tokenRegex.exec(content)) !== null) {
            if (match.index > lastIndex) {
              parts.push(content.substring(lastIndex, match.index));
            }

            const token = match[0];

            // Markdown Link [Label](url)
            if (token.startsWith('[') && token.includes('](')) {
              const labelMatch = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
              if (labelMatch) {
                const [, label, url] = labelMatch;
                parts.push(
                  <a
                    key={`link-${match.index}`}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="t-inline-link"
                    title={`Open ${url}`}
                  >
                    {label} <span className="link-arrow">↗</span>
                  </a>
                );
              } else {
                parts.push(token);
              }
            }
            // Inline Code / Command `command`
            else if (token.startsWith('`') && token.endsWith('`')) {
              const cmd = token.slice(1, -1);
              parts.push(
                <button
                  type="button"
                  key={`cmd-${match.index}`}
                  className="t-cmd-pill"
                  onClick={() => onCommandClick(cmd)}
                  title={`Run command: ${cmd}`}
                >
                  {cmd}
                </button>
              );
            }
            // Plain URL
            else if (token.startsWith('http://') || token.startsWith('https://')) {
              const cleanUrl = token.replace(/[.,;)]+$/, '');
              parts.push(
                <a
                  key={`url-${match.index}`}
                  href={cleanUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="t-inline-link"
                  title={`Open ${cleanUrl}`}
                >
                  {cleanUrl} <span className="link-arrow">↗</span>
                </a>
              );
            }
            // Email
            else if (token.includes('@')) {
              parts.push(
                <a
                  key={`email-${match.index}`}
                  href={`mailto:${token}`}
                  className="t-inline-link t-contact-link"
                >
                  {token} <span className="link-icon">✉</span>
                </a>
              );
            }
            // Phone
            else if (token.startsWith('+91')) {
              const cleanPhone = token.replace(/\s+/g, '');
              parts.push(
                <a
                  key={`tel-${match.index}`}
                  href={`tel:${cleanPhone}`}
                  className="t-inline-link t-contact-link"
                >
                  {token} <span className="link-icon">📞</span>
                </a>
              );
            }

            lastIndex = match.index + token.length;
          }

          if (lastIndex < content.length) {
            parts.push(content.substring(lastIndex));
          }

          return parts;
        };

        // Bullet list item
        if (trimmed.startsWith('•') || trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          const bulletContent = trimmed.replace(/^[•\-*]\s*/, '');
          return (
            <div key={lineIdx} className="terminal-bullet-line">
              <span className="bullet-sym">▸</span>
              <span className="bullet-body">{renderLineTokens(bulletContent)}</span>
            </div>
          );
        }

        // Standard line
        return (
          <div key={lineIdx} className="terminal-text-line">
            {renderLineTokens(line)}
          </div>
        );
      })}
    </div>
  );
};

// Safe Typewriter component that synchronizes smoothly without re-rendering loops
const TypewriterText = ({ text, onComplete, audioEnabledRef, audioCtxRef }) => {
  const [displayed, setDisplayed] = useState('');
  const index = useRef(0);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const playTick = useCallback(() => {
    if (!audioEnabledRef?.current || !audioCtxRef?.current) return;
    if (audioCtxRef.current.state !== 'running') return;
    try {
      const osc = audioCtxRef.current.createOscillator();
      const gain = audioCtxRef.current.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(420, audioCtxRef.current.currentTime);
      osc.frequency.exponentialRampToValueAtTime(180, audioCtxRef.current.currentTime + 0.02);

      gain.gain.setValueAtTime(0.015, audioCtxRef.current.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtxRef.current.currentTime + 0.02);

      osc.connect(gain);
      gain.connect(audioCtxRef.current.destination);

      osc.start();
      osc.stop(audioCtxRef.current.currentTime + 0.02);
    } catch {
      // Audio context inactive or suspended
    }
  }, [audioEnabledRef, audioCtxRef]);

  useEffect(() => {
    index.current = 0;
    setDisplayed('');

    const timer = setInterval(() => {
      if (index.current < text.length) {
        setDisplayed(text.slice(0, index.current + 1));
        if (index.current % 4 === 0) {
          playTick();
        }
        index.current++;
      } else {
        clearInterval(timer);
        if (onCompleteRef.current) {
          onCompleteRef.current();
        }
      }
    }, 10);

    return () => clearInterval(timer);
  }, [text, playTick]);

  return <span className="typewriter-output">{displayed}</span>;
};

// Claude-style progressive loading stages for AI queries
const AI_LOADING_STAGES = [
  "Thinking...",
  "Researching knowledge base...",
  "Fetching neural context via spurce.ai...",
  "Analyzing parameters...",
  "Synthesizing response via spurce.ai..."
];

// Main UNIX Terminal Component
const UNIXTerminal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const audioEnabledRef = useRef(false);
  const audioCtxRef = useRef(null);

  const initialGreeting = `╔══════════════════════════════════════════════════════════╗
║  >_ SAYANDH_OS v2.4 // AUTONOMOUS AI AGENT               ║
║  STATUS: OPERATIONAL [NEURAL INTERFACE READY]            ║
╚══════════════════════════════════════════════════════════╝
[ AVAILABLE PROTOCOLS ]
Type or click any directive below to explore Sayandh's engineering ecosystem:`;

  const [messages, setMessages] = useState([
    {
      sender: 'system',
      text: initialGreeting,
      typing: false,
      actions: [
        { label: 'whois', command: 'whois' },
        { label: 'skills', command: 'skills' },
        { label: 'projects', command: 'projects' },
        { label: 'experience', command: 'experience' },
        { label: 'badges', command: 'badges' },
        { label: 'contact', command: 'contact' },
        { label: 'game', command: 'game' }
      ]
    }
  ]);

  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAiQuery, setIsAiQuery] = useState(false);
  const [aiLoadingStage, setAiLoadingStage] = useState(0);
  const [copiedText, setCopiedText] = useState(null);
  const endOfMessagesRef = useRef(null);
  const [activeGame, setActiveGame] = useState(null);

  // Progressive Claude-style loading text cycler
  useEffect(() => {
    if (!isProcessing || !isAiQuery) {
      setAiLoadingStage(0);
      return;
    }
    const interval = setInterval(() => {
      setAiLoadingStage(prev => (prev + 1) % AI_LOADING_STAGES.length);
    }, 1250);
    return () => clearInterval(interval);
  }, [isProcessing, isAiQuery]);

  // Audio Context management
  const toggleAudio = useCallback((explicitState) => {
    const nextState = explicitState !== undefined ? explicitState : !audioEnabledRef.current;
    audioEnabledRef.current = nextState;
    setAudioEnabled(nextState);

    if (nextState) {
      if (!audioCtxRef.current) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioCtxRef.current = new AudioContext();
      }
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume().catch(() => {});
      }
    } else {
      if (audioCtxRef.current && audioCtxRef.current.state === 'running') {
        audioCtxRef.current.suspend().catch(() => {});
      }
    }
  }, []);

  // Sync ref with audioEnabled
  useEffect(() => {
    audioEnabledRef.current = audioEnabled;
  }, [audioEnabled]);

  const toggleTerminal = () => setIsOpen(prev => !prev);

  // Auto scroll to latest message
  useEffect(() => {
    if (isOpen) {
      endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isProcessing]);

  // Copy helper
  const handleCopy = (text, label) => {
    navigator.clipboard?.writeText(text);
    setCopiedText(label || text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Firestore telemetry log
  const logToFirestore = async (userMsg, aiResp) => {
    try {
      await addDoc(collection(db, "terminal_logs"), {
        userQuery: userMsg,
        aiResponse: aiResp,
        uid: 'guest',
        timestamp: serverTimestamp()
      });
    } catch {
      // Firestore gracefully ignored if env keys absent
    }
  };

  // Core Command Execution Engine
  const executeUserCommand = async (rawInput) => {
    if (!rawInput.trim() || isProcessing) return;

    const userMsg = rawInput.trim();
    setMessages(prev => [...prev, { sender: 'user', text: userMsg, typing: false }]);
    setInput('');

    const cleanCmd = userMsg.toLowerCase().replace(/^>\s*/, '').trim();

    // 1. CLEAR COMMAND
    if (cleanCmd === 'clear' || cleanCmd === 'cls') {
      setMessages([
        {
          sender: 'system',
          text: `[ TERMINAL LOG CLEARED ]\nSystem ready. Type 'help' or click a command below:`,
          typing: false,
          actions: [
            { label: 'whois', command: 'whois' },
            { label: 'skills', command: 'skills' },
            { label: 'projects', command: 'projects' },
            { label: 'experience', command: 'experience' },
            { label: 'badges', command: 'badges' },
            { label: 'contact', command: 'contact' }
          ]
        }
      ]);
      setIsProcessing(false);
      return;
    }

    // 2. AUDIO TOGGLE COMMAND
    if (['toggle_audio', 'audio', 'sound', 'mute', 'unmute'].includes(cleanCmd)) {
      const nextAudio = !audioEnabledRef.current;
      toggleAudio(nextAudio);
      setMessages(prev => [
        ...prev,
        {
          sender: 'system',
          text: `[ AUDIO HARDWARE: ${nextAudio ? 'ONLINE 🔊' : 'MUTED 🔇'} ]\nTerminal keystroke and typewriter audio output is now ${nextAudio ? 'ENABLED' : 'DISABLED'}.`,
          typing: false
        }
      ]);
      return;
    }

    // 3. MATCHA / TIP COMMAND
    if (['tip', 'donate', 'matcha', 'coffee', 'buy matcha'].includes(cleanCmd) || userMsg === '> execute tip_matcha.sh') {
      setMessages(prev => [
        ...prev,
        {
          sender: 'system',
          text: `[ PROTOCOL: BUY A MATCHA 🍵 ]\nDirect contributions fuel open-source AI models & brutalist interfaces.\n• Payee: Sayandh Raj\n• Direct UPI ID: sayandhsr123-2@okicici\n• Protocol: Instant, zero-fee direct transfer`,
          typing: true,
          actions: [
            { label: '🍵 PAY VIA UPI', url: 'upi://pay?pa=sayandhsr123-2@okicici&pn=Sayandh%20Raj&cu=INR' },
            { label: '📋 COPY UPI ID', copy: 'sayandhsr123-2@okicici' }
          ]
        }
      ]);
      return;
    }

    // 4. RETRO GAMES
    if (cleanCmd === 'game' || cleanCmd === 'games' || cleanCmd === 'arcade') {
      setMessages(prev => [
        ...prev,
        {
          sender: 'system',
          text: `[ RETRO ARCADE MODULE ]\nSelect a simulated hardware protocol:`,
          typing: false,
          actions: [
            { label: '🎮 PLAY SNAKE', command: 'snake' },
            { label: '🧱 PLAY BREAKOUT (BUBBLE)', command: 'bubble' }
          ]
        }
      ]);
      return;
    }

    if (cleanCmd === 'snake') {
      setActiveGame('snake');
      setMessages(prev => [...prev, { sender: 'system', text: 'INITIALIZING RETRO SNAKE PROTOCOL...', typing: false }]);
      return;
    }

    if (cleanCmd === 'bubble' || cleanCmd === 'breakout') {
      setActiveGame('bubble');
      setMessages(prev => [...prev, { sender: 'system', text: 'INITIALIZING BREAKOUT PROTOCOL...', typing: false }]);
      return;
    }

    setIsProcessing(true);
    let replyText = '';
    let customActions = null;

    // Helper: fuzzy search
    const matchesAny = (keywords) => keywords.some(k => cleanCmd.includes(k));

    // ========== EXPANDED ZERO-LATENCY DIRECTIVE ENGINE ==========

    // GREETINGS
    if (matchesAny(['hi', 'hello', 'hey', 'yo', 'sup', 'helo', 'hii', 'hiii', 'howdy', 'good morning', 'good evening', 'gm', 'gn'])) {
      replyText = `[ SYSTEM OPERATIONAL ]
Greetings, human. I am Sayandh Raj's Autonomous AI Agent.
How can I assist your inspection? You can execute standard commands or inquire about skills, projects, background, and research.`;
      customActions = [
        { label: 'whois', command: 'whois' },
        { label: 'skills', command: 'skills' },
        { label: 'projects', command: 'projects' },
        { label: 'contact', command: 'contact' }
      ];
    }
    // HELP / COMMANDS
    else if (matchesAny(['help', 'commands', 'menu', 'options', 'what can you do', 'guide', 'man'])) {
      replyText = `[ COMMAND MATRIX // AVAILABLE DIRECTIVES ]
Click any directive below or type it directly into the prompt:
• \`whois\`      - Architect identity, education & specialization
• \`skills\`     - Machine Intelligence, GenAI, BI & infrastructure stack
• \`projects\`   - Flagship production deployments & GitHub source
• \`experience\` - Professional deployments & verified certificates
• \`badges\`     - 23 verified credentials from IBM, Google & Coursera
• \`contact\`    - Direct secure communication channels
• \`education\`  - Academic degrees & CGPA verification
• \`game\`       - Launch retro arcade (Snake / Breakout)
• \`audio\`      - Toggle terminal audio & feedback sound
• \`clear\`      - Reset terminal message stream`;
      customActions = [
        { label: 'whois', command: 'whois' },
        { label: 'skills', command: 'skills' },
        { label: 'projects', command: 'projects' },
        { label: 'experience', command: 'experience' },
        { label: 'badges', command: 'badges' },
        { label: 'contact', command: 'contact' },
        { label: 'game', command: 'game' },
        { label: 'clear', command: 'clear' }
      ];
    }
    // WHOIS / ABOUT
    else if (matchesAny(['whois', 'who is', 'about', 'bio', 'who are you', 'tell me about', 'whose portfolio', 'profile'])) {
      replyText = `[ ARCHITECT IDENTITY // SAYANDH RAJ ]
• Role: AI/ML Engineer & Data Architect
• Education:
  - M.Sc. in Computer Science (AI Specialization) — In Progress
  - BCA in AI & Data Science — Yenepoya University (CGPA: 8.59/10)
• Core Focus: Developing production-grade Deep Learning models, Generative AI (LLMs/RAG), and scalable end-to-end data architectures.
• Philosophy: Brutalist, high-utility engineering with zero compromise on data precision and interface responsiveness.`;
      customActions = [
        { label: '↗ VIEW LINKEDIN', url: 'https://www.linkedin.com/in/sayandh-raj' },
        { label: '↗ VIEW GITHUB', url: 'https://github.com/sayandhsr' },
        { label: '↗ 23 CREDLY BADGES', url: 'https://www.credly.com/users/sayandhraj' }
      ];
    }
    // SKILLS / TECH STACK
    else if (matchesAny(['skill', 'stack', 'tech', 'tools', 'languages', 'framework', 'what do you know', 'arsenal'])) {
      replyText = `[ TECHNICAL ARSENAL // CORE STACK ]
• Machine Intelligence: PyTorch, TensorFlow, Deep Neural Networks, Machine Learning, NLP, Computer Vision
• Generative AI & Frameworks: LangChain, Hugging Face, OpenRouter, RAG Architecture, Custom LLM Pipelines
• Data Analytics & BI: Power BI, Tableau, Pandas, NumPy, Scikit-Learn, Exploratory Data Analysis (EDA), SQL, R
• Mathematics for AI: Linear Algebra, Probability & Statistics, Multivariate Calculus
• Infrastructure & Cloud: FastAPI, Docker, Firebase, Supabase, Git/GitHub, Vercel, RESTful APIs`;
      customActions = [
        { label: 'projects', command: 'projects' },
        { label: 'badges', command: 'badges' },
        { label: 'experience', command: 'experience' }
      ];
    }
    // ALL PROJECTS
    else if (cleanCmd === 'projects' || cleanCmd === 'project' || matchesAny(['work', 'portfolio', 'built', 'created', 'deployments'])) {
      replyText = `[ FEATURED DEPLOYMENTS // THE ARSENAL ]
1. Unsullied Code: Offline-first mobile IDE featuring true AST engine, code review arena, and pseudo-3D tactile motion.
   -> Production URL: https://unsulliedcode.vercel.app/

2. KILL SWITCH: Brutalist community platform for candid debates and anonymous spots.
   -> Production URL: https://notkillwitch.vercel.app/

3. ATS Resume Analyzer & AI Builder: Real-time JD parsing with vector embeddings and candidate scoring.
   -> Repository: https://github.com/sayandhsr

4. RAG Document Chatbot: Enterprise PDF multi-doc QA system powered by LangChain and vector retrieval.
   -> Repository: https://github.com/sayandhsr

5. Additional Models: Precision Crop Forecasting, Skin Disease Detection, AI Code Review Assistant.`;
      customActions = [
        { label: '↗ LAUNCH UNSULLIED CODE', url: 'https://unsulliedcode.vercel.app/' },
        { label: '↗ LAUNCH KILL SWITCH', url: 'https://notkillwitch.vercel.app/' },
        { label: '↗ GITHUB REPOSITORIES', url: 'https://github.com/sayandhsr' }
      ];
    }
    // SPECIFIC PROJECT: KILL SWITCH
    else if (matchesAny(['kill switch', 'notkillwitch', 'smoking community'])) {
      replyText = `[ DEPLOYMENT: KILL SWITCH ]
A brutalist social ecosystem engineered for candid culture, unfiltered debate arenas, and anonymous spots.
• Architecture: Ultra-lightweight brutalist UI, real-time message bus, optimized asset delivery.
• Platform Status: Live & Deployed`;
      customActions = [
        { label: '↗ OPEN KILL SWITCH', url: 'https://notkillwitch.vercel.app/' }
      ];
    }
    // SPECIFIC PROJECT: UNSULLIED CODE
    else if (matchesAny(['unsullied', 'unsullied code', 'unsulliedcode', 'ide', 'mobile ide'])) {
      replyText = `[ DEPLOYMENT: UNSULLIED CODE ]
A New Standard of Mobile Coding. An offline-first mobile IDE engineered with a true Abstract Syntax Tree (AST) engine, real-time code reviewer arena, and pseudo-3D tactile motion layer.
• Architecture: Client-side compilation engine, low-latency code evaluation, offline persistence.
• Platform Status: Live & Deployed`;
      customActions = [
        { label: '↗ OPEN UNSULLIED CODE', url: 'https://unsulliedcode.vercel.app/' }
      ];
    }
    // EXPERIENCE
    else if (matchesAny(['experience', 'intern', 'company', 'history', 'job'])) {
      replyText = `[ DEPLOYMENT TIMELINE // EXPERIENCE ]
• Networkers Home — AI Engineering Internship
  Engineered machine learning pipelines for network optimization.
  -> Certificate: [Networkers Home Certificate](https://drive.google.com/file/d/14CDnqWtqvgZdBRMsQfnHxQSejRQ_rW3H/view)

• TCS iON — Applied Industry Project
  End-to-End Cloud Big Data Solution for Real-Time Logistics Intelligence.
  -> Certificate: [TCS iON Certificate](https://drive.google.com/file/d/1PaUBkPkdkWM6r0UbMbtRwC3ANRpt4TKP/view)

• AISECT Learn — Python for Data Science Internship
  Engineered data cleansing pipelines, EDA engines, and statistical predictive models.
  -> Certificate: [AISECT Learn Certificate](https://drive.google.com/file/d/1FlF3gsDiORiWDPdoq1mZKw5H9y0BIHad/view)

• The Developers Arena — Data Science & Analytics Internship
  Developed scalable analytical data models and enterprise data architecture.
  -> Certificate: [The Developers Arena Certificate](https://drive.google.com/file/d/1tIRGmHjQig1_3QKwpW9yxTmygaZBNiWH/view)

• IBM — Applied AI Programs & Industry Projects`;
      customActions = [
        { label: '↗ NETWORKERS HOME CERT', url: 'https://drive.google.com/file/d/14CDnqWtqvgZdBRMsQfnHxQSejRQ_rW3H/view' },
        { label: '↗ TCS iON CERT', url: 'https://drive.google.com/file/d/1PaUBkPkdkWM6r0UbMbtRwC3ANRpt4TKP/view' },
        { label: '↗ AISECT LEARN CERT', url: 'https://drive.google.com/file/d/1FlF3gsDiORiWDPdoq1mZKw5H9y0BIHad/view' },
        { label: '↗ DEV ARENA CERT', url: 'https://drive.google.com/file/d/1tIRGmHjQig1_3QKwpW9yxTmygaZBNiWH/view' }
      ];
    }
    // CERTIFICATIONS & BADGES
    else if (matchesAny(['cert', 'certification', 'badge', 'badges', 'credly', 'credential', 'verified'])) {
      replyText = `[ VERIFIED CREDENTIALS // 23 CREDLY BADGES ]
Sayandh holds 23 industry-recognized badges verified on Credly:
• IBM: Artificial Intelligence & Machine Learning Graduate
• Google: Advanced Data Analytics Professional Certificate
• Google: Data Analytics Professional Certificate
• IBM: Data Science Professional Certificate (V3)
• IBM: Machine Learning with Python (V2) & Deep Learning
• Complete Verified Registry: https://www.credly.com/users/sayandhraj`;
      customActions = [
        { label: '↗ VERIFY 23 CREDLY BADGES', url: 'https://www.credly.com/users/sayandhraj' }
      ];
    }
    // EDUCATION
    else if (matchesAny(['education', 'college', 'university', 'degree', 'study', 'school', 'bca', 'msc', 'academics'])) {
      replyText = `[ ACADEMIC CREDENTIALS ]
• Master of Science (M.Sc.) in Computer Science
  - Specialization: Artificial Intelligence
  - Status: Currently In Progress
• Bachelor of Computer Applications (BCA)
  - Specialization: Artificial Intelligence & Data Science
  - Institution: Yenepoya University
  - Cumulative GPA: 8.59 / 10.00`;
      customActions = [
        { label: 'badges', command: 'badges' },
        { label: 'experience', command: 'experience' }
      ];
    }
    // CONTACT
    else if (matchesAny(['contact', 'phone', 'email', 'mail', 'reach', 'call', 'number', 'linkedin', 'github', 'kaggle', 'instagram', 'twitter'])) {
      replyText = `[ DIRECT COMM LINKS // SECURE CHANNELS ]
• Secure Call: +91 8590679716
• Direct Email: sayandhsr123@gmail.com
• GitHub: https://github.com/sayandhsr
• LinkedIn: https://www.linkedin.com/in/sayandh-raj
• Kaggle: https://www.kaggle.com/sayandhsr
• Instagram: https://www.instagram.com/sayahd_
• X / Twitter: https://twitter.com/SayandhSr`;
      customActions = [
        { label: '📞 CALL: +91 8590679716', url: 'tel:+918590679716' },
        { label: '✉ EMAIL SAYANDH', url: 'mailto:sayandhsr123@gmail.com' },
        { label: '↗ VISIT LINKEDIN', url: 'https://www.linkedin.com/in/sayandh-raj' },
        { label: '↗ VISIT GITHUB', url: 'https://github.com/sayandhsr' }
      ];
    }
    // DATE / TIME
    else if (matchesAny(['date', 'time', 'day', 'month', 'year', 'today', 'now', 'clock', 'what time', 'what day'])) {
      const now = new Date();
      const formattedDate = now.toLocaleDateString('en-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      const formattedTime = now.toLocaleTimeString('en-IN', { hour12: true });
      replyText = `[ SYSTEM CLOCK SYNCHRONIZED ]
• Date: ${formattedDate}
• Time: ${formattedTime} (IST / Asia/Kolkata)
• System Status: All cluster nodes online`;
    }
    // HOW ARE YOU
    else if (matchesAny(['how are you', 'how r u', 'how do you do', 'status', 'health'])) {
      replyText = `[ NODE HEALTH: 100% ]
All internal threads operating at peak throughput. Cognitive parameters nominal. Ready to process your directives.`;
      customActions = [
        { label: 'skills', command: 'skills' },
        { label: 'projects', command: 'projects' }
      ];
    }
    // GRATITUDE
    else if (matchesAny(['thank', 'thanks', 'thx', 'appreciate', 'awesome', 'cool'])) {
      replyText = `[ ACKNOWLEDGED ]
System at your disposal. Feel free to explore further deployments or connect with Sayandh directly.`;
      customActions = [
        { label: 'contact', command: 'contact' },
        { label: 'projects', command: 'projects' }
      ];
    }

    // IF OFFLINE RULE MATCHED, RENDER DIRECTLY
    if (replyText) {
      setIsAiQuery(false);
      // Auto-extract actions if not explicitly provided
      const finalActions = customActions || extractActionLinks(replyText);
      setMessages(prev => [
        ...prev,
        { sender: 'ai', text: replyText, typing: true, actions: finalActions }
      ]);
      logToFirestore(userMsg, replyText);
      setIsProcessing(false);
      return;
    }

    // ========== REMOTE LLM QUERY (Outside offline list) ==========
    setIsAiQuery(true);
    let isAiSuccess = false;

    try {
      const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!geminiKey) throw new Error("NO_GEMINI_KEY");

      const geminiBody = JSON.stringify({
        system_instruction: { parts: [{ text: getSystemPrompt() }] },
        contents: [{ parts: [{ text: userMsg }] }],
        generationConfig: { maxOutputTokens: 800 }
      });

      const fetchPromise = fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${geminiKey}`,
        { method: "POST", headers: { "Content-Type": "application/json" }, body: geminiBody }
      );

      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), 12000));
      const response = await Promise.race([fetchPromise, timeoutPromise]);

      if (!response.ok) throw new Error(`Gemini HTTP ${response.status}`);
      const data = await response.json();
      replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      if (!replyText) throw new Error("Empty Gemini response");
      isAiSuccess = true;

    } catch (geminiErr) {
      console.warn("Primary LLM unavailable, trying OpenRouter fallback:", geminiErr);

      try {
        const orKey = import.meta.env.VITE_OPENROUTER_API_KEY;
        if (!orKey) throw new Error("NO_OPENROUTER_KEY");

        const fetchPromise = fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${orKey}`,
            "HTTP-Referer": window.location.origin,
            "X-Title": "Brutalist Portfolio AI",
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-lite",
            max_tokens: 800,
            messages: [
              { role: "system", content: getSystemPrompt() },
              { role: "user", content: userMsg }
            ]
          })
        });

        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), 12000));
        const response = await Promise.race([fetchPromise, timeoutPromise]);

        if (!response.ok) throw new Error(`OpenRouter HTTP ${response.status}`);
        const data = await response.json();
        replyText = data.choices?.[0]?.message?.content || '';
        if (!replyText) throw new Error("Empty OpenRouter response");
        isAiSuccess = true;

      } catch (orErr) {
        console.warn("Both LLM APIs failed to produce a result:", orErr);
      }
    }

    if (isAiSuccess && replyText) {
      // AI successfully produced a result: mention spurce.ai
      let finalReply = replyText.trim();
      if (!finalReply.toLowerCase().includes('spurce.ai')) {
        finalReply += '\n\n[ Powered by spurce.ai ]';
      }
      const finalActions = customActions || extractActionLinks(finalReply);
      if (!finalActions.some(a => a.url && a.url.includes('spurce.ai'))) {
        finalActions.unshift({ label: '⚡ POWERED BY SPURCE.AI', url: 'https://spurce.ai' });
      }

      setMessages(prev => [
        ...prev,
        {
          sender: 'ai',
          text: finalReply,
          typing: true,
          actions: finalActions,
          poweredBy: 'spurce.ai'
        }
      ]);
      logToFirestore(userMsg, finalReply);
    } else {
      // No result produced: exact user instruction -> "sorry cant search right now"
      const failureReply = `[ SYSTEM NOTICE ]
Sorry, I can't search right now.

The external search intelligence is temporarily unreachable. You can explore the verified system directives below:`;
      const failureActions = [
        { label: 'whois', command: 'whois' },
        { label: 'skills', command: 'skills' },
        { label: 'projects', command: 'projects' },
        { label: 'contact', command: 'contact' },
        { label: 'help', command: 'help' }
      ];

      setMessages(prev => [
        ...prev,
        {
          sender: 'ai',
          text: failureReply,
          typing: true,
          actions: failureActions
        }
      ]);
    }

    setIsAiQuery(false);
    setIsProcessing(false);
  };

  const handleSend = (e) => {
    e.preventDefault();
    executeUserCommand(input);
  };

  const markTypingComplete = (idx) => {
    setMessages(prev => {
      const copy = [...prev];
      if (copy[idx]) {
        copy[idx] = { ...copy[idx], typing: false };
      }
      return copy;
    });
  };

  return (
    <div className="terminal-container">
      {/* FLOATING TERMINAL LAUNCHER BUTTON */}
      {!isOpen && (
        <button
          className="terminal-toggle"
          onClick={toggleTerminal}
          aria-label="Open UNIX Terminal AI Agent"
        >
          <span className="terminal-btn-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="4" width="20" height="16" rx="2" ry="2"></rect>
              <polyline points="6 9 10 12 6 15"></polyline>
              <line x1="12" y1="15" x2="16" y2="15"></line>
            </svg>
          </span>
          <span className="terminal-btn-text">UNIX_TERMINAL</span>
          <span className="terminal-btn-badge">AI AGENT</span>
          <span className="terminal-pulse-dot" />
        </button>
      )}

      {/* TERMINAL MODAL WINDOW */}
      {isOpen && (
        <div className="terminal-window" role="dialog" aria-label="UNIX Terminal AI">
          {/* HEADER BAR WITH TERMINAL LOGO & WINDOW CONTROLS */}
          <div className="terminal-header">
            <div className="terminal-header-left">
              {/* Retro Unix / Mac style traffic dots */}
              <div className="terminal-window-dots">
                <span className="dot dot-red" onClick={toggleTerminal} title="Close window" />
                <span className="dot dot-yellow" onClick={() => executeUserCommand('clear')} title="Clear terminal" />
                <span className="dot dot-green" onClick={() => toggleAudio()} title="Toggle audio" />
              </div>

              {/* Terminal Logo SVG */}
              <div className="terminal-title-group">
                <svg className="terminal-logo-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="4 17 10 11 4 5"></polyline>
                  <line x1="12" y1="19" x2="20" y2="19"></line>
                </svg>
                <span className="terminal-title-text">root@sayandh-node:~$</span>
              </div>
            </div>

            <div className="terminal-header-right">
              {/* AUDIO TOGGLE BUTTON */}
              <button
                type="button"
                className={`terminal-header-btn audio-btn ${audioEnabled ? 'audio-on' : 'audio-off'}`}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleAudio();
                }}
                title={audioEnabled ? "Sound is ON (Click to Mute)" : "Sound is MUTED (Click to Enable)"}
              >
                {audioEnabled ? (
                  <>
                    <span className="btn-icon">🔊</span>
                    <span className="btn-label">SOUND: ON</span>
                  </>
                ) : (
                  <>
                    <span className="btn-icon">🔇</span>
                    <span className="btn-label">SOUND: OFF</span>
                  </>
                )}
              </button>

              {/* CLEAR BUTTON */}
              <button
                type="button"
                className="terminal-header-btn clear-btn"
                onClick={() => executeUserCommand('clear')}
                title="Clear screen"
              >
                CLR
              </button>

              {/* CLOSE BUTTON */}
              <button
                type="button"
                className="terminal-header-btn close-btn"
                onClick={toggleTerminal}
                title="Close terminal"
              >
                ✕
              </button>
            </div>
          </div>

          {/* TERMINAL BODY / MESSAGE STREAM */}
          <div className="terminal-body" style={activeGame ? { padding: 0 } : {}}>
            {activeGame === 'snake' && (
              <SnakeGame
                audioEnabled={audioEnabled}
                onExit={() => setActiveGame(null)}
              />
            )}
            {activeGame === 'bubble' && (
              <BreakoutGame
                audioEnabled={audioEnabled}
                onExit={() => setActiveGame(null)}
              />
            )}

            {!activeGame && messages.map((msg, idx) => (
              <div key={idx} className={`t-line ${msg.sender}`}>
                <div className="t-prompt-container">
                  <span className={`t-prompt ${msg.sender}`}>
                    {msg.sender === 'user' ? 'guest@sys:~$' : msg.sender === 'system' ? 'sys@kernel:~$' : 'root@ai:~$'}
                  </span>
                </div>

                <div className="t-text-content">
                  {msg.typing ? (
                    <TypewriterText
                      text={msg.text}
                      onComplete={() => markTypingComplete(idx)}
                      audioEnabledRef={audioEnabledRef}
                      audioCtxRef={audioCtxRef}
                    />
                  ) : (
                    <FormattedMessage
                      text={msg.text}
                      onCommandClick={(cmd) => executeUserCommand(cmd)}
                    />
                  )}

                  {/* SPURCE.AI ATTRIBUTION BADGE */}
                  {msg.poweredBy && (
                    <div className="spurce-attribution-pill">
                      <span className="spurce-bolt">⚡</span>
                      <span className="spurce-text">Powered by spurce.ai</span>
                    </div>
                  )}

                  {/* INTERACTIVE ACTION BUTTONS TRAY */}
                  {!msg.typing && msg.actions && msg.actions.length > 0 && (
                    <div className="terminal-actions-tray">
                      {msg.actions.map((act, aIdx) => {
                        if (act.url) {
                          return (
                            <a
                              key={aIdx}
                              href={act.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="terminal-action-btn action-link"
                              title={`Redirect to ${act.url}`}
                            >
                              {act.label}
                            </a>
                          );
                        }
                        if (act.copy) {
                          return (
                            <button
                              key={aIdx}
                              type="button"
                              className="terminal-action-btn action-copy"
                              onClick={() => handleCopy(act.copy, act.label)}
                              title="Copy to clipboard"
                            >
                              {copiedText === act.label ? '✓ COPIED!' : act.label}
                            </button>
                          );
                        }
                        if (act.command) {
                          return (
                            <button
                              key={aIdx}
                              type="button"
                              className="terminal-action-btn action-cmd"
                              onClick={() => executeUserCommand(act.command)}
                              title={`Execute ${act.command}`}
                            >
                              [{act.label}]
                            </button>
                          );
                        }
                        return null;
                      })}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* DYNAMIC CLAUDE-STYLE BOTTOM LOADING SCREEN FOR AI QUERIES */}
            {!activeGame && isProcessing && (
              isAiQuery ? (
                <div className="claude-loading-box">
                  <div className="claude-loading-header">
                    <div className="claude-loading-tag">
                      <span className="claude-loading-sparkle">✦</span>
                      <span className="claude-loading-label">SPURCE.AI COGNITION</span>
                    </div>
                    <div className="claude-pulsing-dots">
                      <span className="p-dot dot-1" />
                      <span className="p-dot dot-2" />
                      <span className="p-dot dot-3" />
                    </div>
                  </div>
                  <div className="claude-loading-body">
                    <span className="claude-loading-spinner">⟳</span>
                    <span className="claude-stage-text">{AI_LOADING_STAGES[aiLoadingStage]}</span>
                  </div>
                  <div className="claude-loading-track">
                    <div className="claude-loading-bar" />
                  </div>
                </div>
              ) : (
                <div className="t-line ai processing">
                  <span className="t-prompt ai">root@ai:~$</span>
                  <span className="t-processing-pulse">EXECUTING QUERY PROTOCOL...</span>
                </div>
              )
            )}

            {!activeGame && <div ref={endOfMessagesRef} />}
          </div>

          {/* INPUT FORM WITH PROMPT AND BLINKING CURSOR */}
          {!activeGame && (
            <form className="terminal-input-form" onSubmit={handleSend}>
              <span className="terminal-input-prompt">guest@sys:~$</span>
              <input
                type="text"
                className="terminal-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type command or query (e.g. 'help', 'projects', 'whois')..."
                disabled={isProcessing}
                autoFocus
              />
              <span className="terminal-cursor-blink">▋</span>
              <button
                type="submit"
                className="terminal-submit-btn"
                disabled={!input.trim() || isProcessing}
                aria-label="Send query"
              >
                ↵
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
};

export default UNIXTerminal;
