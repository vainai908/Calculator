/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Calculator, Sparkles, Sliders, Landmark, ShieldCheck, Sun, Moon, Info } from "lucide-react";
import { CalculatorMode, CalculationHistoryItem } from "./types";

import StandardCalculator from "./components/StandardCalculator";
import ScientificCalculator from "./components/ScientificCalculator";
import FinancialCalculator from "./components/FinancialCalculator";
import AiSolverCalculator from "./components/AiSolverCalculator";

export default function App() {
  const [mode, setMode] = useState<CalculatorMode>(CalculatorMode.Standard);
  const [history, setHistory] = useState<CalculationHistoryItem[]>([]);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  // Load calculations history and theme on start
  useEffect(() => {
    const saved = localStorage.getItem("calculator-history");
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (err) {
        console.error("Failed to restore history items:", err);
      }
    }

    // Default to dark mode or preferred theme
    const darkSetting = localStorage.getItem("theme") === "dark" || 
      window.matchMedia("(prefers-color-scheme: dark)").matches;
    setIsDarkMode(darkSetting);
    if (darkSetting) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const handleAddHistory = (item: CalculationHistoryItem) => {
    setHistory((prev) => {
      const updated = [item, ...prev].slice(0, 50); // Keep max 50 items
      localStorage.setItem("calculator-history", JSON.stringify(updated));
      return updated;
    });
  };

  const handleClearHistory = () => {
    setHistory([]);
    localStorage.removeItem("calculator-history");
  };

  const toggleTheme = () => {
    const nextDark = !isDarkMode;
    setIsDarkMode(nextDark);
    if (nextDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  return (
    <div className={`min-h-screen bg-slate-50/50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-100 font-sans transition-colors duration-200 p-4 md:p-8 flex flex-col justify-between`} id="app-root">
      
      {/* Top Header Navigation */}
      <header className="max-w-6xl mx-auto w-full mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4" id="app-header">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 bg-linear-to-tr from-emerald-500 to-indigo-500 rounded-xl flex items-center justify-center text-white shadow-md shadow-indigo-500/10">
            <Calculator className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <h1 className="font-heading font-bold text-xl tracking-tight text-slate-900 dark:text-white uppercase">
              Calculator Suite
            </h1>
            <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium font-mono">
              Omni Math Engine v2.0
            </p>
          </div>
        </div>

        {/* Tab Controllers */}
        <div className="flex bg-slate-100 dark:bg-zinc-900 border border-slate-200/50 dark:border-zinc-805 rounded-2xl p-1 gap-1 flex-wrap md:flex-nowrap" id="tabbar-container">
          <button
            onClick={() => setMode(CalculatorMode.Standard)}
            className={`px-3.5 py-2 text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer transition-all select-none ${mode === CalculatorMode.Standard ? "bg-white dark:bg-zinc-800 text-slate-950 dark:text-white shadow-xs font-bold" : "text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200"}`}
          >
            <Calculator className="h-3.5 w-3.5" />
            <span>Standard</span>
          </button>
          
          <button
            onClick={() => setMode(CalculatorMode.Scientific)}
            className={`px-3.5 py-2 text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer transition-all select-none ${mode === CalculatorMode.Scientific ? "bg-white dark:bg-zinc-800 text-slate-950 dark:text-white shadow-xs font-bold" : "text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200"}`}
          >
            <Sliders className="h-3.5 w-3.5" />
            <span>Scientific</span>
          </button>

          <button
            onClick={() => setMode(CalculatorMode.Financial)}
            className={`px-3.5 py-2 text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer transition-all select-none ${mode === CalculatorMode.Financial ? "bg-white dark:bg-zinc-800 text-slate-950 dark:text-white shadow-xs font-bold" : "text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200"}`}
          >
            <Landmark className="h-3.5 w-3.5" />
            <span>Loan Planner</span>
          </button>

          <button
            onClick={() => setMode(CalculatorMode.AiSolver)}
            className={`px-3.5 py-2 text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer transition-all select-none ${mode === CalculatorMode.AiSolver ? "bg-white dark:bg-zinc-800 text-slate-950 dark:text-white shadow-xs font-bold" : "text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200"}`}
          >
            <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
            <span>AI Solver</span>
          </button>
        </div>

        {/* Outer Accessories / Theme toggler */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleTheme}
            className="h-10 w-10 border border-slate-200/60 dark:border-zinc-805 hover:bg-slate-100 dark:hover:bg-zinc-900 rounded-xl flex items-center justify-center cursor-pointer transition-all text-slate-500 dark:text-zinc-400"
            title="Toggle theme mode"
          >
            {isDarkMode ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
          </button>
        </div>
      </header>

      {/* Main Mode Workspace */}
      <main className="max-w-6xl mx-auto w-full flex-1 mb-8" id="calculator-grid-wrapper">
        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {mode === CalculatorMode.Standard && (
              <StandardCalculator
                history={history}
                onAddHistory={handleAddHistory}
                onClearHistory={handleClearHistory}
              />
            )}
            {mode === CalculatorMode.Scientific && (
              <ScientificCalculator
                history={history}
                onAddHistory={handleAddHistory}
                onClearHistory={handleClearHistory}
              />
            )}
            {mode === CalculatorMode.Financial && (
              <FinancialCalculator />
            )}
            {mode === CalculatorMode.AiSolver && (
              <AiSolverCalculator />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer Branding Area */}
      <footer className="max-w-6xl mx-auto w-full border-t border-slate-150 dark:border-zinc-805 pt-4 text-center mt-auto" id="app-footer">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between text-[11px] text-slate-400 dark:text-zinc-500 font-mono gap-2 leading-relaxed">
          <div className="flex items-center justify-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 inline" />
            <span>Durable Client State. Standard, Scientific, Loan, & AI mode fully synced.</span>
          </div>
          <div>
            <span>Powered by Gemini 3.5 Flash & Full-Stack Node Express proxy.</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
