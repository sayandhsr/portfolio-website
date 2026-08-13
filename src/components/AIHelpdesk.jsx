import { useState, useRef, useEffect } from 'react';
import './AIHelpdesk.css';

const AIHelpdesk = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: 'system', text: 'TERMINAL INITIALIZED. HOW CAN I ASSIST?' }
  ]);
  const [input, setInput] = useState('');
  const endOfMessagesRef = useRef(null);

  const toggleTerminal = () => setIsOpen(!isOpen);

  useEffect(() => {
    if (isOpen) {
      endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = input.trim();
    setMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setInput('');

    // LLM Stub Logic
    const apiKey = import.meta.env.VITE_LLM_API_KEY;
    
    setMessages(prev => [...prev, { sender: 'system', text: 'PROCESSING...' }]);

    setTimeout(() => {
      setMessages(prev => {
        const newMsgs = [...prev];
        newMsgs.pop(); // remove 'PROCESSING...'
        
        let reply = "ERR: LLM API KEY NOT CONFIGURED. SYSTEM OPERATING IN MOCK MODE. Sayandh Raj is a highly skilled AI & Data Science Engineer.";
        if (apiKey) {
           // In the future, make a real API call here using apiKey
           reply = `RECEIVED: "${userMsg}". (API integration active placeholder)`;
        }
        
        return [...newMsgs, { sender: 'system', text: reply }];
      });
    }, 1000);
  };

  return (
    <div className="helpdesk-container">
      {!isOpen && (
        <button className="helpdesk-toggle" onClick={toggleTerminal}>
          _TERMINAL
        </button>
      )}

      {isOpen && (
        <div className="helpdesk-window">
          <div className="helpdesk-header">
            <span>SYS_ADMIN // HELPDESK</span>
            <button className="helpdesk-close" onClick={toggleTerminal}>X</button>
          </div>
          
          <div className="helpdesk-messages">
            {messages.map((msg, idx) => (
              <div key={idx} className={`msg-line ${msg.sender}`}>
                <span className="prompt-sym">{msg.sender === 'system' ? 'root@sayandh:~$' : 'guest@sys:~$'}</span>
                <span className="msg-text">{msg.text}</span>
              </div>
            ))}
            <div ref={endOfMessagesRef} />
          </div>

          <form className="helpdesk-input-form" onSubmit={handleSend}>
            <span className="prompt-sym input-prompt">guest@sys:~$</span>
            <input 
              type="text" 
              className="helpdesk-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="ENTER COMMAND..."
              autoFocus
            />
          </form>
        </div>
      )}
    </div>
  );
};

export default AIHelpdesk;
