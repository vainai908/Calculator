/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, Send, BrainCircuit, CornerDownLeft, RotateCcw, AlertTriangle, BookOpen, Calculator, Landmark, Zap } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { ChatMessage } from "../types";

export default function AiSolverCalculator() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      sender: "ai",
      text: "Hello! I am your AI Mathematical & Financial Problem Solver, fueled by Gemini.\n\nYou can ask me complex algebraic equations, real-world finance/loan logic, integrals, physics equations, or word problems. I'll break down the steps and verify formulas for you!\n\nTry typing a problem or selecting one of the interactive templates below to begin.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const presets = [
    {
      id: "algebra",
      title: "Algebra & Roots",
      desc: "Solve: 3x + 2y = 12, 2x - y = 1",
      prompt: "Solve the system of linear equations step by step and explain each process: \n1) 3x + 2y = 12\n2) 2x - y = 1",
      icon: Calculator,
      color: "text-indigo-500 bg-indigo-50 dark:bg-indigo-900/10",
    },
    {
      id: "finance",
      title: "Compound Interest",
      desc: "7 years on $10K at 5.5%",
      prompt: "Calculate the total compound interest for a principal amount of $10,000 invested at an annual interest rate of 5.5% compounded quarterly for a duration of 7 years. Show the mathematical compound interest formula and annual multipliers.",
      icon: Landmark,
      color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-900/10",
    },
    {
      id: "physics",
      title: "Physics Mechanics",
      desc: "Free fall height over time",
      prompt: "An object is dropped from a cliff and falls freely under gravity (g = 9.81 m/s^2). Calculate its velocity and the total distance fallen after 4.5 seconds. Show standard equations of uniformly accelerated motion.",
      icon: Zap,
      color: "text-amber-500 bg-amber-50 dark:bg-amber-900/10",
    },
  ];

  useEffect(() => {
    // Auto Scroll to Bottom of logs
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async (customPrompt?: string) => {
    const activePrompt = (customPrompt || input).trim();
    if (!activePrompt || isLoading) return;

    if (!customPrompt) {
      setInput("");
    }

    const userMsg: ChatMessage = {
      id: Math.random().toString(36).substring(2, 9),
      sender: "user",
      text: activePrompt,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const response = await fetch("/api/gemini/solve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: activePrompt }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to solve problem.");
      }

      const aiMsg: ChatMessage = {
        id: Math.random().toString(36).substring(2, 9),
        sender: "ai",
        text: data.text,
        timestamp: new Date(),
        status: "success",
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (error: any) {
      const aiMsg: ChatMessage = {
        id: Math.random().toString(36).substring(2, 9),
        sender: "ai",
        text: `Error: ${error.message || "Could not reach the AI solver. Please verify the Gemini API key is configured properly in Secrets."}`,
        timestamp: new Date(),
        status: "error",
      };
      setMessages((prev) => [...prev, aiMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: "welcome",
        sender: "ai",
        text: "Hello! I am your AI Mathematical & Financial Problem Solver, fueled by Gemini.\n\nYou can ask me complex algebraic equations, real-world finance/loan logic, integrals, physics equations, or word problems. I'll break down the steps and verify formulas for you!\n\nTry typing a problem or selecting one of the interactive templates below to begin.",
        timestamp: new Date(),
      },
    ]);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start h-full" id="ai-calc-workspace">
      {/* Workspace Panel: Column Span 3 */}
      <div className="lg:col-span-3 bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/60 rounded-3xl flex flex-col h-[520px] shadow-xs relative overflow-hidden" id="workspace-core">
        
        {/* Chat Pane Header */}
        <div className="border-b border-slate-100 dark:border-zinc-805 p-4 flex items-center justify-between bg-slate-50/50 dark:bg-zinc-950/20">
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-indigo-500 animate-pulse" />
            <span className="font-heading font-semibold text-slate-800 dark:text-zinc-100 text-sm">
              AI Mathematical Solver Workspace
            </span>
          </div>

          <button
            onClick={handleClearChat}
            className="text-xs text-slate-400 hover:text-rose-500 dark:text-zinc-500 dark:hover:text-rose-400 flex items-center gap-1 cursor-pointer transition-colors"
            title="Reset Chat Workspace"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset Setup</span>
          </button>
        </div>

        {/* Messaging Area */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin"
        >
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className={`flex gap-3 max-w-[85%] ${msg.sender === "user" ? "ml-auto flex-row-reverse" : ""}`}
              >
                {/* Avatar Icon */}
                <div className={`h-8 w-8 rounded-full shrink-0 flex items-center justify-center border text-xs font-bold ${msg.sender === "user" ? "bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border-slate-200/50 dark:border-zinc-700" : "bg-indigo-500 text-white border-transparent"}`}>
                  {msg.sender === "user" ? "ME" : "AI"}
                </div>

                {/* Bubble */}
                <div className={`p-3.5 rounded-2xl text-sm leading-relaxed ${
                  msg.sender === "user" 
                    ? "bg-indigo-500 text-white rounded-tr-none" 
                    : msg.status === "error"
                      ? "bg-rose-500/10 border border-rose-500/25 text-rose-700 dark:text-rose-400 rounded-tl-none font-sans"
                      : "bg-slate-50 dark:bg-zinc-950 border border-slate-150/50 dark:border-zinc-805 text-slate-800 dark:text-zinc-200 rounded-tl-none font-sans"
                }`}>
                  {msg.sender === "user" ? (
                    <div className="whitespace-pre-wrap font-sans font-medium">{msg.text}</div>
                  ) : (
                    <div className="markdown-body text-slate-700 dark:text-zinc-250 prose prose-sm dark:prose-invert max-w-none text-left font-sans">
                      <ReactMarkdown>{msg.text}</ReactMarkdown>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}

            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-3 max-w-[85%]"
              >
                <div className="h-8 w-8 rounded-full bg-indigo-500 text-white flex items-center justify-center text-xs font-bold shrink-0">
                  AI
                </div>
                <div className="p-3.5 rounded-2xl bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-100/30 dark:border-indigo-900/10 rounded-tl-none flex items-center gap-2.5">
                  <BrainCircuit className="h-4.5 w-4.5 text-indigo-500 animate-spin" />
                  <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400 font-sans">
                    Calculating variables, checking formulas & solving step-by-step...
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Input Panel */}
        <div className="border-t border-slate-150 dark:border-zinc-805 p-3.5 bg-slate-50/50 dark:bg-zinc-950/10 flex items-center gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Type your algebraic equation, loan query, or word problem here... (Press Enter to send)"
            className="flex-1 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-zinc-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 resize-none h-11 min-h-[44px] scrollbar-none font-sans"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            className={`h-11 w-11 shrink-0 rounded-xl flex items-center justify-center cursor-pointer transition-all ${
              input.trim() && !isLoading 
                ? "bg-indigo-500 hover:bg-indigo-600 text-white shadow-xs" 
                : "bg-slate-100 dark:bg-zinc-800 text-slate-400 cursor-not-allowed"
            }`}
            title="Solve Problem"
          >
            <Send className="h-4.5 w-4.5 animate-pulse" />
          </button>
        </div>

      </div>

      {/* Preset Side Guides Panel */}
      <div className="bg-slate-50 dark:bg-zinc-950/20 border border-slate-200/50 dark:border-zinc-808 rounded-3xl p-5 space-y-4 shadow-xs" id="presets-sidebar">
        <div className="border-b border-slate-200/60 dark:border-zinc-800 pb-3">
          <h4 className="font-heading font-semibold text-slate-800 dark:text-zinc-100 text-sm flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-indigo-500" />
            Solving Presets
          </h4>
          <p className="text-[10px] text-slate-400 mt-1">
            Tap on any equation template below to load and feed it directly into the AI solver:
          </p>
        </div>

        {/* Presets List */}
        <div className="grid grid-cols-1 gap-3">
          {presets.map((p) => {
            const Icon = p.icon;
            return (
              <button
                key={p.id}
                onClick={() => handleSend(p.prompt)}
                disabled={isLoading}
                className="w-full p-3 rounded-2xl border border-slate-150 dark:border-zinc-805 bg-white dark:bg-zinc-900 duration-200 hover:border-indigo-400 dark:hover:border-indigo-900 hover:shadow-xs hover:bg-slate-50/50 text-left cursor-pointer transition-all select-none font-sans"
              >
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${p.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="font-semibold text-slate-800 dark:text-zinc-100 text-xs text-left">
                    {p.title}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 mt-1 truncate">
                  {p.desc}
                </div>
              </button>
            );
          })}
        </div>

        {/* Warning card for missing credentials */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-805 p-3.5 rounded-2xl flex items-start gap-2.5 text-[11px] text-slate-500 leading-normal">
          <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-slate-700 dark:text-zinc-300 block mb-0.5">Gemini System Note</span>
            API processing is triggered server-side. Ensure your key is populated in the AI Studio environment settings if solving times appear flat or timeout.
          </div>
        </div>
      </div>
    </div>
  );
}
