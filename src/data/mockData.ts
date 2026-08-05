import { InvestmentPlan } from '../types';

export const INITIAL_PLANS: InvestmentPlan[] = [
  {
    id: 'plan-standard',
    name: 'Standard Plan',
    dailyYieldPercent: 0.833, // ~25% monthly (200% total over 8 months)
    durationDays: 240, // 8 Months
    minDeposit: 100,
    maxDeposit: 500,
    cycleIntervalSeconds: 1,
    active: true,
    description: '25% Monthly Return with $100 to $500 Deposit range for 8 Months (240 Days). High precision micro-yield accrual.',
    tierRequirement: 'BRONZE'
  },
  {
    id: 'plan-premium',
    name: 'Premium Plan',
    dailyYieldPercent: 1.00, // ~30% monthly (240% total over 8 months)
    durationDays: 240, // 8 Months
    minDeposit: 501,
    maxDeposit: 1000,
    cycleIntervalSeconds: 1,
    active: true,
    description: '30% Monthly Return with $501 to $1,000 Deposit range for 8 Months (240 Days). High yield premium micro-accrual.',
    tierRequirement: 'GOLD'
  },
  {
    id: 'plan-vip',
    name: 'VIP Plan',
    dailyYieldPercent: 1.1667, // ~35% monthly (280% total over 8 months)
    durationDays: 240, // 8 Months
    minDeposit: 1001,
    maxDeposit: 10000000, // Unlimited
    cycleIntervalSeconds: 1,
    active: true,
    description: '35% Monthly Return with $1,001 to Unlimited Deposit range for 8 Months (240 Days). Elite VIP high-frequency yield crafting.',
    tierRequirement: 'DIAMOND'
  }
];

export const MOCK_DEPOSIT_WALLETS = {
  BANK_NAME: 'Dubai Islamic Bank',
  ACCOUNT_TITLE: 'Muhammad Nadeem',
  BANK_IBAN: 'PK71DUIB0000000809383001',
  USDT_TRC20: 'TY4z8X91P9vK8yq3mN27XpLs90QzM1L4kW',
  USDT_BEP20: '0x89205A3A3b2A69De6Dbf7f01ED13B2108B2c43e7'
};
