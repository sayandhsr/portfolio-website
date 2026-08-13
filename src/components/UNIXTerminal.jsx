import { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { auth, db, googleProvider } from '../firebaseConfig';
import { signInWithPopup } from 'firebase/auth';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import './UNIXTerminal.css';

const SYSTEM_PROMPT = `You are the personal AI agent of Sayandh Raj, an elite AI Engineer & Data Architect. 
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
    
    if (userMsg.toLowerCase() === '> execute tip_matcha.sh') {
      setMessages(prev => [...prev, { sender: 'system', text: `EXECUTING PAYMENT PROTOCOL...`, typing: true }]);
      setTimeout(() => {
        window.open('https://buy.stripe.com/test_placeholder', '_blank');
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

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) throw new Error("NO_GEMINI_KEY");
      
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash", systemInstruction: SYSTEM_PROMPT });
      
      const result = await model.generateContent(userMsg);
      replyText = result.response.text();
    } catch (err) {
      console.warn("Gemini Failed, falling back to OpenRouter", err);
      try {
        const orKey = import.meta.env.VITE_OPENROUTER_API_KEY;
        if (!orKey) throw new Error("NO_OPENROUTER_KEY");

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${orKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "google/gemini-pro",
            messages: [
              { role: "system", content: SYSTEM_PROMPT },
              { role: "user", content: userMsg }
            ]
          })
        });
        const data = await response.json();
        replyText = data.choices[0].message.content;
      } catch (orErr) {
        replyText = "ERR: API TIMEOUT OR UNAVAILABLE. SYSTEM OPERATING IN OFFLINE MODE.";
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
