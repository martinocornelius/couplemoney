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
