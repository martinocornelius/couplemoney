// Made-up numbers so the placeholder screens look real. Remove once the
// screens read from the database.

export type SamplePocket = {
  name: string;
  type: "Bank account" | "Cash" | "E-wallet" | "Other";
  balance: number;
  bankName?: string;
  accountLast4?: string;
  goal?: { target: number; hint: string };
};

export const samplePockets: SamplePocket[] = [
  { name: "BCA joint account", type: "Bank account", balance: 21300000, bankName: "BCA", accountLast4: "1234" },
  { name: "Cash in wallet", type: "Cash", balance: 650000 },
  { name: "GoPay", type: "E-wallet", balance: 1500000 },
  { name: "Emergency fund", type: "Other", balance: 18000000, goal: { target: 30000000, hint: "No target date" } },
  {
    name: "Bali trip 2027",
    type: "Other",
    balance: 9000000,
    goal: { target: 20000000, hint: "Save Rp 734.000/month to reach it by Dec 2027" },
  },
];

export const sampleOpenReceivables = 1500000;
export const sampleOpenPayables = 4000000;

// October 2026 so far (today is the 18th). "previous" is the same days of
// September, as SPEC.md says comparisons for the current month work.
export const sampleMonth = { label: "October 2026", partial: true, unrecorded: -350000 };

export const sampleExpenseByCategory = [
  { name: "Groceries", amount: 1150000, previous: 1100000 },
  { name: "Food and drinks", amount: 900000, previous: 700000 },
  { name: "Entertainment and hobbies", amount: 550000, previous: 400000 },
  { name: "Transport", amount: 300000, previous: 450000 },
  { name: "Bills and utilities", amount: 230000, previous: 230000 },
  { name: "Health", amount: 70000, previous: 0 },
  { name: "Personal care", amount: 50000, previous: 80000 },
];

export const sampleIncomeByCategory = [
  { name: "Salary", amount: 7500000, previous: 7500000 },
  { name: "Side income", amount: 700000, previous: 500000 },
  { name: "Refunds and cashback", amount: 300000, previous: 0 },
];

export const sampleBudgets = [
  { category: "Food and drinks", limit: 1000000 },
  { category: "Groceries", limit: 2000000 },
  { category: "Entertainment and hobbies", limit: 500000 },
];

export const sampleInsights = [
  "You saved 62% of your income",
  "Rp 350.000 left your pockets without being logged",
  "Entertainment and hobbies went over budget by Rp 50.000",
  "Food and drinks: 29% more than last month",
];

// The 6 months up to October 2026; October is not finished yet.
export const sampleTrendMonths = [
  { label: "May", longLabel: "May 2026" },
  { label: "Jun", longLabel: "June 2026" },
  { label: "Jul", longLabel: "July 2026" },
  { label: "Aug", longLabel: "August 2026" },
  { label: "Sep", longLabel: "September 2026" },
  { label: "Oct", longLabel: "October 2026 (so far)", partial: true },
];
export const sampleTrendIncome = [8000000, 8000000, 8200000, 8500000, 9000000, 8500000];
export const sampleTrendExpense = [6900000, 7400000, 6100000, 7000000, 6630000, 3250000];
export const sampleTrendByCategory: Record<string, number[]> = {
  Groceries: [1900000, 2050000, 1800000, 2100000, 2300000, 1150000],
  "Food and drinks": [1500000, 1650000, 1300000, 1700000, 1770000, 900000],
  Transport: [600000, 650000, 500000, 550000, 460000, 300000],
};

export function sumAmounts(rows: { amount: number }[]): number {
  return rows.reduce((sum, r) => sum + r.amount, 0);
}
