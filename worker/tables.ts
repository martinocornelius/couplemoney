// The ten tables schema.sql creates (SPEC.md, "Data model").
export const TABLES = [
  "users",
  "sessions",
  "homes",
  "members",
  "pockets",
  "categories",
  "transactions",
  "recurring_rules",
  "payables_receivables",
  "budgets",
] as const;
