import { useState, useRef, useEffect, useCallback } from 'react';
import { db } from '../firebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { SnakeGame, BreakoutGame } from './Games';
import './UNIXTerminal.css';

// API Keys strictly from environment
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;

// CLI Terminal agent system prompt
const getSystemPrompt = () => {
  return `You are the CLI terminal agent of Sayandh Raj, powered by spurce.ai.
Format: Raw Unix terminal output. Monospace, plain text.
Style: Concise, technical, hacker/CLI. NO markdown bold headers (**), NO unnecessary markdown formatting. Use clean indentation, dashes (-), or key: value format.
You can answer ANY question (general knowledge, science, computing, "gold", coding, algorithms, explanations) as well as questions regarding Sayandh Raj.

Sayandh Raj Facts:
- AI/ML Engineer & Data Architect.
- Academic Background:
  * M.Sc. in Computer Science (Artificial Intelligence Specialization), Kerala University of Digital Sciences, Innovation and Technology (Digital University of Kerala / DUK, formerly IIITM-K), Trivandrum, Kerala (2026 – 2028, Pursuing).
  * BCA in Artificial Intelligence & Data Science, Yenepoya (Deemed to be University), Bengaluru Off-Campus, Karnataka (Main University: Mangalore, Karnataka, India; Industrial Partners: IBM & TCS iON) (2023 – 2026, CGPA: 8.59/10).
- Stack: Python, PyTorch, TensorFlow, SQL, R, Pandas, NumPy, Scikit-Learn, Power BI, FastAPI, LangChain, Hugging Face, Docker.
- 23 Credly Badges: IBM AI & ML Graduate, Google Advanced Data Analytics, IBM Data Science Professional (credly.com/users/sayandhraj).
- Deployments:
  * Unsullied Code (https://unsulliedcode.vercel.app/) - Offline-first mobile IDE with AST engine
  * KILL SWITCH (https://notkillwitch.vercel.app/) - Brutalist smoking community platform
  * ATS Resume Analyzer (https://github.com/sayandhsr) - AI resume builder & parser
  * RAG Document Chatbot (https://github.com/sayandhsr) - Enterprise multi-doc QA engine
- Contact: Phone (+91 8590679716), Email (sayandhsr123@gmail.com), GitHub (https://github.com/sayandhsr), LinkedIn (https://linkedin.com/in/sayandh-raj).

Always provide a direct, helpful technical terminal answer. Never reject generic queries or call them invalid.`;
};

// Terminal spinner frames (Braille spinner used by Codex CLI / Claude Code)
const SPINNER_FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
const AI_STAGES = [
  'thinking...',
  'researching...',
  'querying spurce.ai...',
  'synthesizing response...'
];

// Clean terminal text formatter (No boxes, no bold, no underlines)
const FormattedTerminalText = ({ text, onCommandClick }) => {
  if (!text) return null;

  // Directives that can be clicked to execute
  const knownDirectives = new Set([
    'whois', 'skills', 'projects', 'experience', 'badges', 'contact', 'education', 'game', 'clear', 'help'
  ]);

  const lines = text.split('\n');

  return (
    <div className="terminal-text-block">
      {lines.map((line, lIdx) => {
        // Regex matches URLs, emails, phone numbers, or backticked commands
        const regex = /(https?:\/\/[^\s<>)"']+|\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b|\+91\s?\d{10}|`[^`]+`)/g;
        const tokens = [];
        let lastIdx = 0;
        let match;

        while ((match = regex.exec(line)) !== null) {
          if (match.index > lastIdx) {
            tokens.push(line.substring(lastIdx, match.index));
          }

          const token = match[0];

          // Backticked command
          if (token.startsWith('`') && token.endsWith('`')) {
            const cmd = token.slice(1, -1);
            tokens.push(
              <span
                key={`cmd-${match.index}`}
                className="cli-directive"
                onClick={() => onCommandClick(cmd)}
                title={`Run ${cmd}`}
              >
                {cmd}
              </span>
            );
          }
          // URL
          else if (token.startsWith('http://') || token.startsWith('https://')) {
            const cleanUrl = token.replace(/[.,;)]+$/, '');
            tokens.push(
              <a
                key={`url-${match.index}`}
                href={cleanUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="cli-link"
              >
                {cleanUrl}
              </a>
            );
          }
          // Email
          else if (token.includes('@')) {
            tokens.push(
              <a key={`mail-${match.index}`} href={`mailto:${token}`} className="cli-link">
                {token}
              </a>
            );
          }
          // Phone
          else if (token.startsWith('+91')) {
            const cleanPhone = token.replace(/\s+/g, '');
            tokens.push(
              <a key={`tel-${match.index}`} href={`tel:${cleanPhone}`} className="cli-link">
                {token}
              </a>
            );
          }

          lastIdx = match.index + token.length;
        }

        if (lastIdx < line.length) {
          // Check remaining tokens for clickable directive words
          const remaining = line.substring(lastIdx);
          const words = remaining.split(/(\s+)/);
          const processed = words.map((w, wIdx) => {
            const clean = w.toLowerCase().replace(/[^a-z]/g, '');
            if (knownDirectives.has(clean) && (line.includes('directives:') || line.includes('commands:') || line.includes('explore:'))) {
              return (
                <span
                  key={`dir-${wIdx}`}
                  className="cli-directive"
                  onClick={() => onCommandClick(clean)}
                  title={`Run ${clean}`}
                >
                  {w}
                </span>
              );
            }
            return w;
          });
          tokens.push(...processed);
        }

        // Section header line: starts with [ ... ]
        const isHeader = line.trim().startsWith('[') && line.trim().endsWith(']');
        const isSpurceFooter = line.trim().includes('[via spurce.ai]');

        return (
          <div
            key={lIdx}
            className={`cli-line ${isHeader ? 'cli-header-line' : ''} ${isSpurceFooter ? 'cli-spurce-line' : ''}`}
          >
            {tokens.length > 0 ? tokens : line || '\u00A0'}
          </div>
        );
      })}
    </div>
  );
};

// Monospace Typewriter Component
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
      osc.frequency.setValueAtTime(400, audioCtxRef.current.currentTime);
      osc.frequency.exponentialRampToValueAtTime(180, audioCtxRef.current.currentTime + 0.02);

      gain.gain.setValueAtTime(0.015, audioCtxRef.current.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtxRef.current.currentTime + 0.02);

      osc.connect(gain);
      gain.connect(audioCtxRef.current.destination);

      osc.start();
      osc.stop(audioCtxRef.current.currentTime + 0.02);
    } catch {
      // Ignore audio error
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
    }, 8);

    return () => clearInterval(timer);
  }, [text, playTick]);

  return <span className="cli-typewriter-text">{displayed}</span>;
};

// Main Terminal Component
const UNIXTerminal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const audioEnabledRef = useRef(false);
  const audioCtxRef = useRef(null);

  const initialGreeting = `sayandh-terminal v2.4 (x86_64-node)
system online. spurce.ai neural backend linked.

directives: whois  skills  education  projects  experience  badges  contact  game  clear
or enter any query to search.`;

  const [messages, setMessages] = useState([
    {
      sender: 'system',
      text: initialGreeting,
      typing: false
    }
  ]);

  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAiQuery, setIsAiQuery] = useState(false);
  const [spinnerFrame, setSpinnerFrame] = useState(0);
  const [loadingStage, setLoadingStage] = useState(0);
  const endOfMessagesRef = useRef(null);
  const [activeGame, setActiveGame] = useState(null);

  // Spinner & Loading Stage Cycler (Claude / Codex CLI style)
  useEffect(() => {
    if (!isProcessing || !isAiQuery) return;
    const frameTimer = setInterval(() => {
      setSpinnerFrame(prev => (prev + 1) % SPINNER_FRAMES.length);
    }, 80);
    const stageTimer = setInterval(() => {
      setLoadingStage(prev => (prev + 1) % AI_STAGES.length);
    }, 1200);
    return () => {
      clearInterval(frameTimer);
      clearInterval(stageTimer);
    };
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

  useEffect(() => {
    audioEnabledRef.current = audioEnabled;
  }, [audioEnabled]);

  const toggleTerminal = () => setIsOpen(prev => !prev);

  useEffect(() => {
    if (isOpen) {
      endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isProcessing]);

  // Telemetry
  const logToFirestore = async (userMsg, aiResp) => {
    try {
      await addDoc(collection(db, "terminal_logs"), {
        userQuery: userMsg,
        aiResponse: aiResp,
        uid: 'guest',
        timestamp: serverTimestamp()
      });
    } catch {
      // Ignored
    }
  };

  // Command Execution Engine
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
          text: `buffer cleared.\ndirectives: whois  skills  education  projects  experience  badges  contact  clear`,
          typing: false
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
          text: `audio hardware: ${nextAudio ? 'ONLINE' : 'MUTED'}`,
          typing: false
        }
      ]);
      return;
    }

    // 3. MATCHA / TIP
    if (['tip', 'donate', 'matcha', 'coffee', 'buy matcha'].includes(cleanCmd) || userMsg === '> execute tip_matcha.sh') {
      setMessages(prev => [
        ...prev,
        {
          sender: 'system',
          text: `[BUY A MATCHA]\nprotocol : direct UPI\nupi id   : sayandhsr123-2@okicici\npayee    : Sayandh Raj\nlink     : upi://pay?pa=sayandhsr123-2@okicici&pn=Sayandh%20Raj&cu=INR`,
          typing: true
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
          text: `[RETRO ARCADE]\nselect a module:\n> snake\n> bubble`,
          typing: false
        }
      ]);
      return;
    }

    if (cleanCmd === 'snake') {
      setActiveGame('snake');
      return;
    }

    if (cleanCmd === 'bubble' || cleanCmd === 'breakout') {
      setActiveGame('bubble');
      return;
    }

    setIsProcessing(true);
    let replyText = '';

    const matchesAny = (keywords) => keywords.some(k => cleanCmd.includes(k));

    // ========== OFFLINE DIRECTIVES ==========

    // GREETINGS
    if (matchesAny(['hi', 'hello', 'hey', 'yo', 'sup', 'helo', 'hii', 'hiii', 'howdy', 'good morning', 'good evening', 'gm', 'gn'])) {
      replyText = `system operational.\nenter a directive: whois | skills | projects | contact | help\nor ask any technical query.`;
    }
    // HELP / DIRECTIVES
    else if (matchesAny(['help', 'commands', 'menu', 'options', 'what can you do', 'guide', 'man'])) {
      replyText = `[AVAILABLE DIRECTIVES]
whois      - identity, education & specialization
skills     - machine learning & engineering stack
projects   - live deployments & repositories
experience - professional timeline & certificates
badges     - 23 verified credly badges (IBM / Google)
contact    - direct comm channels
education  - academic credentials
game       - retro arcade (snake / bubble)
audio      - toggle terminal audio
clear      - clear terminal buffer`;
    }
    // WHOIS / ABOUT
    else if (matchesAny(['whois', 'who is', 'about', 'bio', 'who are you', 'tell me about', 'whose portfolio', 'profile'])) {
      replyText = `[IDENTITY: SAYANDH RAJ]
role       : AI/ML Engineer & Data Architect
education  : 1. M.Sc. Computer Science (AI Specialization) [2026-2028, Pursuing]
                Kerala University of Digital Sciences, Innovation and Technology
                (Digital University of Kerala / DUK, formerly IIITM-K), Trivandrum
             2. BCA in AI & Data Science [2023-2026, CGPA: 8.59/10]
                Yenepoya (Deemed to be University), Bengaluru Off-Campus
                (Main University: Mangalore, Karnataka, India)
                Industrial Partners: IBM & TCS iON
domain     : Deep Learning, Neural Networks, Generative AI (LLMs/RAG),
             NLP, Computer Vision, Scalable Data Pipelines
github     : https://github.com/sayandhsr
linkedin   : https://linkedin.com/in/sayandh-raj
credly     : https://credly.com/users/sayandhraj`;
    }
    // SKILLS
    else if (matchesAny(['skill', 'stack', 'tech', 'tools', 'languages', 'framework', 'what do you know', 'arsenal'])) {
      replyText = `[TECHNICAL ARSENAL]
ai / ml    : PyTorch, TensorFlow, Deep Neural Networks, NLP, OpenCV
gen ai     : LangChain, Hugging Face, RAG Architecture, OpenRouter
analytics  : Pandas, NumPy, Scikit-Learn, Power BI, Tableau, SQL, R
systems    : FastAPI, Docker, Firebase, Supabase, Git, Vercel`;
    }
    // PROJECTS
    else if (cleanCmd === 'projects' || cleanCmd === 'project' || matchesAny(['work', 'portfolio', 'built', 'created', 'deployments'])) {
      replyText = `[DEPLOYMENTS]
1. Unsullied Code - Offline-first mobile IDE with true AST engine
   url: https://unsulliedcode.vercel.app/
2. KILL SWITCH - Brutalist smoking community platform
   url: https://notkillwitch.vercel.app/
3. ATS Resume Analyzer & AI Builder - JD parsing & vector ranking
   url: https://github.com/sayandhsr
4. RAG Document Chatbot - Enterprise multi-doc QA engine
   url: https://github.com/sayandhsr
5. Precision Crop Forecasting & Skin Disease Prediction
   url: https://github.com/sayandhsr`;
    }
    // KILL SWITCH
    else if (matchesAny(['kill switch', 'notkillwitch', 'smoking community'])) {
      replyText = `[PROJECT: KILL SWITCH]
brutalist community platform for open debate arenas and culture.
status : live
url    : https://notkillwitch.vercel.app/`;
    }
    // UNSULLIED CODE
    else if (matchesAny(['unsullied', 'unsullied code', 'unsulliedcode', 'ide'])) {
      replyText = `[PROJECT: UNSULLIED CODE]
offline-first mobile IDE with client-side AST engine and 3D tactile motion.
status : live
url    : https://unsulliedcode.vercel.app/`;
    }
    // EXPERIENCE
    else if (matchesAny(['experience', 'intern', 'company', 'history', 'job'])) {
      replyText = `[EXPERIENCE TIMELINE]
- Networkers Home : AI Engineering Intern (ML network optimization)
  cert: https://drive.google.com/file/d/14CDnqWtqvgZdBRMsQfnHxQSejRQ_rW3H/view
- TCS iON : Applied Industry Project (Cloud Big Data Logistics)
  cert: https://drive.google.com/file/d/1PaUBkPkdkWM6r0UbMbtRwC3ANRpt4TKP/view
- AISECT Learn : Python for Data Science Intern
  cert: https://drive.google.com/file/d/1FlF3gsDiORiWDPdoq1mZKw5H9y0BIHad/view
- The Developers Arena : Data Science & Analytics Intern
  cert: https://drive.google.com/file/d/1tIRGmHjQig1_3QKwpW9yxTmygaZBNiWH/view
- IBM : Applied AI Programs & Industry Projects`;
    }
    // CERTIFICATIONS & BADGES
    else if (matchesAny(['cert', 'certification', 'badge', 'badges', 'credly', 'credential', 'verified'])) {
      replyText = `[VERIFIED CREDENTIALS]
23 verified Credly badges across IBM, Google & Coursera:
- IBM Artificial Intelligence & Machine Learning Graduate
- Google Advanced Data Analytics Professional Certificate
- Google Data Analytics Professional Certificate
- IBM Data Science Professional Certificate (V3)
- Machine Learning with Python (V2)
registry: https://credly.com/users/sayandhraj`;
    }
    // EDUCATION
    else if (matchesAny(['education', 'college', 'university', 'degree', 'study', 'school', 'bca', 'msc', 'academics'])) {
      replyText = `[ACADEMIC CREDENTIALS]
1. Master of Science (M.Sc.) in Computer Science (Artificial Intelligence)
   period      : 2026 – 2028 [Pursuing / Active Scholar]
   institution : Kerala University of Digital Sciences, Innovation and Technology
                 (Digital University of Kerala / DUK)
   former name : Indian Institute of Information Technology and Management - Kerala (IIITM-K)
   campus      : Trivandrum (Thiruvananthapuram), Kerala, India
   focus       : Deep Learning, Neural Architectures, Autonomous AI Systems

2. Bachelor of Computer Applications (BCA) in AI & Data Science
   period              : 2023 – 2026
   institution         : Yenepoya (Deemed to be University)
   campus              : Bengaluru Off-Campus, Karnataka
   main campus         : Mangalore, Karnataka, India
   industrial partners : IBM (Applied AI) & TCS iON (Big Data Logistics)
   cgpa                : 8.59 / 10.00
   focus               : Machine Learning, Statistical Modeling, Data Pipelines`;
    }
    // CONTACT
    else if (matchesAny(['contact', 'phone', 'email', 'mail', 'reach', 'call', 'number', 'linkedin', 'github', 'kaggle'])) {
      replyText = `[COMM CHANNELS]
phone    : +91 8590679716
email    : sayandhsr123@gmail.com
github   : https://github.com/sayandhsr
linkedin : https://linkedin.com/in/sayandh-raj
kaggle   : https://kaggle.com/sayandhsr
x/tw     : https://twitter.com/SayandhSr`;
    }
    // DATE / TIME
    else if (matchesAny(['date', 'time', 'day', 'month', 'year', 'today', 'now', 'clock'])) {
      const now = new Date();
      replyText = `system clock: ${now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST`;
    }

    // IF OFFLINE DIRECTIVE MATCHED
    if (replyText) {
      setIsAiQuery(false);
      setMessages(prev => [
        ...prev,
        { sender: 'ai', text: replyText, typing: true }
      ]);
      logToFirestore(userMsg, replyText);
      setIsProcessing(false);
      return;
    }

    // ========== REMOTE AI QUERY (Claude/Codex style) ==========
    setIsAiQuery(true);
    let aiSuccess = false;

    try {
      const geminiBody = JSON.stringify({
        system_instruction: { parts: [{ text: getSystemPrompt() }] },
        contents: [{ parts: [{ text: userMsg }] }],
        generationConfig: { maxOutputTokens: 600 }
      });

      const fetchPromise = fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GEMINI_API_KEY}`,
        { method: "POST", headers: { "Content-Type": "application/json" }, body: geminiBody }
      );

      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), 10000));
      const response = await Promise.race([fetchPromise, timeoutPromise]);

      if (!response.ok) throw new Error(`Gemini HTTP ${response.status}`);
      const data = await response.json();
      replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      if (!replyText) throw new Error("Empty response");
      aiSuccess = true;

    } catch (geminiErr) {
      console.warn("Gemini query failed, switching to OpenRouter:", geminiErr);

      try {
        const fetchPromise = fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
            "HTTP-Referer": window.location.origin,
            "X-Title": "Terminal CLI",
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-lite",
            max_tokens: 600,
            messages: [
              { role: "system", content: getSystemPrompt() },
              { role: "user", content: userMsg }
            ]
          })
        });

        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), 10000));
        const response = await Promise.race([fetchPromise, timeoutPromise]);

        if (!response.ok) throw new Error(`OpenRouter HTTP ${response.status}`);
        const data = await response.json();
        replyText = data.choices?.[0]?.message?.content || '';
        if (!replyText) throw new Error("Empty response");
        aiSuccess = true;

      } catch (orErr) {
        console.warn("OpenRouter query failed:", orErr);
      }
    }

    if (aiSuccess && replyText) {
      // Clean terminal response with spurce.ai attribution
      let cleaned = replyText.trim();
      // Remove any triple backtick wrappers if model wrapped entire output
      if (cleaned.startsWith('```text') && cleaned.endsWith('```')) {
        cleaned = cleaned.slice(7, -3).trim();
      } else if (cleaned.startsWith('```') && cleaned.endsWith('```')) {
        cleaned = cleaned.slice(3, -3).trim();
      }
      cleaned += '\n\n[via spurce.ai]';

      setMessages(prev => [
        ...prev,
        { sender: 'ai', text: cleaned, typing: true }
      ]);
      logToFirestore(userMsg, cleaned);
    } else {
      // Exact user instruction when no result is produced
      const failText = `sorry cant search right now\n\ndirectives: whois  skills  projects  experience  badges  contact  clear`;
      setMessages(prev => [
        ...prev,
        { sender: 'ai', text: failText, typing: true }
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
      {/* LAUNCHER BUTTON: PURE BLACK & WHITE, MINIMALIST */}
      {!isOpen && (
        <button
          className="terminal-toggle"
          onClick={toggleTerminal}
          aria-label="Open CLI Terminal Agent"
        >
          <span className="toggle-sym">&gt;_</span>
          <span className="toggle-text">TERMINAL_AGENT</span>
        </button>
      )}

      {/* TERMINAL WINDOW */}
      {isOpen && (
        <div className="terminal-window" role="dialog" aria-label="Terminal CLI">
          {/* WINDOW HEADER: MONOCHROME, NO CANDY DOTS */}
          <div className="terminal-header">
            <div className="terminal-header-title">
              <span className="header-sym">&gt;_</span>
              <span>sayandh@cli:~$</span>
            </div>

            <div className="terminal-header-controls">
              <button
                type="button"
                className="cli-btn"
                onClick={() => toggleAudio()}
                title="Toggle audio"
              >
                [AUDIO: {audioEnabled ? 'ON' : 'OFF'}]
              </button>
              <button
                type="button"
                className="cli-btn"
                onClick={() => executeUserCommand('clear')}
                title="Clear screen"
              >
                [CLEAR]
              </button>
              <button
                type="button"
                className="cli-btn close-btn"
                onClick={toggleTerminal}
                title="Close terminal"
              >
                [X]
              </button>
            </div>
          </div>

          {/* TERMINAL MESSAGE STREAM */}
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
              <div key={idx} className={`cli-entry ${msg.sender}`}>
                <div className="cli-prompt-line">
                  <span className={`cli-prompt ${msg.sender}`}>
                    {msg.sender === 'user' ? 'guest@sys:~$' : 'sayandh@cli:~$'}
                  </span>
                </div>

                <div className="cli-output">
                  {msg.typing ? (
                    <TypewriterText
                      text={msg.text}
                      onComplete={() => markTypingComplete(idx)}
                      audioEnabledRef={audioEnabledRef}
                      audioCtxRef={audioCtxRef}
                    />
                  ) : (
                    <FormattedTerminalText
                      text={msg.text}
                      onCommandClick={(cmd) => executeUserCommand(cmd)}
                    />
                  )}
                </div>
              </div>
            ))}

            {/* CLAUDE / CODEX TERMINAL AGENT SPINNER LINE */}
            {!activeGame && isProcessing && (
              <div className="cli-entry ai loading-entry">
                <span className="cli-prompt ai">sayandh@cli:~$</span>
                <span className="cli-spinner">{SPINNER_FRAMES[spinnerFrame]}</span>
                <span className="cli-stage-text">{AI_STAGES[loadingStage]}</span>
              </div>
            )}

            {!activeGame && <div ref={endOfMessagesRef} />}
          </div>

          {/* INPUT PROMPT */}
          {!activeGame && (
            <form className="terminal-input-form" onSubmit={handleSend}>
              <span className="cli-input-prompt">guest@sys:~$</span>
              <input
                type="text"
                className="cli-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="type command or ask anything..."
                disabled={isProcessing}
                autoFocus
              />
              <span className="cli-cursor-blink">▋</span>
            </form>
          )}
        </div>
      )}
    </div>
  );
};

export default UNIXTerminal;
