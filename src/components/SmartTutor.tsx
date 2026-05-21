import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Loader2, GraduationCap, User } from "lucide-react";
import { generateText } from "../lib/ai-service";
import { TEXT_MODELS } from "../lib/ai-models";
import { getAIConfig } from "../lib/supabase-config";
import { Module, DEFAULT_SMART_TUTOR_CONTEXT } from "../data/learning-content";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface SmartTutorProps {
  currentModule?: Module | null;
}

const SmartTutor = ({ currentModule }: SmartTutorProps = {}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: "assistant", 
      content: "Hello! I am your Smart Tutor. I can help you understand the EOP platform, guide you through the AI modules, or answer any questions about historical preservation. How can I help you today?" 
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setIsLoading(true);

    try {
      const { provider } = getAIConfig();
      const modelId = TEXT_MODELS.find(m => m.provider === provider)?.id || TEXT_MODELS[0].id;
      
      const customContext = localStorage.getItem("eop-smart-tutor-context") || DEFAULT_SMART_TUTOR_CONTEXT;
      
      let systemPrompt = `${customContext}\n\nCURRENT CONTEXT:\nYou are currently assisting the learner in the "${currentModule?.title || "Main Dashboard"}" section of the MOOC.`;
      
      if (currentModule) {
        systemPrompt += `\nModule Details: ${currentModule.shortDesc}`;
      }

      const history = messages.map(m => `${m.role === "user" ? "User" : "Tutor"}: ${m.content}`).join("\n");
      const fullPrompt = `${systemPrompt}\n\nCHAT HISTORY:\n${history}\n\nUser: ${userMsg}\n\nTutor:`;

      const response = await generateText(fullPrompt, modelId);
      setMessages(prev => [...prev, { role: "assistant", content: response }]);
    } catch (err: any) {
      setMessages(prev => [...prev, { role: "assistant", content: `I'm sorry, I encountered an error: ${err.message}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          style={{ 
            position: "fixed", 
            bottom: 32, 
            right: 32, 
            width: 64, 
            height: 64, 
            borderRadius: "50%", 
            background: "var(--grey-1)", 
            color: "white", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center", 
            boxShadow: "0 8px 30px rgba(0,0,0,0.2)",
            border: "none",
            cursor: "pointer",
            zIndex: 1000
          }}
        >
          <MessageCircle style={{ width: 28, height: 28 }} />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div style={{ 
          position: "fixed", 
          bottom: 32, 
          right: 32, 
          width: 400, 
          height: 600, 
          background: "white", 
          borderRadius: 24, 
          boxShadow: "0 12px 40px rgba(0,0,0,0.15)", 
          display: "flex", 
          flexDirection: "column",
          zIndex: 1001,
          border: "1px solid var(--grey-5)",
          overflow: "hidden"
        }} className="animate-in slide-in-from-bottom-8 duration-300">
          {/* Header */}
          <div style={{ padding: "20px 24px", background: "var(--grey-1)", color: "white", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyCenter: "center" }}>
                <GraduationCap style={{ width: 20, height: 20 }} />
              </div>
              <div>
                <h3 style={{ fontSize: "1rem", fontWeight: 600 }}>Smart Tutor</h3>
                <p style={{ fontSize: "0.75rem", opacity: 0.7 }}>Erasmus+ AI Assistant</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} style={{ background: "none", border: "none", color: "white", cursor: "pointer" }}>
              <X style={{ width: 20, height: 20 }} />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} style={{ flexGrow: 1, padding: 24, overflowY: "auto", display: "flex", flexDirection: "column", gap: 16 }}>
            {messages.map((m, idx) => (
              <div key={idx} style={{ 
                display: "flex", 
                flexDirection: m.role === "user" ? "row-reverse" : "row", 
                gap: 12,
                alignItems: "flex-start" 
              }}>
                <div style={{ 
                  width: 32, 
                  height: 32, 
                  borderRadius: "50%", 
                  background: m.role === "user" ? "var(--grey-5)" : "var(--grey-6)", 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center",
                  flexShrink: 0
                }}>
                  {m.role === "user" ? <User style={{ width: 16, height: 16 }} /> : <GraduationCap style={{ width: 16, height: 16 }} />}
                </div>
                <div style={{ 
                  padding: "12px 16px", 
                  borderRadius: 16, 
                  fontSize: "0.9rem", 
                  lineHeight: 1.5,
                  background: m.role === "user" ? "var(--grey-1)" : "var(--grey-6)",
                  color: m.role === "user" ? "white" : "var(--grey-1)",
                  maxWidth: "80%",
                  whiteSpace: "pre-wrap"
                }}>
                  {m.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--grey-6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <GraduationCap style={{ width: 16, height: 16 }} />
                </div>
                <Loader2 style={{ width: 20, height: 20 }} className="animate-spin text-grey-3" />
              </div>
            )}
          </div>

          {/* Input */}
          <div style={{ padding: 20, borderTop: "1px solid var(--grey-5)", display: "flex", gap: 12 }}>
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Ask a question..."
              style={{ flexGrow: 1, border: "1px solid var(--grey-5)", borderRadius: 12, padding: "10px 16px", fontSize: "0.9rem", outline: "none" }}
            />
            <button 
              onClick={handleSend} 
              disabled={!input.trim() || isLoading}
              style={{ 
                width: 44, 
                height: 44, 
                borderRadius: 12, 
                background: "var(--grey-1)", 
                color: "white", 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center",
                border: "none",
                cursor: "pointer",
                opacity: !input.trim() || isLoading ? 0.5 : 1
              }}
            >
              <Send style={{ width: 18, height: 18 }} />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default SmartTutor;
