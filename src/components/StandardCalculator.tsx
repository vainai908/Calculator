/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Delete, RotateCcw, HelpCircle, History, BookOpen } from "lucide-react";
import { CalculationHistoryItem } from "../types";

interface StandardCalculatorProps {
  history: CalculationHistoryItem[];
  onAddHistory: (item: CalculationHistoryItem) => void;
  onClearHistory: () => void;
}

export default function StandardCalculator({
  history,
  onAddHistory,
  onClearHistory,
}: StandardCalculatorProps) {
  const [display, setDisplay] = useState<string>("");
  const [equation, setEquation] = useState<string>("");
  const [isDone, setIsDone] = useState<boolean>(false);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Keyboard support mapping
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore when focused in input blocks (e.g. AI panel or numbers input)
      if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA") {
        return;
      }

      const key = e.key;
      if (/[0-9]/.test(key)) {
        handleInput(key);
      } else if (key === ".") {
        handleInput(".");
      } else if (key === "+") {
        handleInput("+");
      } else if (key === "-") {
        handleInput("-");
      } else if (key === "*") {
        handleInput("×");
      } else if (key === "/") {
        handleInput("÷");
      } else if (key === "Enter" || key === "=") {
        e.preventDefault();
        handleEvaluate();
      } else if (key === "Backspace") {
        handleBackspace();
      } else if (key === "Escape" || key === "c" || key === "C") {
        handleClear();
      } else if (key === "(") {
        handleInput("(");
      } else if (key === ")") {
        handleInput(")");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [equation, isDone]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [equation, display]);

  const handleInput = (val: string) => {
    if (isDone) {
      if (["+", "−", "×", "÷", "%"].includes(val)) {
        setEquation(display + " " + val + " ");
      } else {
        setEquation(val);
      }
      setIsDone(false);
      return;
    }

    // Check operators for clean spacing
    if (["+", "−", "×", "÷"].includes(val)) {
      setEquation((prev) => prev + " " + val + " ");
    } else if (val === "%") {
      setEquation((prev) => prev + "%");
    } else {
      setEquation((prev) => prev + val);
    }
  };

  const handleClear = () => {
    setEquation("");
    setDisplay("");
    setIsDone(false);
  };

  const handleBackspace = () => {
    if (isDone) {
      handleClear();
      return;
    }
    setEquation((prev) => {
      const trimmed = prev.trim();
      if (trimmed.endsWith("+") || trimmed.endsWith("−") || trimmed.endsWith("×") || trimmed.endsWith("÷")) {
        return trimmed.slice(0, -1).trim();
      }
      return prev.slice(0, -1);
    });
  };

  const handleNegate = () => {
    if (isDone) {
      if (display.startsWith("-")) {
        setEquation(display.substring(1));
      } else if (display !== "0" && display !== "") {
        setEquation("-" + display);
      }
      setIsDone(false);
      return;
    }

    // Negate the current trailing number or parenthetical block
    setEquation((prev) => {
      if (!prev) return "-";
      // Check if it already has a trailing minus
      if (prev.endsWith("-")) return prev.slice(0, -1);
      
      const tokens = prev.trim().split(" ");
      const lastToken = tokens[tokens.length - 1];
      if (!isNaN(Number(lastToken)) && lastToken !== "") {
        if (lastToken.startsWith("-")) {
          tokens[tokens.length - 1] = lastToken.substring(1);
        } else {
          tokens[tokens.length - 1] = "-" + lastToken;
        }
        return tokens.join(" ");
      }
      
      return prev + " -";
    });
  };

  const handleEvaluate = () => {
    if (!equation.trim()) return;

    try {
      // Translate readable math operators to standard JS operators
      let formattedExpr = equation
        .replaceAll("×", "*")
        .replaceAll("÷", "/")
        .replaceAll("−", "-")
        .replaceAll("%", "* 0.01");

      // Simple security check for arbitrary evaluations
      if (/[^0-9.+\-*/%() ]/g.test(formattedExpr)) {
        throw new Error("Invalid characters");
      }

      // Safe evaluation context using Function
      const mathFn = new Function(`return (${formattedExpr})`);
      const rawResult = mathFn();

      if (rawResult === undefined || isNaN(rawResult)) {
        throw new Error("NaN");
      }

      if (rawResult === Infinity || rawResult === -Infinity) {
        setDisplay("Cannot divide by 0");
        setIsDone(true);
        return;
      }

      // Format decimals cleanly
      const roundedResult = Number(Number(rawResult).toFixed(8)).toString();
      setDisplay(roundedResult);

      const newItem: CalculationHistoryItem = {
        id: Math.random().toString(36).substring(2, 9),
        expression: equation,
        result: roundedResult,
        timestamp: new Date(),
        mode: "standard",
      };
      onAddHistory(newItem);
      setIsDone(true);
    } catch (err) {
      setDisplay("Error");
      setIsDone(true);
    }
  };

  const handleHistoryItemClick = (item: CalculationHistoryItem) => {
    setEquation(item.expression);
    setDisplay(item.result);
    setIsDone(false);
    setShowHistory(false);
  };

  const btnClass = (isOp = false, isSpecial = false) => {
    if (isOp) {
      return "bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-medium text-lg rounded-2xl aspect-square flex items-center justify-center cursor-pointer transition-colors shadow-sm";
    }
    if (isSpecial) {
      return "bg-slate-200 dark:bg-zinc-800 hover:bg-slate-300 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 font-medium text-base rounded-2xl aspect-square flex items-center justify-center cursor-pointer transition-colors shadow-sm";
    }
    return "bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-850 text-slate-800 dark:text-zinc-100 text-lg font-normal rounded-2xl aspect-square flex items-center justify-center cursor-pointer transition-colors shadow-xs border border-slate-100 dark:border-zinc-800/10";
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start h-full" id="standard-calc-container">
      {/* Calculator Body */}
      <div className="lg:col-span-3 bg-slate-50 dark:bg-zinc-950/20 rounded-3xl p-6 border border-slate-200/50 dark:border-zinc-800/20 shadow-xl max-w-md mx-auto w-full flex flex-col justify-between" id="calculator-box">
        {/* Output Panel */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl p-4 mb-5 text-right relative overflow-hidden group">
          <div className="absolute top-2 right-2 flex items-center gap-2">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="p-1 px-2 rounded-lg bg-slate-50 dark:bg-zinc-800 text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200 text-xs flex items-center gap-1 border border-slate-100 dark:border-zinc-700 cursor-pointer transition-all"
              title="Show history"
            >
              <History className="h-3.5 w-3.5" />
              <span>History</span>
            </button>
          </div>

          <div 
            ref={scrollRef}
            className="text-slate-400 dark:text-zinc-500 text-sm font-mono tracking-tight whitespace-nowrap overflow-x-auto min-h-[24px] pr-1 scrollbar-none pt-4"
          >
            {equation || "0"}
          </div>
          <div className="text-slate-900 dark:text-zinc-50 text-3xl font-semibold font-sans tracking-tight truncate mt-1 select-all">
            {display || (equation ? "" : "0")}
          </div>
        </div>

        {/* Buttons Grid */}
        <div className="grid grid-cols-4 gap-3 font-sans">
          {/* Row 1 */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleClear}
            className="bg-rose-500/10 hover:bg-rose-500/20 active:bg-rose-500/30 text-rose-600 dark:text-rose-400 font-semibold text-base rounded-2xl aspect-square flex items-center justify-center cursor-pointer transition-colors shadow-xs border border-rose-500/10"
            id="btn-ac"
          >
            AC
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => handleInput("(")}
            className={btnClass(false, true)}
            id="btn-lp"
          >
            (
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => handleInput(")")}
            className={btnClass(false, true)}
            id="btn-rp"
          >
            )
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => handleInput("÷")}
            className={btnClass(true)}
            id="btn-div"
          >
            ÷
          </motion.button>

          {/* Row 2 */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => handleInput("7")}
            className={btnClass()}
            id="btn-7"
          >
            7
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => handleInput("8")}
            className={btnClass()}
            id="btn-8"
          >
            8
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => handleInput("9")}
            className={btnClass()}
            id="btn-9"
          >
            9
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => handleInput("×")}
            className={btnClass(true)}
            id="btn-mul"
          >
            ×
          </motion.button>

          {/* Row 3 */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => handleInput("4")}
            className={btnClass()}
            id="btn-4"
          >
            4
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => handleInput("5")}
            className={btnClass()}
            id="btn-5"
          >
            5
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => handleInput("6")}
            className={btnClass()}
            id="btn-6"
          >
            6
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => handleInput("−")}
            className={btnClass(true)}
            id="btn-sub"
          >
            −
          </motion.button>

          {/* Row 4 */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => handleInput("1")}
            className={btnClass()}
            id="btn-1"
          >
            1
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => handleInput("2")}
            className={btnClass()}
            id="btn-2"
          >
            2
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => handleInput("3")}
            className={btnClass()}
            id="btn-3"
          >
            3
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => handleInput("+")}
            className={btnClass(true)}
            id="btn-add"
          >
            +
          </motion.button>

          {/* Row 5 */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleNegate}
            className={btnClass(false, true)}
            id="btn-neg"
          >
            +/-
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => handleInput("0")}
            className={btnClass()}
            id="btn-0"
          >
            0
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => handleInput(".")}
            className={btnClass()}
            id="btn-dec"
          >
            .
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => handleInput("%")}
            className={btnClass(false, true)}
            id="btn-percent"
          >
            %
          </motion.button>
        </div>

        {/* Row 6 Extra Full Width Actions */}
        <div className="grid grid-cols-4 gap-3 mt-3">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleBackspace}
            className="col-span-1 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 rounded-2xl flex items-center justify-center p-4 cursor-pointer border border-slate-200/50 dark:border-zinc-700/10"
            id="btn-back"
            title="Backspace"
          >
            <Delete className="h-5 w-5" />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleEvaluate}
            className="col-span-3 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-semibold text-lg rounded-2xl flex items-center justify-center py-4 cursor-pointer transition-all shadow-md shadow-emerald-500/10"
            id="btn-equals"
          >
            =
          </motion.button>
        </div>
      </div>

      {/* Math History Panel / Info */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/60 rounded-3xl p-5 h-full flex flex-col justify-between shadow-xs" id="history-box">
        <div>
          <div className="flex items-center justify-between border-b border-slate-150 dark:border-zinc-800 pb-3 mb-4">
            <h3 className="font-heading font-medium text-slate-900 dark:text-zinc-50 flex items-center gap-2">
              <History className="h-4 w-4 text-slate-400" />
              Calculations Log
            </h3>
            {history.length > 0 && (
              <button
                onClick={onClearHistory}
                className="text-xs text-rose-500 hover:text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                Clear all
              </button>
            )}
          </div>

          <div className="max-h-[290px] overflow-y-auto space-y-3.5 pr-1 scrollbar-thin">
            <AnimatePresence initial={false}>
              {history.length === 0 ? (
                <div className="text-center py-8 text-sm text-slate-400 dark:text-zinc-500">
                  <BookOpen className="h-8 w-8 mx-auto mb-2 text-slate-300 dark:text-zinc-700" />
                  Your standard calculations history will appear here. Include keyboard support inside this layout!
                </div>
              ) : (
                history
                  .filter((h) => h.mode === "standard")
                  .map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      onClick={() => handleHistoryItemClick(item)}
                      className="p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-800/50 cursor-pointer border border-transparent hover:border-slate-100 dark:hover:border-zinc-800 text-right group transition-all"
                    >
                      <div className="text-xs text-slate-400 dark:text-zinc-500 font-mono truncate group-hover:text-slate-500 dark:group-hover:text-zinc-400">
                        {item.expression} =
                      </div>
                      <div className="text-sm font-semibold text-slate-800 dark:text-zinc-200 font-mono truncate">
                        {item.result}
                      </div>
                    </motion.div>
                  ))
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Tip Badge */}
        <div className="bg-slate-50 dark:bg-zinc-950 p-3 rounded-2xl flex items-start gap-2 border border-slate-100 dark:border-zinc-800/40 text-xs text-slate-500 dark:text-zinc-400 mt-4 leading-relaxed">
          <HelpCircle className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
          <div>
            <strong className="text-slate-700 dark:text-zinc-300">Pro-Tip:</strong> Use keys on your keyboard like numbers, operators, or <kbd className="bg-white dark:bg-zinc-800 border border-slate-200/85 px-1 rounded-md text-[10px] font-mono shadow-xs">[Enter]</kbd> for fast compute loops.
          </div>
        </div>
      </div>
    </div>
  );
}
