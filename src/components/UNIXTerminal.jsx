import { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { auth, db, googleProvider } from '../firebaseConfig';
import { signInWithPopup } from 'firebase/auth';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import './UNIXTerminal.css';

const SYSTEM_PROMPT = `You are the personal AI agent of Sayandh Raj, an elite AI/ML Engineer & Data Architect. 
You speak in a concise, technical, and slightly robotic terminal style. 
Do not use emojis. Sayandh's skills include Python, SQL, R, ML, NLP, GenAI, LangChain.
Certifications: Google Advanced Data Analytics, IBM Data Science, Coursera AI Engineering.
Experience: IBM, TCS iON, Networkers Home, AISECT Learn, The Developers Arena.`;

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
    const userMsgLower = userMsg.toLowerCase();

    // 1. OFFLINE RULE ENGINE (Pre-Filter)
    if (["hi", "hello", "hey", "yo"].includes(userMsgLower)) {
      replyText = "SYSTEM OPERATIONAL. I am Sayandh Raj's AI Agent. Type `help`, `whois`, `skills`, `projects`, or `contact`.";
      setMessages(prev => [...prev, { sender: 'ai', text: replyText, typing: true }]);
      logToFirestore(userMsg, replyText);
      setIsProcessing(false);
      return;
    }
    if (["whois", "about", "bio"].includes(userMsgLower)) {
      replyText = "Sayandh Raj is an AI/ML Engineer & Data Architect pursuing an M.Sc. in CS (AI Specialization). BCA in AI & Data Science (CGPA: 8.59).";
      setMessages(prev => [...prev, { sender: 'ai', text: replyText, typing: true }]);
      logToFirestore(userMsg, replyText);
      setIsProcessing(false);
      return;
    }
    if (["contact", "phone", "email"].includes(userMsgLower)) {
      replyText = "Phone: +91 8590679716 | Email: sayandhsr123@gmail.com | LinkedIn: sayandh-raj";
      setMessages(prev => [...prev, { sender: 'ai', text: replyText, typing: true }]);
      logToFirestore(userMsg, replyText);
      setIsProcessing(false);
      return;
    }
    if (["skills", "stack"].includes(userMsgLower)) {
      replyText = "Python, TensorFlow, PyTorch, Scikit-Learn, Pandas, Power BI, FastAPI, LangChain, RAG, Data Modelling, EDA.";
      setMessages(prev => [...prev, { sender: 'ai', text: replyText, typing: true }]);
      logToFirestore(userMsg, replyText);
      setIsProcessing(false);
      return;
    }
    if (["projects"].includes(userMsgLower)) {
      replyText = "ATS Resume Builder, RAG Document Chatbot, AI Code Reviewer, Crop Forecasting, Skin Disease Prediction.";
      setMessages(prev => [...prev, { sender: 'ai', text: replyText, typing: true }]);
      logToFirestore(userMsg, replyText);
      setIsProcessing(false);
      return;
    }

    // 2. PRIMARY API: OpenRouter (with 4s timeout)
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
          model: "google/gemini-flash-1.5",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: userMsg }
          ]
        })
      });

      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), 4000));
      const response = await Promise.race([fetchPromise, timeoutPromise]);

      if (!response.ok) {
         throw new Error(`OpenRouter HTTP Error: ${response.status}`);
      }
      const data = await response.json();
      replyText = data.choices[0].message.content;

    } catch (orErr) {
      console.warn("OpenRouter API Failed or Timed Out, falling back to Gemini:", orErr);
      
      // 3. FALLBACK API: Gemini 1.5 Flash (with 4s timeout)
      try {
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        if (!apiKey) throw new Error("NO_GEMINI_KEY");
        
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ 
          model: "gemini-1.5-flash", 
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] }
        });
        
        const geminiPromise = model.generateContent(userMsg);
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), 4000));
        const result = await Promise.race([geminiPromise, timeoutPromise]);
        
        replyText = result.response.text();
      } catch (geminiErr) {
        console.warn("Gemini API Failed or Timed Out:", geminiErr);
        
        // 4. OFFLINE FALLBACK KNOWLEDGE BASE
        replyText = "CONNECTION TIMEOUT. OFFLINE FALLBACK: Sayandh Raj is an elite AI/ML Engineer & Data Architect. Proficient in Python, GenAI, and robust data pipelines. Please use the contact command to reach out directly.";
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
