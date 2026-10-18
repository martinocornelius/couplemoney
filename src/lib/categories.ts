// The default categories every new home starts with (SPEC.md, "Default
// categories"). Members can add their own, rename them or hide them later.

export type CategoryKind = "expense" | "income";

export type DefaultCategory = {
  kind: CategoryKind;
  name: string;
  emoji: string;
  /** Built-in categories can't be renamed or hidden. */
  builtIn?: boolean;
};

export const DEFAULT_CATEGORIES: DefaultCategory[] = [
  { kind: "expense", name: "Food and drinks", emoji: "🍜" },
  { kind: "expense", name: "Groceries", emoji: "🛒" },
  { kind: "expense", name: "Housing", emoji: "🏠" },
  { kind: "expense", name: "Bills and utilities", emoji: "💡" },
  { kind: "expense", name: "Transport", emoji: "🚗" },
  { kind: "expense", name: "Household", emoji: "🧹" },
  { kind: "expense", name: "Kids and education", emoji: "👶" },
  { kind: "expense", name: "Health", emoji: "🏥" },
  { kind: "expense", name: "Insurance", emoji: "🛡️" },
  { kind: "expense", name: "Shopping", emoji: "🛍️" },
  { kind: "expense", name: "Personal care", emoji: "💅" },
  { kind: "expense", name: "Entertainment and hobbies", emoji: "🎬" },
  { kind: "expense", name: "Travel", emoji: "✈️" },
  { kind: "expense", name: "Family support", emoji: "👪" },
  { kind: "expense", name: "Gifts and donations", emoji: "💝" },
  { kind: "expense", name: "Debt payment", emoji: "💳", builtIn: true },
  { kind: "expense", name: "Other", emoji: "📦", builtIn: true },

  { kind: "income", name: "Salary", emoji: "💼" },
  { kind: "income", name: "Bonus and THR", emoji: "🎉" },
  { kind: "income", name: "Business income", emoji: "🏪" },
  { kind: "income", name: "Side income", emoji: "💻" },
  { kind: "income", name: "Investment returns", emoji: "📈" },
  { kind: "income", name: "Rental income", emoji: "🏘️" },
  { kind: "income", name: "Gifts received", emoji: "🎁" },
  { kind: "income", name: "Refunds and cashback", emoji: "↩️" },
  { kind: "income", name: "Debt received", emoji: "🤝", builtIn: true },
  { kind: "income", name: "Other", emoji: "📦", builtIn: true },
];

export function categoryEmoji(kind: CategoryKind, name: string): string {
  return DEFAULT_CATEGORIES.find((c) => c.kind === kind && c.name === name)?.emoji ?? "📦";
}
