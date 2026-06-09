/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Delete, History, Info, RotateCcw } from "lucide-react";
import { CalculationHistoryItem } from "../types";

interface ScientificCalculatorProps {
  history: CalculationHistoryItem[];
  onAddHistory: (item: CalculationHistoryItem) => void;
  onClearHistory: () => void;
}

export default function ScientificCalculator({
  history,
  onAddHistory,
  onClearHistory,
}: ScientificCalculatorProps) {
  const [equation, setEquation] = useState<string>("");
  const [display, setDisplay] = useState<string>("");
  const [isRad, setIsRad] = useState<boolean>(true); // Degrees/Radians setting
  const [isDone, setIsDone] = useState<boolean>(false);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto scroll input
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [equation, display]);

  // Keyboard integration
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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
        if (equation === "" || equation.endsWith(" ")) {
          handleInput("-");
        } else {
          handleInput("−");
        }
      } else if (key === "*") {
        handleInput("×");
      } else if (key === "/") {
        handleInput("÷");
      } else if (key === "^") {
        handleInput("^");
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
  }, [equation, isDone, isRad]);

  const handleInput = (val: string) => {
    if (isDone) {
      if (["+", "−", "×", "÷", "^", "%"].includes(val)) {
        setEquation(display + " " + val + " ");
      } else {
        setEquation(val);
      }
      setIsDone(false);
      return;
    }

    // Clean padding for binary operators
    if (["+", "−", "×", "÷", "^"].includes(val)) {
      setEquation((prev) => prev + " " + val + " ");
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
      // Delete multiple letters for functions e.g. "sin(", "cos(", "tan(", "ln(", "log10("
      const funcs = ["sin(", "cos(", "tan(", "asin(", "acos(", "atan(", "sqrt(", "log10(", "ln("];
      for (const f of funcs) {
        if (trimmed.endsWith(f)) {
          return trimmed.slice(0, -f.length).trim();
        }
      }

      if (trimmed.endsWith("+") || trimmed.endsWith("−") || trimmed.endsWith("×") || trimmed.endsWith("÷") || trimmed.endsWith("^")) {
        return trimmed.slice(0, -1).trim();
      }
      return prev.slice(0, -1);
    });
  };

  const handleFunc = (funcName: string) => {
    if (isDone) {
      setEquation(funcName + "(" + display);
      setIsDone(false);
      return;
    }
    setEquation((prev) => prev + funcName + "(");
  };

  // Factorial Implementation
  const factorial = (n: number): number => {
    if (n < 0) return NaN;
    if (n === 0 || n === 1) return 1;
    let result = 1;
    for (let i = 2; i <= Math.min(n, 170); i++) {
      result *= i;
    }
    return result;
  };

  const parseWithFactorial = (expr: string): string => {
    // Find numbers suffixed with !
    return expr.replace(/(\d+)!/g, (_, numStr) => {
      const num = parseInt(numStr, 10);
      return factorial(num).toString();
    });
  };

  const handleEvaluate = () => {
    if (!equation.trim()) return;

    try {
      let formatted = equation;

      // Degree to Radian conversions if Degree mode is selected
      // We substitute trig functions with converted inner scopes
      const trigFunctions = ["sin", "cos", "tan", "asin", "acos", "atan"];

      // Process Degree conversion if selected
      if (!isRad) {
        // Simple degree conversion scaling values inside sin(), cos() or tan()
        // Replace sin(x) with Math.sin(x * Math.PI / 180)
        // Check for sin(expr), matching parentheses is hard in regex, so we safely handle simple numbers/constants
        // and do a general substitution of known trig functions to parse in radians.
        // It's robust to do degrees scaling on the final Math.sin calls.
      }

      // Convert characters for JS engine
      formatted = formatted
        .replaceAll("×", "*")
        .replaceAll("÷", "/")
        .replaceAll("−", "-")
        .replaceAll("π", "Math.PI")
        .replaceAll("e", "Math.E")
        .replaceAll("^", "**");

      // Replace factorials
      formatted = parseWithFactorial(formatted);

      // Setup customized trigonometry handlers that check the degree settings
      const trigScale = isRad ? 1 : Math.PI / 180;
      const invTrigScale = isRad ? 1 : 180 / Math.PI;

      // Define standard scientific helper functions that our evaluated code can access
      const sin = (x: number) => Math.sin(x * trigScale);
      const cos = (x: number) => Math.cos(x * trigScale);
      const tan = (x: number) => Math.tan(x * trigScale);
      const asin = (x: number) => Math.asin(x) * invTrigScale;
      const acos = (x: number) => Math.acos(x) * invTrigScale;
      const atan = (x: number) => Math.atan(x) * invTrigScale;
      const sqrt = (x: number) => Math.sqrt(x);
      const ln = (x: number) => Math.log(x);
      const log10 = (x: number) => Math.log10(x);

      // Safe environment context
      const mathRunner = new Function(
        "sin", "cos", "tan", "asin", "acos", "atan", "sqrt", "ln", "log10",
        `return (${formatted})`
      );

      const rawResult = mathRunner(sin, cos, tan, asin, acos, atan, sqrt, ln, log10);

      if (rawResult === undefined || isNaN(rawResult)) {
        throw new Error("Invalid calculation");
      }

      if (rawResult === Infinity || rawResult === -Infinity) {
        setDisplay("Cannot divide by 0");
        setIsDone(true);
        return;
      }

      const formattedResult = Number(Number(rawResult).toFixed(10)).toString();
      setDisplay(formattedResult);

      const newItem: CalculationHistoryItem = {
        id: Math.random().toString(36).substring(2, 9),
        expression: equation,
        result: formattedResult,
        timestamp: new Date(),
        mode: "scientific",
      };
      onAddHistory(newItem);
      setIsDone(true);
    } catch (err) {
      setDisplay("Error");
      setIsDone(true);
    }
  };

  const handleQuickTool = (tool: string) => {
    if (tool === "x^2") {
      setEquation((prev) => (prev ? `(${prev})^2` : ""));
    } else if (tool === "1/x") {
      setEquation((prev) => (prev ? `1/(${prev})` : ""));
    } else if (tool === "sqrt") {
      setEquation((prev) => (prev ? `sqrt(${prev})` : "sqrt("));
    }
    setIsDone(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start h-full" id="scientific-calc-container">
      {/* Scientific Calculator Box */}
      <div className="lg:col-span-3 bg-slate-50 dark:bg-zinc-950/20 rounded-3xl p-6 border border-slate-200/50 dark:border-zinc-800/20 shadow-xl max-w-2xl mx-auto w-full flex flex-col justify-between" id="sci-calc-box">
        {/* Output Screen */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800/80 rounded-2xl p-4 mb-4 text-right relative overflow-hidden group">
          <div className="absolute top-2 left-2 flex items-center gap-2">
            {/* Degree/Radian toggle */}
            <div className="bg-slate-100 dark:bg-zinc-800 rounded-lg p-0.5 flex text-[10px] font-semibold border border-slate-200 dark:border-zinc-700/80">
              <button
                onClick={() => setIsRad(false)}
                className={`px-2 py-1 rounded-md cursor-pointer transition-all ${!isRad ? "bg-amber-500 text-white shadow-xs" : "text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200"}`}
              >
                DEG
              </button>
              <button
                onClick={() => setIsRad(true)}
                className={`px-2 py-1 rounded-md cursor-pointer transition-all ${isRad ? "bg-amber-500 text-white shadow-xs" : "text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200"}`}
              >
                RAD
              </button>
            </div>

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
            className="text-slate-400 dark:text-zinc-500 text-sm font-mono tracking-tight whitespace-nowrap overflow-x-auto min-h-[24px] pr-1 pt-4 scrollbar-none"
          >
            {equation || "0"}
          </div>
          <div className="text-slate-900 dark:text-zinc-50 text-2xl font-semibold font-sans tracking-tight truncate mt-1">
            {display || (equation ? "" : "0")}
          </div>
        </div>

        {/* Dynamic Buttons Grid */}
        <div className="grid grid-cols-5 md:grid-cols-7 gap-2.5">
          {/* Scientific Functions Area (Cols: Standard is 5 keys, 7 keys wide is beautiful for desktops) */}
          <button
            onClick={() => handleFunc("sin")}
            className="bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-850 border border-slate-200/40 dark:border-zinc-800/10 text-slate-800 dark:text-zinc-250 py-3 rounded-xl font-medium text-xs cursor-pointer select-none"
          >
            sin
          </button>
          <button
            onClick={() => handleFunc("cos")}
            className="bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-850 border border-slate-200/40 dark:border-zinc-800/10 text-slate-800 dark:text-zinc-250 py-3 rounded-xl font-medium text-xs cursor-pointer select-none"
          >
            cos
          </button>
          <button
            onClick={() => handleFunc("tan")}
            className="bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-850 border border-slate-200/40 dark:border-zinc-800/10 text-slate-800 dark:text-zinc-250 py-3 rounded-xl font-medium text-xs cursor-pointer select-none"
          >
            tan
          </button>
          <button
            onClick={() => handleFunc("ln")}
            className="bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-850 border border-slate-200/40 dark:border-zinc-800/10 text-slate-800 dark:text-zinc-250 py-3 rounded-xl font-medium text-xs cursor-pointer select-none"
          >
            ln
          </button>
          <button
            onClick={() => handleFunc("log10")}
            className="bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-850 border border-slate-200/40 dark:border-zinc-800/10 text-slate-800 dark:text-zinc-250 py-3 rounded-xl font-medium text-xs cursor-pointer select-none"
          >
            log
          </button>
          <button
            onClick={() => handleInput("π")}
            className="bg-slate-150 hover:bg-slate-250 dark:bg-zinc-850 dark:hover:bg-zinc-800 text-slate-800 dark:text-zinc-200 py-3 rounded-xl font-medium text-sm cursor-pointer select-none hidden md:block"
          >
            π
          </button>
          <button
            onClick={() => handleInput("e")}
            className="bg-slate-150 hover:bg-slate-250 dark:bg-zinc-850 dark:hover:bg-zinc-800 text-slate-800 dark:text-zinc-200 py-3 rounded-xl font-medium text-sm cursor-pointer select-none hidden md:block"
          >
            e
          </button>

          {/* Row 2 */}
          <button
            onClick={() => handleFunc("asin")}
            className="bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-850 border border-slate-200/40 dark:border-zinc-800/10 text-slate-800 dark:text-zinc-250 py-3 rounded-xl font-medium text-xs cursor-pointer select-none"
          >
            sin⁻¹
          </button>
          <button
            onClick={() => handleFunc("acos")}
            className="bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-850 border border-slate-200/40 dark:border-zinc-800/10 text-slate-800 dark:text-zinc-250 py-3 rounded-xl font-medium text-xs cursor-pointer select-none"
          >
            cos⁻¹
          </button>
          <button
            onClick={() => handleFunc("atan")}
            className="bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-850 border border-slate-200/40 dark:border-zinc-800/10 text-slate-800 dark:text-zinc-250 py-3 rounded-xl font-medium text-xs cursor-pointer select-none"
          >
            tan⁻¹
          </button>
          <button
            onClick={() => handleQuickTool("sqrt")}
            className="bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-850 border border-slate-200/40 dark:border-zinc-800/10 text-slate-800 dark:text-zinc-250 py-3 rounded-xl font-medium text-xs cursor-pointer select-none"
          >
            √x
          </button>
          <button
            onClick={() => handleInput("^")}
            className="bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-850 border border-slate-200/40 dark:border-zinc-800/10 text-slate-800 dark:text-zinc-250 py-3 rounded-xl font-medium text-xs cursor-pointer select-none"
          >
            xʸ
          </button>
          <button
            onClick={() => handleInput("(")}
            className="bg-slate-150 hover:bg-slate-250 dark:bg-zinc-850 dark:hover:bg-zinc-800 text-slate-800 dark:text-zinc-200 py-3 rounded-xl font-medium text-sm cursor-pointer select-none hidden md:block"
          >
            (
          </button>
          <button
            onClick={() => handleInput(")")}
            className="bg-slate-150 hover:bg-slate-250 dark:bg-zinc-850 dark:hover:bg-zinc-800 text-slate-800 dark:text-zinc-200 py-3 rounded-xl font-medium text-sm cursor-pointer select-none hidden md:block"
          >
            )
          </button>

          {/* Row 3 - Numeric Grid */}
          <button
            onClick={() => handleQuickTool("x^2")}
            className="bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-850 border border-slate-200/40 dark:border-zinc-800/10 text-slate-800 dark:text-zinc-250 py-3 rounded-xl font-medium text-xs cursor-pointer select-none"
          >
            x²
          </button>
          <button
            onClick={() => handleQuickTool("1/x")}
            className="bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-850 border border-slate-200/40 dark:border-zinc-800/10 text-slate-800 dark:text-zinc-250 py-3 rounded-xl font-medium text-xs cursor-pointer select-none"
          >
            1/x
          </button>
          <button
            onClick={() => handleInput("!")}
            className="bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-850 border border-slate-200/40 dark:border-zinc-800/10 text-slate-800 dark:text-zinc-250 py-3 rounded-xl font-medium text-xs cursor-pointer select-none"
          >
            x!
          </button>
          <button
            onClick={() => handleInput("7")}
            className="bg-white dark:bg-zinc-950 hover:bg-slate-100 text-slate-800 dark:text-zinc-200 py-3 rounded-xl font-bold text-base cursor-pointer border border-slate-150/50 dark:border-zinc-800/10 select-none"
          >
            7
          </button>
          <button
            onClick={() => handleInput("8")}
            className="bg-white dark:bg-zinc-950 hover:bg-slate-100 text-slate-800 dark:text-zinc-200 py-3 rounded-xl font-bold text-base cursor-pointer border border-slate-150/50 dark:border-zinc-800/10 select-none"
          >
            8
          </button>
          <button
            onClick={() => handleInput("9")}
            className="bg-white dark:bg-zinc-950 hover:bg-slate-100 text-slate-800 dark:text-zinc-200 py-3 rounded-xl font-bold text-base cursor-pointer border border-slate-150/50 dark:border-zinc-800/10 select-none"
          >
            9
          </button>
          <button
            onClick={() => handleInput("÷")}
            className="bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-xl font-semibold text-lg cursor-pointer select-none"
          >
            ÷
          </button>

          {/* Row 4 */}
          <button
            onClick={() => handleInput("π")}
            className="bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-850 text-slate-800 dark:text-zinc-250 py-3 rounded-xl font-medium text-xs cursor-pointer md:hidden select-none"
          >
            π
          </button>
          <button
            onClick={() => handleInput("e")}
            className="bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-850 text-slate-800 dark:text-zinc-250 py-3 rounded-xl font-medium text-xs cursor-pointer md:hidden select-none"
          >
            e
          </button>
          <button
            onClick={() => handleInput("%")}
            className="bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-850 border border-slate-200/40 dark:border-zinc-800/10 text-slate-800 dark:text-zinc-250 py-3 rounded-xl font-semibold text-xs cursor-pointer select-none"
          >
            %
          </button>
          <button
            onClick={() => handleInput("4")}
            className="bg-white dark:bg-zinc-950 hover:bg-slate-100 text-slate-800 dark:text-zinc-200 py-3 rounded-xl font-bold text-base cursor-pointer border border-slate-150/50 dark:border-zinc-800/10 select-none"
          >
            4
          </button>
          <button
            onClick={() => handleInput("5")}
            className="bg-white dark:bg-zinc-950 hover:bg-slate-100 text-slate-800 dark:text-zinc-200 py-3 rounded-xl font-bold text-base cursor-pointer border border-slate-150/50 dark:border-zinc-800/10 select-none"
          >
            5
          </button>
          <button
            onClick={() => handleInput("6")}
            className="bg-white dark:bg-zinc-950 hover:bg-slate-100 text-slate-800 dark:text-zinc-200 py-3 rounded-xl font-bold text-base cursor-pointer border border-slate-150/50 dark:border-zinc-800/10 select-none"
          >
            6
          </button>
          <button
            onClick={() => handleInput("×")}
            className="bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-xl font-semibold text-lg cursor-pointer select-none"
          >
            ×
          </button>

          {/* Row 5 */}
          <button
            onClick={() => handleInput("(")}
            className="bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-850 text-slate-800 dark:text-zinc-250 py-3 rounded-xl font-medium text-sm cursor-pointer md:hidden select-none"
          >
            (
          </button>
          <button
            onClick={() => handleInput(")")}
            className="bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-850 text-slate-800 dark:text-zinc-250 py-3 rounded-xl font-medium text-sm cursor-pointer md:hidden select-none"
          >
            )
          </button>
          <button
            onClick={handleClear}
            className="bg-rose-500/15 hover:bg-rose-500/25 text-rose-600 dark:text-rose-400 py-3 rounded-xl font-semibold text-xs cursor-pointer border border-rose-500/10 select-none"
          >
            AC
          </button>
          <button
            onClick={() => handleInput("1")}
            className="bg-white dark:bg-zinc-950 hover:bg-slate-100 text-slate-800 dark:text-zinc-200 py-3 rounded-xl font-bold text-base cursor-pointer border border-slate-150/50 dark:border-zinc-800/10 select-none"
          >
            1
          </button>
          <button
            onClick={() => handleInput("2")}
            className="bg-white dark:bg-zinc-950 hover:bg-slate-100 text-slate-800 dark:text-zinc-200 py-3 rounded-xl font-bold text-base cursor-pointer border border-slate-150/50 dark:border-zinc-800/10 select-none"
          >
            2
          </button>
          <button
            onClick={() => handleInput("3")}
            className="bg-white dark:bg-zinc-950 hover:bg-slate-100 text-slate-800 dark:text-zinc-200 py-3 rounded-xl font-bold text-base cursor-pointer border border-slate-150/50 dark:border-zinc-800/10 select-none"
          >
            3
          </button>
          <button
            onClick={() => handleInput("−")}
            className="bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-xl font-semibold text-lg cursor-pointer select-none"
          >
            −
          </button>

          {/* Row 6 */}
          <button
            onClick={handleBackspace}
            className="bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-850 text-slate-700 dark:text-zinc-300 py-3 rounded-xl font-semibold text-xs flex items-center justify-center cursor-pointer select-none md:col-span-1 border border-slate-150 dark:border-zinc-800/10"
            title="Backspace"
          >
            <Delete className="h-4 w-4" />
          </button>
          <button
            onClick={() => {
              if (equation === "" || equation.endsWith(" ")) {
                handleInput("-");
              } else {
                handleInput("−");
              }
            }}
            className="bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-850 text-slate-800 dark:text-zinc-250 py-3 rounded-xl font-medium text-xs cursor-pointer select-none"
          >
            +/-
          </button>
          <button
            onClick={() => handleInput(".")}
            className="bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-850 text-slate-800 dark:text-zinc-250 py-3 rounded-xl font-bold text-sm cursor-pointer select-none"
          >
            .
          </button>
          <button
            onClick={() => handleInput("0")}
            className="bg-white dark:bg-zinc-950 hover:bg-slate-100 text-slate-800 dark:text-zinc-200 py-3 rounded-xl font-bold text-base cursor-pointer border border-slate-150/50 dark:border-zinc-800/10 col-span-2 select-none"
          >
            0
          </button>
          <button
            onClick={handleEvaluate}
            className="bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-xl font-semibold text-base col-span-2 shadow-xs cursor-pointer select-none"
          >
            =
          </button>
        </div>
      </div>

      {/* History Area */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/60 rounded-3xl p-5 h-full flex flex-col justify-between shadow-xs" id="sci-history-box">
        <div>
          <div className="flex items-center justify-between border-b border-slate-150 dark:border-zinc-800 pb-3 mb-4">
            <h3 className="font-heading font-medium text-slate-900 dark:text-zinc-50 flex items-center gap-2">
              <History className="h-4 w-4 text-slate-400" />
              Scientific Log
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

          <div className="max-h-[300px] overflow-y-auto space-y-3 pr-1 scrollbar-thin">
            <AnimatePresence initial={false}>
              {history.length === 0 ? (
                <div className="text-center py-8 text-sm text-slate-400 dark:text-zinc-500">
                  <Info className="h-8 w-8 mx-auto mb-2 text-slate-300 dark:text-zinc-700" />
                  Your scientific formulas history will appear here. Include keyboard support inside this layout!
                </div>
              ) : (
                history
                  .filter((h) => h.mode === "scientific")
                  .map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => {
                        setEquation(item.expression);
                        setDisplay(item.result);
                        setIsDone(false);
                      }}
                      className="p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-800/50 cursor-pointer border border-transparent hover:border-slate-100 dark:hover:border-zinc-800 text-right group transition-all"
                    >
                      <div className="text-xs text-slate-400 dark:text-zinc-500 font-mono truncate">
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

        {/* Dynamic Mode Explainer */}
        <div className="bg-slate-50 dark:bg-zinc-950 p-3 rounded-xl border border-slate-100 dark:border-zinc-800/40 text-xs text-slate-500 dark:text-zinc-400 mt-4 leading-normal">
          <Info className="h-4 w-4 text-amber-500 inline mr-1 mb-0.5" />
          Supports trigonometry functions in RAD or DEG modes. Factorial limit is $170!$. Double-tap or hover buttons for functions.
        </div>
      </div>
    </div>
  );
}
