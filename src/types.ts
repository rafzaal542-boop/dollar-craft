// Dollar Craft - TypeScript Type Definitions

export type UserRole = 'USER' | 'ADMIN';
export type UserTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'VIP' | 'DIAMOND';

export interface User {
  id: string;
  email: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  avatarUrl?: string;
  photoUrl?: string;
  onboardingPurpose?: string;
  hasCompletedOnboarding?: boolean;
  walletAddress?: string;
  role: UserRole;
  tier: UserTier;
  referralCode: string;
  referredBy?: string;
  isFrozen: boolean;
  frozenReason?: string;
  createdAt: string;
  principalBalance: string; // High precision Decimal string (18 decimals)
  earnedYield: string;      // High precision Decimal string (18 decimals)
  totalWithdrawn: string;   // High precision Decimal string
  is_ib?: boolean;
  ibStatus?: 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED';
  ibReferralCode?: string;
  ibWithdrawableCommission?: string;
  ibTotalCommission?: string;
  ibMembershipsSold?: number;
}

export interface IBMembershipPayment {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  amount: number; // 7000
  paymentMethod: 'USDT_TRC20' | 'USDT_BEP20' | 'BINANCE_PAY' | 'BANK_TRANSFER';
  proofTxHash?: string;
  walletAddress?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
  createdAt: string;
}

export interface IBApplication {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  phone: string;
  walletAddress?: string;
  country: string;
  experience: string;
  telegramWhatsapp: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
}

export interface IBCommission {
  id: string;
  ibUserId: string;
  clientUserId: string;
  clientEmail: string;
  investmentId: string;
  investmentAmount: string;
  commissionRate: number; // 10%
  commissionAmount: string;
  status: 'PAID' | 'WITHDRAWN';
  createdAt: string;
}

export interface GeneratedIbLink {
  id: string;
  userId: string;
  campaignName: string;
  accessCode: string;
  referralCode: string;
  fullUrl: string;
  serverNode: string;
  clicksCount: number;
  conversionsCount: number;
  createdAt: string;
}

export interface InvestmentPlan {
  id: string;
  name: string;
  dailyYieldPercent: number; // e.g. 2.5%
  durationDays: number;     // e.g. 30 days
  minDeposit: number;       // e.g. $50
  maxDeposit: number;       // e.g. $50,000
  cycleIntervalSeconds: number; // e.g. 1 second tick interval
  active: boolean;
  description?: string;
  tierRequirement?: UserTier;
}

export type DepositStatus = 'PENDING' | 'ACTIVE' | 'APPROVED' | 'COMPLETED' | 'CANCELLED' | 'FROZEN' | 'REJECTED';

export interface UserDeposit {
  id: string;
  userId: string;
  userEmail?: string;
  planId: string;
  planName: string;
  principalAmount: string; // BigNumber string
  earnedYield: string;     // BigNumber string
  totalPayout: string;     // BigNumber string
  dailyYieldPercent: number;
  cryptoNetwork: 'USDT_TRC20' | 'USDT_BEP20' | 'USDT_ERC20' | 'USDC_SOL' | string;
  txHash?: string;
  status: DepositStatus;
  startTime: string;
  endTime: string;
  lastYieldTick: string;
  progressPercent: number;
}

export type TransactionType = 'DEPOSIT' | 'WITHDRAWAL' | 'YIELD_ACCRUAL' | 'REFERRAL_BONUS' | 'ADMIN_ADJUSTMENT';
export type TransactionStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'PROCESSING';

export interface Transaction {
  id: string;
  userId: string;
  userEmail?: string;
  type: TransactionType;
  amount: string;          // Formatted amount
  precisionAmount: string; // 18 decimal places string
  txHash?: string;
  destinationAddr?: string;
  cryptoNetwork?: string;
  status: TransactionStatus;
  flaggedByFraud?: boolean;
  fraudNote?: string;
  createdAt: string;
}

export interface ReferralReward {
  id: string;
  referrerId: string;
  referredUserId: string;
  referredUserEmail?: string;
  amount: string;
  level: 1 | 2 | 3;
  createdAt: string;
}

export interface SystemMetrics {
  totalDeposited: string;
  totalPaidOut: string;
  totalYieldAccrued: string;
  activeUsersCount: number;
  activeCyclesCount: number;
  systemLiquidity: string;
  yieldHealthScore: number; // e.g. 99.98% math check
  pendingWithdrawalsCount: number;
  pendingWithdrawalsAmount: string;
  lastTickTimestamp: string;
  tickExecutionMs: number;
}

export interface RealtimeTickPayload {
  userId: string;
  timestamp: string;
  totalBalance: string;        // Principal + Earned Yield (18 decimal places)
  principalBalance: string;
  earnedYield: string;
  microYieldPerSecond: string; // Current rate in $/sec
  activeCycles: Array<{
    id: string;
    earnedYield: string;
    progressPercent: number;
    tickYieldDelta: string;
  }>;
}

export type InternalTransferWalletType = 'MAIN_WALLET' | 'INVESTMENT_WALLET' | 'IB_COMMISSION_WALLET';

export interface InternalTransfer {
  id: string;
  transferId: string; // e.g. ITX-849201
  fromUserId: string;
  fromUserEmail: string;
  toUserId: string;
  toUserEmail: string;
  toWalletType: InternalTransferWalletType;
  amount: string;
  note?: string;
  status: 'SUCCESS' | 'REVERSED' | 'FAILED';
  createdAt: string;
}

export interface AdminWallet {
  id: string;
  balance: string;
}

export interface AutoTransferSignupConfig {
  enabled: boolean;
  bonusAmount: string;
  targetWallet: InternalTransferWalletType;
}

export interface UserNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'INTERNAL_TRANSFER' | 'SYSTEM' | 'BONUS';
  read: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  actor: string;
  targetUser?: string;
  details: string;
  ipAddress?: string;
}
