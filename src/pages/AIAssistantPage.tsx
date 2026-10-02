import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  History,
  CornerDownLeft,
  ChevronDown,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { api } from '../services/api.js';

export const AIAssistantPage: React.FC = () => {
  const [messages, setMessages] = useState<
    { id: string; role: string; content: string; toolCalls?: any[]; toolResults?: any }[]
  >([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);
  const [expandedTools, setExpandedTools] = useState<Record<string, boolean>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (customPrompt?: string) => {
    const text = customPrompt || input;
    if (!text.trim() || loading) return;

    const userMsg = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: text,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.ai.chat(text, conversationId);
      if (res.conversationId && !conversationId) {
        setConversationId(res.conversationId);
      }

      setMessages((prev) => [
        ...prev,
        {
          id: res.message.id,
          role: 'assistant',
          content: res.message.content,
          toolCalls: res.toolCalls,
        },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: `⚠️ Failed to execute operation: ${err.message || 'Server error'}. Please verify parameters.`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const toggleToolExpand = (idx: string) => {
    setExpandedTools((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const samplePrompts = [
    {
      category: 'Sales & Leads',
      prompt: 'Add a new lead Apex Logistics from LinkedIn. Contact person is Vikram. Estimated project value ₹4,50,000.',
    },
    {
      category: 'Payments',
      prompt: 'ABC paid ₹40,000 today against their ₹85,000 website project.',
    },
    {
      category: 'Follow-ups',
      prompt: 'What do I need to follow up today?',
    },
    {
      category: 'Pipeline',
      prompt: 'Show my active pipeline.',
    },
    {
      category: 'Receivables',
      prompt: 'Who owes us money?',
    },
    {
      category: 'Client 360°',
      prompt: 'Give me the complete history of ABC Electricals.',
    },
    {
      category: 'Analysis',
      prompt: 'Which deals are likely to close soon based on their current stage and follow-up status?',
    },
    {
      category: 'Reporting',
      prompt: 'Give me my weekly sales report.',
    },
  ];

  return (
    <div className="h-[calc(100vh-7.5rem)] flex flex-col space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <Bot className="w-6 h-6 text-indigo-600" />
              <span>Ops Assistant (Controlled Tools AI)</span>
            </h1>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-400 font-semibold border border-indigo-200 dark:border-indigo-800">
              Safe Backend Tools
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Strict safety boundaries: controlled queries, no destructive deletes without confirmation, never invents statistics.
          </p>
        </div>
      </div>

      {/* Chat Messages Body */}
      <div className="flex-1 overflow-y-auto rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-6 space-y-4 shadow-xs">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 max-w-2xl mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4 shadow-xs">
              <Bot className="w-7 h-7" />
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              PARxCON Ops Assistant Ready
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md">
              Issue natural-language commands to manage leads, record payments, calculate outstanding balances, or query live pipeline metrics.
            </p>

            {/* Quick Command Pills */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-6 w-full text-left">
              {samplePrompts.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(s.prompt)}
                  className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500 bg-slate-50/50 dark:bg-slate-950/40 text-left transition-all group"
                >
                  <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">
                    {s.category}
                  </span>
                  <p className="text-xs text-slate-700 dark:text-slate-300 mt-0.5 line-clamp-2">
                    {s.prompt}
                  </p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div
              key={msg.id || i}
              className={`flex gap-3 text-xs leading-relaxed ${
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`p-4 rounded-2xl max-w-2xl whitespace-pre-line ${
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-br-none shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-bl-none shadow-xs'
                }`}
              >
                <div>{msg.content}</div>

                {/* Controlled Backend Tool Call Traces */}
                {msg.toolCalls && msg.toolCalls.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Executed Controlled Backend Functions:
                    </span>
                    {msg.toolCalls.map((t: any, idx: number) => {
                      const key = `${msg.id}-${idx}`;
                      const isExpanded = !!expandedTools[key];

                      return (
                        <div
                          key={idx}
                          className="rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 text-[11px]"
                        >
                          <div
                            onClick={() => toggleToolExpand(key)}
                            className="flex items-center justify-between cursor-pointer text-emerald-700 dark:text-emerald-400 font-mono font-semibold"
                          >
                            <span className="flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>{t.tool}()</span>
                            </span>
                            {isExpanded ? (
                              <ChevronDown className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5" />
                            )}
                          </div>

                          {isExpanded && (
                            <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] font-mono text-slate-500 overflow-x-auto">
                              <div>Args: {JSON.stringify(t.args)}</div>
                              <div className="mt-1 text-slate-400">Result: {JSON.stringify(t.result)}</div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ))
        )}

        {loading && (
          <div className="flex items-center gap-3 p-3 text-xs text-indigo-600 dark:text-indigo-400">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Consulting database tools and calculating figures...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <div className="relative shrink-0">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Type an operational command (e.g. 'XYZ paid 25k today', 'Who owes us money?')..."
          disabled={loading}
          className="w-full pl-4 pr-24 py-3.5 text-xs sm:text-sm rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-sm"
        />
        <button
          onClick={() => handleSend()}
          disabled={!input.trim() || loading}
          className="absolute right-2 top-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50 shadow-xs"
        >
          <span>Send</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
