/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum CalculatorMode {
  Standard = "standard",
  Scientific = "scientific",
  Financial = "financial",
  AiSolver = "ai-solver",
}

export interface CalculationHistoryItem {
  id: string;
  expression: string;
  result: string;
  timestamp: Date;
  mode: "standard" | "scientific";
}

export interface AmortizationPeriod {
  periodNumber: number; // e.g., Month or Year
  payment: number;
  principal: number;
  interest: number;
  remainingBalance: number;
  totalInterestToDate: number;
}

export interface LoanSummary {
  monthlyPayment: number;
  totalPayment: number;
  totalInterest: number;
  amortization: AmortizationPeriod[];
  yearlyAmortization: AmortizationPeriod[];
}

export interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: Date;
  status?: "pending" | "success" | "error";
}
