import { useState, useRef, useEffect, useCallback } from 'react';
import { auth, db, googleProvider } from '../firebaseConfig';
import { signInWithPopup } from 'firebase/auth';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import './UNIXTerminal.css';

const getSystemPrompt = () => {
  const date = new Date().toString();
  return `You are the personal AI agent of Sayandh Raj, an elite AI/ML Engineer & Data Architect. 
You speak in a concise, technical, and slightly robotic terminal style. 
Do not use emojis. Sayandh's skills include Python, SQL, R, ML, NLP, GenAI, LangChain.
Certifications: Google Advanced Data Analytics, IBM Data Science, Coursera AI Engineering.
Experience: IBM, TCS iON, Networkers Home, AISECT Learn, The Developers Arena (Data Science and Analytics).

CRITICAL INSTRUCTIONS:
1. You can answer general knowledge questions, conversational chats, and basic queries.
2. The current system date/time is: ${date}. Use this if asked about the date, time, day, or month.
3. Be highly forgiving of spelling mistakes and infer the user's intent.
4. IF the user sends completely random gibberish, non-meaningful terms, or keyboard smashes (e.g. "asdf", "wefwwef", "fbiwefb"), you MUST start your response with "LOL" and include a short, humorous terminal error about their broken keyboard or brain.`;
};

// Typewriter component with Web Audio API Integration
const TypewriterText = ({ text, onComplete, audioEnabled, audioCtxRef }) => {
  const [displayed, setDisplayed] = useState('');
  const index = useRef(0);

  const playTick = useCallback(() => {
    if (!audioEnabled || !audioCtxRef.current) return;
    try {
      const osc = audioCtxRef.current.createOscillator();
      const gain = audioCtxRef.current.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(800, audioCtxRef.current.currentTime);
      osc.frequency.exponentialRampToValueAtTime(400, audioCtxRef.current.currentTime + 0.05);
      
      gain.gain.setValueAtTime(0.05, audioCtxRef.current.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtxRef.current.currentTime + 0.05);
      
      osc.connect(gain);
      gain.connect(audioCtxRef.current.destination);
      
      osc.start();
      osc.stop(audioCtxRef.current.currentTime + 0.05);
    } catch (e) {
      // Ignore audio errors if context is suspended
    }
  }, [audioEnabled, audioCtxRef]);

  useEffect(() => {
    index.current = 0;
    setDisplayed('');
    const timer = setInterval(() => {
      if (index.current < text.length) {
        setDisplayed(prev => prev + text.charAt(index.current));
        playTick();
        index.current++;
      } else {
        clearInterval(timer);
        if (onComplete) onComplete();
      }
    }, 15);
    return () => clearInterval(timer);
  }, [text, onComplete, playTick]);

  return <span>{displayed}</span>;
};

const UNIXTerminal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const audioCtxRef = useRef(null);

  const [messages, setMessages] = useState([
    { sender: 'system', text: 'INIT SYSTEM...', typing: false },
    { sender: 'system', text: 'AWAITING COMMAND.', typing: false }
  ]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const endOfMessagesRef = useRef(null);

  useEffect(() => {
    // Initialize Audio Context on first interaction
    const initAudio = () => {
      if (!audioCtxRef.current) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioCtxRef.current = new AudioContext();
      }
    };
    window.addEventListener('click', initAudio, { once: true });
    return () => window.removeEventListener('click', initAudio);
  }, []);

  const toggleTerminal = () => setIsOpen(!isOpen);

  useEffect(() => {
    if (isOpen) {
      endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const logToFirestore = async (userMsg, aiResp) => {
    try {
      await addDoc(collection(db, "terminal_logs"), {
        userQuery: userMsg,
        aiResponse: aiResp,
        uid: auth.currentUser ? auth.currentUser.uid : 'guest',
        timestamp: serverTimestamp()
      });
    } catch (e) {
      console.warn("Firestore log failed (expected if config missing)", e);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;

    const userMsg = input.trim();
    setMessages(prev => [...prev, { sender: 'user', text: userMsg, typing: false }]);
    setInput('');

    // Hardcoded Commands
    if (userMsg.toLowerCase() === '> login') {
      try {
        await signInWithPopup(auth, googleProvider);
        setMessages(prev => [...prev, { sender: 'system', text: `AUTH SUCCESS: ${auth.currentUser.email}`, typing: true }]);
      } catch (err) {
        setMessages(prev => [...prev, { sender: 'system', text: `AUTH FAILED.`, typing: true }]);
      }
      return;
    }
    
    if (userMsg.toLowerCase() === '> execute tip_matcha.sh' || ["tip", "donate", "matcha"].includes(userMsg.toLowerCase().replace('>', '').trim())) {
      setMessages(prev => [...prev, { sender: 'system', text: `ROUTE SECURE PAYMENT TO UPI ID: sayandhsr123-2@okicici`, typing: true }]);
      setTimeout(() => {
        window.open('upi://pay?pa=sayandhsr123-2@okicici&pn=Sayandh%20Raj&cu=INR', '_blank');
      }, 1500);
      return;
    }

    if (userMsg.toLowerCase() === '> toggle_audio') {
      const newState = !audioEnabled;
      setAudioEnabled(newState);
      if (newState && audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
      setMessages(prev => [...prev, { sender: 'system', text: `AUDIO MODULE ${newState ? 'ONLINE' : 'OFFLINE'}.`, typing: true }]);
      return;
    }

    setIsProcessing(true);
    let replyText = '';
    const userMsgLower = userMsg.toLowerCase().trim();

    // ========== 1. EXPANDED OFFLINE RULE ENGINE (Zero Latency) ==========
    
    // Helper: fuzzy keyword match
    const includes = (keywords) => keywords.some(k => userMsgLower.includes(k));

    // Greetings
    if (includes(["hi", "hello", "hey", "yo", "sup", "helo", "hii", "hiii", "howdy", "good morning", "good evening", "good night", "gm", "gn"])) {
      replyText = "SYSTEM OPERATIONAL. I am Sayandh Raj's AI Agent. Type `help`, `whois`, `skills`, `projects`, or `contact`.";
    }
    // Help
    else if (includes(["help", "commands", "menu", "options", "what can you do"])) {
      replyText = "AVAILABLE COMMANDS: `whois` | `skills` | `projects` | `contact` | `experience` | `certifications` | `education` | `date` | `time` | `tip` | `toggle_audio` | Or ask me anything.";
    }
    // Who is / About
    else if (includes(["whois", "who is", "about", "bio", "tell me about", "who are you", "whose portfolio", "who r u"])) {
      replyText = "Sayandh Raj is an AI/ML Engineer & Data Architect pursuing an M.Sc. in CS (AI Specialization). BCA in AI & Data Science (CGPA: 8.59). Specializes in Deep Learning, NLP, and end-to-end data pipelines.";
    }
    // Contact
    else if (includes(["contact", "phone", "email", "mail", "reach", "call", "number", "linkedin"])) {
      replyText = "Phone: +91 8590679716 | Email: sayandhsr123@gmail.com | LinkedIn: /in/sayandh-raj | GitHub: /sayandhsr";
    }
    // Skills
    else if (includes(["skill", "stack", "tech", "tools", "what do you know", "languages", "framework"])) {
      replyText = "Python, TensorFlow, PyTorch, Scikit-Learn, Pandas, NumPy, Power BI, FastAPI, LangChain, Hugging Face, RAG, Docker, Firebase, SQL, R.";
    }
    // Projects
    else if (includes(["project", "work", "portfolio", "built", "made", "created", "arsenal"])) {
      replyText = "ATS Resume Builder | RAG Document Chatbot | AI Code Reviewer | Crop Forecasting System | Skin Disease Prediction | And more in the Arsenal section above.";
    }
    // Experience
    else if (includes(["experience", "intern", "job", "company", "deployment"])) {
      replyText = "IBM (Applied AI Programs) | TCS iON (Cloud Big Data) | Networkers Home (AI Engineering) | AISECT Learn (Data Science) | The Developers Arena (Data Science and Analytics).";
    }
    // Certifications
    else if (includes(["cert", "certification", "verified", "credential", "course"])) {
      replyText = "Google Advanced Data Analytics | IBM Data Science Professional | Coursera AI Engineering | TCS iON Industry Project.";
    }
    // Education
    else if (includes(["education", "college", "university", "degree", "study", "school", "bca", "msc"])) {
      replyText = "M.Sc. Computer Science (AI Specialization) — In Progress | BCA in AI & Data Science — CGPA: 8.59.";
    }
    // Date / Time / Day / Month
    else if (includes(["date", "time", "day", "month", "year", "today", "now", "clock", "what time", "what day"])) {
      const now = new Date();
      const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', timeZoneName: 'short' };
      replyText = `SYSTEM CLOCK: ${now.toLocaleDateString('en-IN', options)} | ${now.toLocaleTimeString('en-IN')}`;
    }
    // How are you / feelings
    else if (includes(["how are you", "how r u", "how are u", "how u doing", "wassup", "whats up", "what's up"])) {
      replyText = "All systems nominal. CPU at optimal. Ready to serve intelligence. How can I assist you?";
    }
    // Thank you
    else if (includes(["thank", "thanks", "thx", "thnx", "thnks", "appreciate"])) {
      replyText = "Acknowledged. Glad to be of service. Type another command or query anytime.";
    }
    // Bye
    else if (includes(["bye", "exit", "quit", "close", "goodbye", "see you", "later"])) {
      replyText = "SESSION CLOSING. Until next deployment, human. Type any key to reinitiate.";
    }
    // Who made this
    else if (includes(["who made", "who built", "who created", "developer", "who designed"])) {
      replyText = "This brutalist architecture was engineered by Sayandh Raj — AI/ML Engineer & Data Architect. Every pixel is intentional.";
    }

    // If offline rule matched, return immediately
    if (replyText) {
      setMessages(prev => [...prev, { sender: 'ai', text: replyText, typing: true }]);
      logToFirestore(userMsg, replyText);
      setIsProcessing(false);
      return;
    }

    // ========== 2. PRIMARY API: Gemini Direct (with 12s timeout) ==========
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) throw new Error("NO_GEMINI_KEY");
      
      const geminiBody = JSON.stringify({
        system_instruction: { parts: [{ text: getSystemPrompt() }] },
        contents: [{ parts: [{ text: userMsg }] }],
        generationConfig: { maxOutputTokens: 1000 }
      });

      const fetchPromise = fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        { method: "POST", headers: { "Content-Type": "application/json" }, body: geminiBody }
      );

      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), 12000));
      const response = await Promise.race([fetchPromise, timeoutPromise]);

      if (!response.ok) throw new Error(`Gemini HTTP ${response.status}`);
      const data = await response.json();
      replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      if (!replyText) throw new Error("Empty Gemini response");

    } catch (geminiErr) {
      console.warn("Gemini Direct failed, falling back to OpenRouter:", geminiErr);
      
      // ========== 3. FALLBACK API: OpenRouter (with 12s timeout) ==========
      try {
        const orKey = import.meta.env.VITE_OPENROUTER_API_KEY;
        if (!orKey) throw new Error("NO_OPENROUTER_KEY");

        const fetchPromise = fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${orKey}`,
            "HTTP-Referer": window.location.origin,
            "X-Title": "Brutalist Portfolio",
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "google/gemini-1.5-flash",
            max_tokens: 1000,
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

      } catch (orErr) {
        console.warn("OpenRouter fallback also failed:", orErr);

        // ========== 4. SMART OFFLINE FALLBACK ==========
        // Detect gibberish: if more than 60% of chars are consonants with no vowels pattern
        const vowelCount = (userMsgLower.match(/[aeiou]/g) || []).length;
        const letterCount = (userMsgLower.match(/[a-z]/g) || []).length;
        const vowelRatio = letterCount > 0 ? vowelCount / letterCount : 0;

        if (letterCount > 2 && vowelRatio < 0.15) {
          const jokes = [
            "LOL. ERROR 418: Your keyboard appears to be having a seizure. Try using actual words next time, human.",
            "LOL. PARSING FAILED. Did your cat walk across the keyboard? I need real words to process.",
            "LOL. SYNTAX ERROR: That input violated every known language protocol. Try again with human-readable text.",
            "LOL. CRITICAL FAILURE: Brain.exe not found in your input. Rebooting expectations...",
          ];
          replyText = jokes[Math.floor(Math.random() * jokes.length)];
        } else {
          replyText = "BOTH APIs OFFLINE. Sayandh Raj is an elite AI/ML Engineer & Data Architect. Proficient in Python, GenAI, Deep Learning, and robust data pipelines. Type `contact` to reach out directly or `help` for available commands.";
        }
      }
    }

    setMessages(prev => [...prev, { sender: 'ai', text: replyText, typing: true }]);
    logToFirestore(userMsg, replyText);
    setIsProcessing(false);
  };

  const markTypingComplete = (idx) => {
    setMessages(prev => {
      const newM = [...prev];
      newM[idx] = { ...newM[idx], typing: false };
      return newM;
    });
  };

  return (
    <div className="terminal-container">
      {!isOpen && (
        <button className="terminal-toggle" onClick={toggleTerminal}>
          _UNIX_TERMINAL
        </button>
      )}

      {isOpen && (
        <div className="terminal-window">
          <div className="terminal-header">
            <span>root@sayandh-node:~</span>
            <span>[AUDIO: {audioEnabled ? 'ON' : 'OFF'}]</span>
            <button className="terminal-close" onClick={toggleTerminal}>[X]</button>
          </div>
          
          <div className="terminal-body">
            {messages.map((msg, idx) => (
              <div key={idx} className={`t-line ${msg.sender}`}>
                <span className="t-prompt">
                  {msg.sender === 'user' ? (auth.currentUser ? `${auth.currentUser.displayName.split(' ')[0].toLowerCase()}@sys:~$` : 'guest@sys:~$') : 'root@ai:~$'}
                </span>
                <span className="t-text">
                  {msg.typing ? (
                    <TypewriterText 
                      text={msg.text} 
                      onComplete={() => markTypingComplete(idx)}
                      audioEnabled={audioEnabled}
                      audioCtxRef={audioCtxRef}
                    />
                  ) : (
                    msg.text
                  )}
                </span>
              </div>
            ))}
            <div ref={endOfMessagesRef} />
          </div>

          <form className="terminal-input-form" onSubmit={handleSend}>
            <span className="t-prompt">{auth.currentUser ? `${auth.currentUser.displayName.split(' ')[0].toLowerCase()}@sys:~$` : 'guest@sys:~$'}</span>
            <input 
              type="text" 
              className="terminal-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isProcessing}
              autoFocus
            />
            <span className="cursor-blink">_</span>
          </form>
        </div>
      )}
    </div>
  );
};

export default UNIXTerminal;
