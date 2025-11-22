import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Play, Terminal, Loader2, AlertCircle } from 'lucide-react';
import { GoogleGenAI, FunctionDeclaration, Type } from "@google/genai";
import { Workflow, ExecutionLog, LogStatus } from '../types';

interface Props {
  workflows: Workflow[];
  logs: ExecutionLog[];
  onRunWorkflow: (id: string) => void;
}

interface Message {
  id: string;
  role: 'user' | 'model' | 'system';
  text: string;
  isTool?: boolean;
}

const Assistant: React.FC<Props> = ({ workflows, logs, onRunWorkflow }) => {
  const [messages, setMessages] = useState<Message[]>([
    { 
      id: 'init', 
      role: 'model', 
      text: "Hello! I'm your AutoFlow operations assistant. I can analyze your logs, generate reports, or trigger workflows for you. How can I help?" 
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Define Tools
  const triggerWorkflowTool: FunctionDeclaration = {
    name: 'triggerWorkflow',
    description: 'Triggers or starts a specific automation workflow immediately by its ID.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        workflowId: {
          type: Type.STRING,
          description: 'The unique ID of the workflow to run.',
        },
      },
      required: ['workflowId'],
    },
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputValue.trim() || isProcessing) return;

    const userText = inputValue;
    setInputValue('');
    setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'user', text: userText }]);
    setIsProcessing(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // Construct System Context with current state
      const systemContext = `
        Current System State:
        - Active Workflows: ${workflows.map(w => `${w.name} (ID: ${w.id}, Status: ${w.status})`).join(', ')}
        - Recent Logs (Last 20): ${JSON.stringify(logs.slice(0, 20).map(l => ({ 
            status: l.status, 
            name: l.workflowName, 
            time: l.startTime, 
            msg: l.outputMessage 
          })))}
        - Total Executions: ${logs.length}
        - Failed Count: ${logs.filter(l => l.status === LogStatus.FAILED).length}
        
        Instructions:
        You are an operational AI assistant for AutoFlow. 
        Answer questions concisely based on the provided logs and workflow data. 
        If the user asks to run/start a workflow, use the 'triggerWorkflow' tool.
        Format lists and reports nicely.
      `;

      // We create a chat session, but for this simple implementation we'll just use generateContent 
      // with the history passed as contents or just the user prompt + context for single turn + history.
      // To keep it simple and effective, we'll send the prompt with context.
      
      const model = 'gemini-2.5-flash';
      
      const response = await ai.models.generateContent({
        model,
        contents: [
          { role: 'user', parts: [{ text: systemContext + "\n\nUser Query: " + userText }] }
        ],
        config: {
          tools: [{ functionDeclarations: [triggerWorkflowTool] }],
        }
      });

      const candidate = response.candidates?.[0];
      const toolCalls = candidate?.content?.parts?.filter(p => p.functionCall);
      const textPart = candidate?.content?.parts?.find(p => p.text);

      // Handle Tool Calls
      if (toolCalls && toolCalls.length > 0) {
        for (const part of toolCalls) {
          const call = part.functionCall;
          if (call && call.name === 'triggerWorkflow') {
             const wfId = (call.args as any).workflowId;
             const wf = workflows.find(w => w.id === wfId);
             
             if (wf) {
               onRunWorkflow(wfId);
               const toolResponseText = `Started workflow: ${wf.name}`;
               setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'model', text: `✅ I've started the **${wf.name}** workflow for you. It is now running.` }]);
               
               // Ideally, we'd send the tool response back to the model to get a final text, 
               // but for this UI, a direct confirmation message is often snappier.
             } else {
               setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'model', text: `❌ I couldn't find a workflow with ID ${wfId}.` }]);
             }
          }
        }
      } else if (textPart && textPart.text) {
        setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'model', text: textPart.text }]);
      } else {
         setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'model', text: "I processed that but didn't have a text response." }]);
      }

    } catch (error) {
      console.error("AI Error", error);
      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'model', text: "Sorry, I encountered an error connecting to the AI service." }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const suggestedPrompts = [
    "How many workflows failed today?",
    "Generate a performance report for this week",
    "List all active workflows",
    "Run the 'Weekly Report Generator' workflow"
  ];

  return (
    <div className="h-full flex flex-col animate-in fade-in duration-500 max-h-[calc(100vh-4rem)]">
      <div className="mb-4">
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
          <Bot className="text-blue-600" size={32} />
          AI Assistant
        </h1>
        <p className="text-slate-500 mt-2">Your natural language command center for operations.</p>
      </div>

      {/* Chat Area */}
      <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        
        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
          {messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                msg.role === 'user' ? 'bg-slate-200 text-slate-600' : 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md'
              }`}>
                {msg.role === 'user' ? <User size={20} /> : <Sparkles size={20} />}
              </div>
              
              <div className={`max-w-[80%] rounded-2xl px-5 py-3.5 shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-white text-slate-800 border border-slate-100 rounded-tr-sm' 
                  : 'bg-white text-slate-800 border border-slate-100 rounded-tl-sm'
              }`}>
                <div className="whitespace-pre-wrap leading-relaxed text-sm">
                  {msg.text.split('**').map((part, i) => 
                    i % 2 === 1 ? <strong key={i}>{part}</strong> : part
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {isProcessing && (
             <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-md">
                   <Loader2 size={20} className="animate-spin" />
                </div>
                <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-sm px-5 py-3.5 shadow-sm flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></span>
                  <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-100"></span>
                  <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-200"></span>
                </div>
             </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-slate-200">
          
          {messages.length === 1 && (
             <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                {suggestedPrompts.map((p, i) => (
                   <button 
                     key={i}
                     onClick={() => { setInputValue(p); }}
                     className="text-xs font-medium bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-blue-600 px-3 py-2 rounded-lg border border-slate-200 hover:border-blue-200 transition-colors whitespace-nowrap"
                   >
                     {p}
                   </button>
                ))}
             </div>
          )}

          <form onSubmit={handleSendMessage} className="relative">
            <div className="absolute left-4 top-3.5 text-slate-400">
              <Terminal size={18} />
            </div>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask about logs, stats, or tell me to run a workflow..."
              className="w-full pl-12 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-inner"
              disabled={isProcessing}
            />
            <button 
              type="submit" 
              disabled={!inputValue.trim() || isProcessing}
              className="absolute right-2 top-2 p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:bg-slate-300 transition-colors shadow-sm"
            >
              <Send size={18} />
            </button>
          </form>
          <div className="text-center mt-2">
            <span className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
              <Sparkles size={10} /> Powered by Gemini 2.5 Flash
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Assistant;