import React, { useState, useEffect } from 'react';
import './style.css';


declare const vscode: {
  postMessage: (msg: any) => void;
};

export default function App() {
  const [messages, setMessages] = useState<string[]>([]);
  const [input, setInput] = useState('');

  const send = () => {
    if (!input.trim()) return;
    vscode.postMessage({ type: 'chat', content: input });
    setMessages([...messages, `You: ${input}`]);
    setInput('');
  };

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      if (message.type === 'ai-reply') {
        setMessages((prev) => [...prev, `AI: ${message.content}`]);
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  return (
    <div className="container">
      <div className="messages">
        {messages.map((msg, i) => (
          <div key={i} className="message">{msg}</div>
        ))}
      </div>
      <div className="input-box">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask something..."
        />
        <button onClick={send}>Send</button>
      </div>
    </div>
  );
}
