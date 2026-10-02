import React, { useState } from 'react';
import { Bot, Send, Sparkles, Loader2, CheckCircle2, ArrowRight } from 'lucide-react';
import { Modal } from '../common/Modal.js';
import { api } from '../../services/api.js';

interface QuickAIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onActionCompleted?: () => void;
}

export const QuickAIAssistantModal: React.FC<QuickAIAssistantModalProps> = ({
  isOpen,
  onClose,
  onActionCompleted,
}) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<
    { role: 'user' | 'assistant'; text: string; tools?: any[] }[]
  >([]);

  const handleSend = async (commandToSend?: string) => {
    const text = commandToSend || prompt;
    if (!text.trim() || loading) return;

    const newHistory = [...history, { role: 'user' as const, text }];
    setHistory(newHistory);
    setPrompt('');
    setLoading(true);

    try {
      const res = await api.ai.chat(text);
      setHistory([
        ...newHistory,
        {
          role: 'assistant',
          text: res.message.content,
          tools: res.toolCalls,
        },
      ]);
      if (onActionCompleted && res.toolCalls && res.toolCalls.length > 0) {
        onActionCompleted();
      }
    } catch (err: any) {
      setHistory([
        ...newHistory,
        {
          role: 'assistant',
          text: `⚠️ Execution error: ${err.message || 'Failed to process command.'}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const sampleCommands = [
    'What do I need to follow up today?',
    'Show my active pipeline',
    'Who owes us money?',
    'XYZ paid 25k today',
    'Add a new lead ABC Electricals from LinkedIn, 85k project',
    'Give me my weekly sales report',
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="PARxCON Ops Assistant"
      subtitle="Execute operations, track leads, record payments, and pull live metrics"
      maxWidth="2xl"
    >
      <div className="space-y-4">
        {/* Chat Stream */}
        <div className="h-80 overflow-y-auto rounded-xl bg-slate-50 dark:bg-slate-950 p-4 border border-slate-200 dark:border-slate-800 space-y-3">
          {history.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6">
              <div className="p-3 bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-full mb-3">
                <Bot className="w-8 h-8" />
              </div>
              <h4 className="font-semibold text-slate-800 dark:text-white text-sm">
                Ready for operational commands
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
                Try a natural-language instruction below to query records, create leads, or record payments.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4 w-full text-left">
                {sampleCommands.slice(0, 4).map((cmd, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(cmd)}
                    className="text-xs p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500 text-slate-700 dark:text-slate-300 transition-colors flex items-center justify-between group"
                  >
                    <span className="truncate">{cmd}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 shrink-0 ml-1" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            history.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-3 text-xs leading-relaxed ${
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}
                <div
                  className={`p-3 rounded-xl max-w-[85%] whitespace-pre-line ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-none'
                      : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-none shadow-xs'
                  }`}
                >
                  {msg.text}
                  {msg.tools && msg.tools.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap gap-1">
                      {msg.tools.map((t, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-mono text-[10px]"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          {t.tool}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          {loading && (
            <div className="flex items-center gap-2 text-xs text-indigo-600 dark:text-indigo-400 p-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Analyzing command and executing controlled tools...</span>
            </div>
          )}
        </div>

        {/* Command Input */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="e.g. Added a new lead XYZ Interiors from LinkedIn, 1.2 lakh..."
              disabled={loading}
              className="w-full pl-4 pr-10 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
            <Sparkles className="absolute right-3 top-3 w-4 h-4 text-indigo-400 pointer-events-none" />
          </div>
          <button
            onClick={() => handleSend()}
            disabled={!prompt.trim() || loading}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Execute</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
