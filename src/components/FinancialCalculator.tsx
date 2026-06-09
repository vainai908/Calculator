/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { DollarSign, Landmark, Calendar, Percent, ChevronDown, ChevronUp, FileSpreadsheet, TrendingUp } from "lucide-react";
import { LoanSummary, AmortizationPeriod } from "../types";

export default function FinancialCalculator() {
  const [principal, setPrincipal] = useState<number>(250000);
  const [interestRate, setInterestRate] = useState<number>(5.5);
  const [termYears, setTermYears] = useState<number>(30);
  const [termType, setTermType] = useState<"years" | "months">("years");
  
  const [summary, setSummary] = useState<LoanSummary | null>(null);
  const [expandedYear, setExpandedYear] = useState<number | null>(null);

  // Re-calculate when inputs change
  useEffect(() => {
    calculateLoan();
  }, [principal, interestRate, termYears, termType]);

  const calculateLoan = () => {
    const P = principal;
    const annualR = interestRate;
    const totalMonths = termType === "years" ? termYears * 12 : termYears;

    const r = (annualR / 100) / 12;

    let monthlyPayment = 0;
    if (annualR === 0) {
      monthlyPayment = P / totalMonths;
    } else {
      monthlyPayment = P * (r * Math.pow(1 + r, totalMonths)) / (Math.pow(1 + r, totalMonths) - 1);
    }

    if (isNaN(monthlyPayment) || !isFinite(monthlyPayment)) {
      monthlyPayment = 0;
    }

    const amortizationList: AmortizationPeriod[] = [];
    let remainingBalance = P;
    let totalInterestPaid = 0;

    for (let m = 1; m <= totalMonths; m++) {
      const interestPortion = remainingBalance * r;
      const principalPortion = monthlyPayment - interestPortion;
      remainingBalance = Math.max(0, remainingBalance - principalPortion);
      totalInterestPaid += interestPortion;

      amortizationList.push({
        periodNumber: m,
        payment: monthlyPayment,
        principal: principalPortion,
        interest: interestPortion,
        remainingBalance,
        totalInterestToDate: totalInterestPaid,
      });
    }

    // Group into yearly amortization chunks for clean accordion summaries
    const yearlyAmortizationList: AmortizationPeriod[] = [];
    const monthsPerYear = 12;
    const totalYears = Math.ceil(totalMonths / monthsPerYear);

    for (let y = 1; y <= totalYears; y++) {
      const yearStartIdx = (y - 1) * monthsPerYear;
      const yearEndIdx = Math.min(y * monthsPerYear, totalMonths);
      
      let yearPayment = 0;
      let yearPrincipal = 0;
      let yearInterest = 0;
      let yearRemaining = P;
      let yearTotalInterest = 0;

      for (let idx = yearStartIdx; idx < yearEndIdx; idx++) {
        const item = amortizationList[idx];
        if (item) {
          yearPayment += item.payment;
          yearPrincipal += item.principal;
          yearInterest += item.interest;
          yearRemaining = item.remainingBalance;
          yearTotalInterest = item.totalInterestToDate;
        }
      }

      yearlyAmortizationList.push({
        periodNumber: y,
        payment: yearPayment,
        principal: yearPrincipal,
        interest: yearInterest,
        remainingBalance: yearRemaining,
        totalInterestToDate: yearTotalInterest,
      });
    }

    const totalInterest = totalInterestPaid;
    const totalPayment = P + totalInterest;

    setSummary({
      monthlyPayment,
      totalPayment,
      totalInterest,
      amortization: amortizationList,
      yearlyAmortization: yearlyAmortizationList,
    });
  };

  const handleSliderChange = (val: number, setter: (v: number) => void) => {
    setter(val);
  };

  const formatCurrency = (amt: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(amt);
  };

  const formatCurrencyWithCents = (amt: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amt);
  };

  const principalPercent = summary 
    ? (principal / summary.totalPayment) * 100 
    : 100;
  const interestPercent = summary 
    ? (summary.totalInterest / summary.totalPayment) * 100 
    : 0;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start h-full" id="financial-calculator-suite">
      {/* Control Panel: Column Span 5 */}
      <div className="xl:col-span-5 bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/60 shadow-xs rounded-3xl p-6 space-y-6" id="fin-inputs">
        <h3 className="font-heading font-semibold text-slate-900 dark:text-zinc-50 flex items-center gap-2 border-b border-slate-100 dark:border-zinc-805 pb-3">
          <Landmark className="h-5 w-5 text-emerald-500" />
          Loan Inputs
        </h3>

        {/* Principal Input */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-slate-700 dark:text-zinc-350 flex items-center gap-1.5">
              <DollarSign className="h-4 w-4 text-slate-400" />
              Principal Amount
            </label>
            <div className="relative">
              <input
                type="number"
                value={principal}
                onChange={(e) => setPrincipal(Math.max(0, Number(e.target.value)))}
                className="w-28 pl-6 pr-2 py-1 text-sm font-mono border border-slate-200 dark:border-zinc-700 rounded-lg text-right bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
              />
              <span className="absolute left-2 top-1.5 text-xs text-slate-400 font-semibold">$</span>
            </div>
          </div>
          <input
            type="range"
            min="1000"
            max="1500000"
            step="5000"
            value={principal}
            onChange={(e) => handleSliderChange(Number(e.target.value), setPrincipal)}
            className="w-full accent-emerald-500 bg-slate-100 dark:bg-zinc-800 h-1.5 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-400 font-mono">
            <span>$1K</span>
            <span>$750K</span>
            <span>$1.5M</span>
          </div>
        </div>

        {/* Interest Rate Input */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-slate-700 dark:text-zinc-350 flex items-center gap-1.5">
              <Percent className="h-4 w-4 text-slate-400" />
              Annual Interest Rate
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                min="0"
                max="30"
                value={interestRate}
                onChange={(e) => setInterestRate(Math.max(0, Number(e.target.value)))}
                className="w-20 pr-5 py-1 text-sm font-mono border border-slate-200 dark:border-zinc-700 rounded-lg text-right bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
              />
              <span className="absolute right-2 top-1.5 text-xs text-slate-400 font-semibold">%</span>
            </div>
          </div>
          <input
            type="range"
            min="0"
            max="25"
            step="0.05"
            value={interestRate}
            onChange={(e) => handleSliderChange(Number(e.target.value), setInterestRate)}
            className="w-full accent-emerald-500 bg-slate-100 dark:bg-zinc-800 h-1.5 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-400 font-mono">
            <span>0%</span>
            <span>12.5%</span>
            <span>25%</span>
          </div>
        </div>

        {/* Loan Term Input */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-slate-700 dark:text-zinc-350 flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-slate-400" />
              Loan Term
            </label>
            <div className="flex items-center gap-2">
              <div className="bg-slate-100 dark:bg-zinc-800 rounded-lg p-0.5 flex text-xs font-semibold border border-slate-200/60 dark:border-zinc-700">
                <button
                  type="button"
                  onClick={() => {
                    setTermType("years");
                    setTermYears((prev) => (prev > 45 ? 30 : prev)); // constrain term safely
                  }}
                  className={`px-2 py-0.5 rounded-md cursor-pointer transition-all ${termType === "years" ? "bg-emerald-500 text-white shadow-xs" : "text-slate-500 hover:text-slate-800 dark:text-zinc-400"}`}
                >
                  Years
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTermType("months");
                    if (termType === "years") {
                      setTermYears((prev) => prev * 12);
                    }
                  }}
                  className={`px-2 py-0.5 rounded-md cursor-pointer transition-all ${termType === "months" ? "bg-emerald-500 text-white shadow-xs" : "text-slate-500 hover:text-slate-800 dark:text-zinc-400"}`}
                >
                  Months
                </button>
              </div>
              <input
                type="number"
                min="1"
                max={termType === "years" ? 50 : 600}
                value={termYears}
                onChange={(e) => setTermYears(Math.max(1, Number(e.target.value)))}
                className="w-16 py-1 text-sm font-mono border border-slate-200 dark:border-zinc-700 rounded-lg text-center bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 font-semibold focus:outline-none"
              />
            </div>
          </div>
          <input
            type="range"
            min="1"
            max={termType === "years" ? 40 : 480}
            step="1"
            value={termYears}
            onChange={(e) => handleSliderChange(Number(e.target.value), setTermYears)}
            className="w-full accent-emerald-500 bg-slate-100 dark:bg-zinc-800 h-1.5 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-400 font-mono">
            <span>{termType === "years" ? "1 Yr" : "1 Mo"}</span>
            <span>{termType === "years" ? "20 Yrs" : "240 Mo"}</span>
            <span>{termType === "years" ? "40 Yrs" : "480 Mo"}</span>
          </div>
        </div>
      </div>

      {/* Outputs & Amortization: Column Span 7 */}
      <div className="xl:col-span-7 space-y-6" id="fin-outputs">
        {/* Dynamic Display Cards */}
        {summary && (
          <div className="space-y-4">
            {/* Payment Summary Box */}
            <div className="bg-slate-50 dark:bg-zinc-950/20 rounded-3xl p-6 border border-slate-200/50 dark:border-zinc-800/10 shadow-xs">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                
                {/* Monthly Payment Frame */}
                <div className="bg-emerald-500 text-white p-5 rounded-2xl flex flex-col justify-between shadow-md shadow-emerald-500/15 min-h-[120px]">
                  <span className="text-xs font-semibold uppercase opacity-90 tracking-wider">Est. Monthly Payment</span>
                  <span className="text-3xl font-extrabold font-mono tracking-tight mt-1 select-all">
                    {formatCurrencyWithCents(summary.monthlyPayment)}
                  </span>
                </div>

                {/* Total Interest Frame */}
                <div className="bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800 p-5 rounded-2xl flex flex-col justify-between min-h-[120px]">
                  <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Total Interest Paid</span>
                  <div>
                    <span className="text-2xl font-bold font-mono tracking-tight text-rose-500 dark:text-rose-400 block mt-1">
                      {formatCurrency(summary.totalInterest)}
                    </span>
                    <span className="text-[10px] font-mono font-medium text-slate-400 mt-0.5 block">
                      {interestPercent.toFixed(1)}% of total cost
                    </span>
                  </div>
                </div>

                {/* Total Payments Frame */}
                <div className="bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800 p-5 rounded-2xl flex flex-col justify-between min-h-[120px]">
                  <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Total Principal Paid</span>
                  <div>
                    <span className="text-2xl font-bold font-mono tracking-tight text-indigo-500 dark:text-indigo-400 block mt-1">
                      {formatCurrency(principal)}
                    </span>
                    <span className="text-[10px] font-mono font-medium text-slate-400 mt-0.5 block">
                      {principalPercent.toFixed(1)}% of total cost
                    </span>
                  </div>
                </div>

              </div>

              {/* Stacked Percentage Visual Segments */}
              <div className="mt-5 space-y-1.5 border-t border-slate-200/50 dark:border-zinc-800/30 pt-4">
                <div className="flex justify-between text-xs font-semibold text-slate-500 dark:text-zinc-400">
                  <span>Funding Distribution Summary</span>
                  <span>{formatCurrency(summary.totalPayment)} total payment</span>
                </div>
                {/* Rounded custom progress split */}
                <div className="h-3.5 w-full bg-slate-100 dark:bg-zinc-800 rounded-full flex overflow-hidden">
                  <div
                    style={{ width: `${principalPercent}%` }}
                    className="bg-indigo-500 hover:opacity-90 transition-all cursor-help"
                    title={`Principal: ${principalPercent.toFixed(1)}%`}
                  />
                  <div
                    style={{ width: `${interestPercent}%` }}
                    className="bg-rose-500 hover:opacity-90 transition-all cursor-help"
                    title={`Interest: ${interestPercent.toFixed(1)}%`}
                  />
                </div>
                <div className="flex gap-4 text-[10px] font-medium font-mono text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full bg-indigo-500" />
                    <span>Principal ({principalPercent.toFixed(1)}%)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full bg-rose-500" />
                    <span>Interest ({interestPercent.toFixed(1)}%)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Amortization Breakdown Panel */}
            <div className="bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/60 shadow-xs rounded-3xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
                <h4 className="font-heading font-semibold text-slate-800 dark:text-zinc-100 text-sm flex items-center gap-2">
                  <FileSpreadsheet className="h-4.5 w-4.5 text-slate-400" />
                  Amortization Schedule
                </h4>
                <span className="text-[10px] bg-slate-100 dark:bg-zinc-800 px-2 py-1 rounded-md text-slate-500 uppercase tracking-widest font-bold">
                  Yearly Overview
                </span>
              </div>

              {/* Accordion List */}
              <div className="max-h-[350px] overflow-y-auto space-y-2.5 pr-1 scrollbar-thin">
                {summary.yearlyAmortization.map((yearItem) => {
                  const isExpanded = expandedYear === yearItem.periodNumber;
                  // Look up monthly periods for this specific year
                  const startMonth = (yearItem.periodNumber - 1) * 12 + 1;
                  const endMonth = Math.min(yearItem.periodNumber * 12, summary.amortization.length);
                  const yearMonths = summary.amortization.slice(startMonth - 1, endMonth);

                  return (
                    <div 
                      key={yearItem.periodNumber}
                      className={`border border-slate-100 dark:border-zinc-800 rounded-2xl overflow-hidden transition-all ${isExpanded ? "ring-1 ring-emerald-500/20 bg-slate-50/10 dark:bg-zinc-950/5" : ""}`}
                    >
                      {/* Accordion Header */}
                      <button
                        type="button"
                        onClick={() => setExpandedYear(isExpanded ? null : yearItem.periodNumber)}
                        className="w-full flex items-center justify-between p-3.5 hover:bg-slate-50 dark:hover:bg-zinc-850 cursor-pointer text-left font-sans"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xs bg-slate-100 dark:bg-zinc-800 dark:text-zinc-200 px-2 py-1 rounded-md font-bold text-slate-700">
                            Yr {yearItem.periodNumber}
                          </span>
                          <span className="text-xs text-slate-500 font-medium">
                            Bal: {formatCurrency(yearItem.remainingBalance)}
                          </span>
                        </div>

                        <div className="flex items-center gap-4 text-xs">
                          <span className="font-mono text-indigo-500 font-semibold">
                            P: {formatCurrency(yearItem.principal)}
                          </span>
                          <span className="font-mono text-rose-500 font-semibold">
                            I: {formatCurrency(yearItem.interest)}
                          </span>
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4 text-slate-400" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-slate-400" />
                          )}
                        </div>
                      </button>

                      {/* Accordion Inner content: Month-by-month details */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="border-t border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden"
                          >
                            <table className="w-full text-left text-xs text-slate-500 font-mono">
                              <thead className="bg-slate-50 dark:bg-zinc-900 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                <tr>
                                  <th className="p-2 pl-4">Month</th>
                                  <th className="p-2">Principal</th>
                                  <th className="p-2">Interest</th>
                                  <th className="p-2 pr-4 text-right">Balance</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100/10 dark:divide-zinc-800/20">
                                {yearMonths.map((mItem) => (
                                  <tr key={mItem.periodNumber} className="hover:bg-slate-50/20 dark:hover:bg-zinc-90 w-full">
                                    <td className="p-2 pl-4 font-bold text-slate-600 dark:text-zinc-400">
                                      Mo {mItem.periodNumber}
                                    </td>
                                    <td className="p-2 text-indigo-500 font-medium">
                                      {formatCurrency(mItem.principal)}
                                    </td>
                                    <td className="p-2 text-rose-500 font-medium">
                                      {formatCurrency(mItem.interest)}
                                    </td>
                                    <td className="p-2 pr-4 text-right text-slate-700 dark:text-zinc-300">
                                      {formatCurrency(mItem.remainingBalance)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
