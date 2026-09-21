// Define VIP Tiers and their Names
export const VIP_TIERS = [
  { level: 1, label: 'VIP 1' },
  { level: 2, label: 'VIP 2' },
  { level: 3, label: 'VIP 3' },
  { level: 4, label: 'VIP 4' },
  { level: 5, label: 'VIP 5' },
  { level: 6, label: 'VIP 6' },
];

// Define Withdrawal Rules for each VIP Level
export const WITHDRAWAL_RULES = {
  1: { min: 50, max: 200, cooldownHours: 120 },
  2: { min: 100, max: 500, cooldownHours: 120 },
  3: { min: 200, max: 1500, cooldownHours: 120 },
  4: { min: 500, max: 5000, cooldownHours: 120 },
  5: { min: 1000, max: 15000, cooldownHours: 120 },
  6: { min: 2000, max: 50000, cooldownHours: 120 },
};

// ✅ FIXED: Strict number conversion to prevent false VIP levels
export function calculateVIPLevel(totalDeposits) {
  const deposits = Number(totalDeposits) || 0; // Forces it to be a number, defaults to 0

  if (deposits >= 50000) return 6;
  if (deposits >= 15000) return 5;
  if (deposits >= 5000) return 4;
  if (deposits >= 2000) return 3;
  if (deposits >= 500) return 2;

  return 1; // Always defaults to VIP 1 if 0 deposits
}
