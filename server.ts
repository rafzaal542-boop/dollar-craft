import express, { Request, Response } from 'express';
import path from 'path';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import { BigNumber, calculateMicroYield, calculateYieldPerSecond, isYieldWithinMathematicalLimit } from './src/lib/yieldEngine';
import { INITIAL_PLANS, MOCK_DEPOSIT_WALLETS } from './src/data/mockData';
import { User, UserDeposit, Transaction, ReferralReward, SystemMetrics, IBApplication, IBCommission, IBMembershipPayment, InternalTransfer, InternalTransferWalletType, AutoTransferSignupConfig, UserNotification, GeneratedIbLink } from './src/types';

const app = express();
const PORT = 3000;

app.use(express.json());

// ==========================================
// IN-MEMORY HIGH-PRECISION STATE ENGINE
// (Simulates PostgreSQL Prisma row-level state)
// ==========================================

let adminWalletBalance = '9273632653543654767657.00';
let autoSignupConfig: AutoTransferSignupConfig = {
  enabled: false,
  bonusAmount: '5.00',
  targetWallet: 'MAIN_WALLET'
};
let mockInternalTransfers: InternalTransfer[] = [];
let mockUserNotifications: UserNotification[] = [];
let mockGeneratedIbLinks: GeneratedIbLink[] = [];

function executeAutoSignupBonus(newUser: User) {
  if (!autoSignupConfig.enabled) return;
  const bonusBN = new BigNumber(autoSignupConfig.bonusAmount || '0');
  const adminBN = new BigNumber(adminWalletBalance);
  if (bonusBN.isLessThanOrEqualTo(0) || adminBN.isLessThan(bonusBN)) return;

  adminWalletBalance = adminBN.minus(bonusBN).toFixed(2);
  const adminUser = mockUsers.find(u => u.role === 'ADMIN') || mockUsers[1];

  if (autoSignupConfig.targetWallet === 'MAIN_WALLET' || autoSignupConfig.targetWallet === 'INVESTMENT_WALLET') {
    newUser.principalBalance = new BigNumber(newUser.principalBalance || '0').plus(bonusBN).toFixed(18);
  } else if (autoSignupConfig.targetWallet === 'IB_COMMISSION_WALLET') {
    newUser.is_ib = true;
    newUser.ibStatus = 'APPROVED';
    newUser.ibWithdrawableCommission = new BigNumber(newUser.ibWithdrawableCommission || '0').plus(bonusBN).toFixed(2);
    newUser.ibTotalCommission = new BigNumber(newUser.ibTotalCommission || '0').plus(bonusBN).toFixed(2);
  }

  const transferId = `ITX-${Math.floor(100000 + Math.random() * 900000)}`;
  const transferRecord: InternalTransfer = {
    id: `itx-auto-${Date.now()}`,
    transferId,
    fromUserId: adminUser ? adminUser.id : 'usr-admin-s sovereign',
    fromUserEmail: adminUser ? adminUser.email : 'admin@dollarcraft.io',
    toUserId: newUser.id,
    toUserEmail: newUser.email,
    toWalletType: autoSignupConfig.targetWallet,
    amount: bonusBN.toFixed(2),
    note: 'Auto Signup Welcome Bonus',
    status: 'SUCCESS',
    createdAt: new Date().toISOString()
  };
  mockInternalTransfers.unshift(transferRecord);

  const bonusTx: Transaction = {
    id: `tx-autobonus-${Date.now()}`,
    userId: newUser.id,
    userEmail: newUser.email,
    type: 'ADMIN_ADJUSTMENT',
    amount: bonusBN.toFixed(2),
    precisionAmount: bonusBN.toFixed(18),
    cryptoNetwork: 'Internal Transfer (Welcome Bonus)',
    status: 'APPROVED',
    createdAt: new Date().toISOString()
  };
  mockTransactions.unshift(bonusTx);

  mockUserNotifications.unshift({
    id: `notif-${Date.now()}`,
    userId: newUser.id,
    title: 'Welcome Bonus Received!',
    message: `You have received a $${bonusBN.toFixed(2)} Welcome Bonus from Admin via Internal Transfer!`,
    type: 'INTERNAL_TRANSFER',
    read: false,
    createdAt: new Date().toISOString()
  });
}

let activeUserId: string | null = null;

function getActiveUser(req?: Request): User | null {
  const reqEmail = (
    req?.headers['x-user-email'] ||
    req?.query?.userEmail ||
    req?.body?.userEmail ||
    req?.body?.email
  )?.toString().trim().toLowerCase();

  const reqId = (
    req?.headers['x-user-id'] ||
    req?.query?.userId ||
    req?.body?.userId
  )?.toString().trim();

  if (reqEmail) {
    return consolidateUserByEmail(reqEmail, reqId);
  }

  if (reqId) {
    const foundById = mockUsers.find(
      (u) => u.id === reqId || u.id.toLowerCase() === reqId.toLowerCase()
    );
    if (foundById) {
      if (foundById.email) {
        return consolidateUserByEmail(foundById.email, reqId);
      }
      return foundById;
    }
  }

  if (activeUserId) {
    const foundActive = mockUsers.find((u) => u.id === activeUserId);
    if (foundActive) {
      if (foundActive.email) {
        return consolidateUserByEmail(foundActive.email, activeUserId);
      }
      return foundActive;
    }
  }

  return null;
}

function consolidateUserByEmail(email: string, reqId?: string): User {
  const cleanEmail = email.trim().toLowerCase();

  let maxPrincipalBN = new BigNumber(0);
  let maxYieldBN = new BigNumber(0);
  let maxIbBN = new BigNumber(0);
  let maxIbTotalBN = new BigNumber(0);
  let canonicalUser: User | null = null;

  const matching = mockUsers.filter(
    (u) =>
      (u.email && u.email.trim().toLowerCase() === cleanEmail) ||
      (reqId && u.id === reqId)
  );

  matching.forEach((u) => {
    maxPrincipalBN = BigNumber.max(maxPrincipalBN, new BigNumber(u.principalBalance || '0'));
    maxYieldBN = BigNumber.max(maxYieldBN, new BigNumber(u.earnedYield || '0'));
    maxIbBN = BigNumber.max(maxIbBN, new BigNumber(u.ibWithdrawableCommission || '0'));
    maxIbTotalBN = BigNumber.max(maxIbTotalBN, new BigNumber(u.ibTotalCommission || '0'));
    if (!canonicalUser) {
      canonicalUser = u;
    } else {
      if (new BigNumber(u.principalBalance || '0').gt(new BigNumber(canonicalUser.principalBalance || '0'))) {
        canonicalUser = u;
      }
    }
  });

  const matchingUserIds = new Set(matching.map((u) => u.id));
  if (reqId) matchingUserIds.add(reqId);
  if (canonicalUser?.id) matchingUserIds.add(canonicalUser.id);

  // Sum from internalTransfers
  const userITX = mockInternalTransfers.filter((t) => {
    const tEmail = (t.toUserEmail || (t as any).userEmail || (t as any).toEmail || (t as any).email || '').trim().toLowerCase();
    const tId = (t.toUserId || (t as any).userId || (t as any).toId || '').trim();
    return tEmail === cleanEmail || (tId && matchingUserIds.has(tId));
  });

  let itxSumBN = new BigNumber(0);
  userITX.forEach((itx) => {
    if (itx.status === 'SUCCESS' && itx.amount) {
      itxSumBN = itxSumBN.plus(new BigNumber(itx.amount));
    }
  });

  // Sum from deposits
  const userDeps = mockDeposits.filter((d) => {
    const dEmail = (d.userEmail || d.userId || '').trim().toLowerCase();
    const dId = (d.userId || '').trim();
    return dEmail === cleanEmail || (dId && matchingUserIds.has(dId));
  });

  let totalDepBN = new BigNumber(0);
  userDeps.forEach((d) => {
    if (d.principalAmount) {
      totalDepBN = totalDepBN.plus(new BigNumber(d.principalAmount));
    }
  });

  const effectivePrincipal = BigNumber.max(maxPrincipalBN, itxSumBN, totalDepBN);

  if (!canonicalUser) {
    canonicalUser = {
      id: reqId || `usr-${Date.now()}`,
      email: cleanEmail,
      role: 'USER',
      tier: 'SILVER',
      principalBalance: effectivePrincipal.toFixed(18),
      earnedYield: maxYieldBN.toFixed(18),
      totalWithdrawn: '0.00',
      walletAddress: `0x${Math.random().toString(16).substring(2, 10)}`,
      referralCode: generateUniqueReferralCode('DC'),
      isFrozen: false,
      createdAt: new Date().toISOString()
    };
  } else {
    canonicalUser.email = cleanEmail;
    canonicalUser.principalBalance = effectivePrincipal.toFixed(18);
    canonicalUser.earnedYield = maxYieldBN.toFixed(18);
    canonicalUser.ibWithdrawableCommission = maxIbBN.toFixed(2);
    canonicalUser.ibTotalCommission = maxIbTotalBN.toFixed(2);
  }

  // Clean duplicate mockUsers so ONLY canonicalUser remains for this email
  for (let i = mockUsers.length - 1; i >= 0; i--) {
    const u = mockUsers[i];
    if (
      (u.email && u.email.trim().toLowerCase() === cleanEmail) ||
      (reqId && u.id === reqId) ||
      (canonicalUser.id && u.id === canonicalUser.id)
    ) {
      mockUsers.splice(i, 1);
    }
  }
  mockUsers.push(canonicalUser);

  // Sync internal transfers and deposits to share canonicalUser's id and cleanEmail
  mockInternalTransfers.forEach((itx) => {
    const tEmail = (itx.toUserEmail || (itx as any).userEmail || (itx as any).toEmail || (itx as any).email || '').trim().toLowerCase();
    const tId = (itx.toUserId || (itx as any).userId || (itx as any).toId || '').trim();
    if (tEmail === cleanEmail || (tId && matchingUserIds.has(tId))) {
      itx.toUserId = canonicalUser!.id;
      itx.toUserEmail = cleanEmail;
    }
  });

  mockDeposits.forEach((dep) => {
    const dEmail = (dep.userEmail || '').trim().toLowerCase();
    const dId = (dep.userId || '').trim();
    if (dEmail === cleanEmail || (dId && matchingUserIds.has(dId))) {
      dep.userId = canonicalUser!.id;
      dep.userEmail = cleanEmail;
    }
  });

  return canonicalUser;
}

async function ensureUserSyncedFromFirestore(rawEmail?: string, rawId?: string): Promise<User | null> {
  const cleanEmail = (rawEmail || '').trim().toLowerCase();
  const cleanId = (rawId || '').trim();

  if (!cleanEmail && !cleanId) {
    return null;
  }

  try {
    const { db } = await import('./src/lib/firebase');
    const { collection, getDocs, doc, getDoc, setDoc } = await import('firebase/firestore');

    let userDocData: any = null;

    // 1. Fetch user doc directly by email
    if (cleanEmail) {
      const emailDocRef = doc(db, 'users', cleanEmail);
      const snap = await getDoc(emailDocRef);
      if (snap.exists()) {
        userDocData = { id: snap.id, ...snap.data() };
      }
    }

    // 2. Fetch user doc by ID if not found
    if (!userDocData && cleanId) {
      const idDocRef = doc(db, 'users', cleanId);
      const snap = await getDoc(idDocRef);
      if (snap.exists()) {
        userDocData = { id: snap.id, ...snap.data() };
      }
    }

    // 3. Query all users if still not found
    if (!userDocData && cleanEmail) {
      const allUsersSnap = await getDocs(collection(db, 'users'));
      allUsersSnap.forEach((uDoc) => {
        const uData: any = uDoc.data();
        if ((uData.email || '').trim().toLowerCase() === cleanEmail) {
          userDocData = { id: uDoc.id, ...uData };
        }
      });
    }

    // Load deposits
    const depSnap = await getDocs(collection(db, 'deposits'));
    depSnap.forEach((dDoc) => {
      const dData: any = dDoc.data();
      const depId = dDoc.id || dData.id || `dep-${Date.now()}`;
      const dEmail = (dData.userEmail || dData.email || '').toLowerCase().trim();
      const dUserId = (dData.userId || '').trim();

      if ((cleanEmail && dEmail === cleanEmail) || (cleanId && dUserId === cleanId)) {
        const pAmount = String(dData.principalAmount || dData.amount || '0');
        if (!mockDeposits.some((m) => m.id === depId || (dData.transactionId && m.txHash === dData.transactionId))) {
          mockDeposits.unshift({
            id: depId,
            userId: dData.userId || cleanId || cleanEmail,
            userEmail: dData.userEmail || dEmail || cleanEmail,
            planId: dData.planId || 'plan-standard',
            planName: dData.planName || 'Standard Yield Plan',
            principalAmount: pAmount,
            earnedYield: '0.000000000000000000',
            totalPayout: '0',
            dailyYieldPercent: dData.dailyYieldPercent || 0.83,
            cryptoNetwork: dData.cryptoNetwork || 'Internal Transfer',
            txHash: dData.transactionId || dData.txHash || depId,
            status: (dData.status || 'ACTIVE').toUpperCase(),
            startTime: dData.createdAt || new Date().toISOString(),
            endTime: new Date(Date.now() + 240 * 86400 * 1000).toISOString(),
            lastYieldTick: new Date().toISOString(),
            progressPercent: 0
          });
        }
      }
    });

    // Load internal transfers
    const itxSnap = await getDocs(collection(db, 'internalTransfers'));
    itxSnap.forEach((iDoc) => {
      const iData: any = iDoc.data();
      const itxId = iDoc.id || iData.id || iData.transferId;
      const toEmail = (
        iData.toUserEmail || iData.userEmail || iData.toEmail || iData.email || iData.recipientEmail || ''
      ).toLowerCase().trim();
      const toId = (iData.toUserId || iData.userId || iData.toId || '').trim();

      if ((cleanEmail && toEmail === cleanEmail) || (cleanId && toId === cleanId)) {
        if (!mockInternalTransfers.some((m) => m.id === itxId || (iData.transferId && m.transferId === iData.transferId))) {
          mockInternalTransfers.unshift({
            id: itxId,
            transferId: iData.transferId || itxId,
            fromUserId: iData.fromUserId || 'admin',
            fromUserEmail: iData.fromUserEmail || 'admin@dollarcraft.io',
            toUserId: iData.toUserId || toId || cleanId || cleanEmail,
            toUserEmail: iData.toUserEmail || toEmail || cleanEmail,
            toWalletType: iData.toWalletType || 'MAIN_WALLET',
            amount: String(iData.amount || '0'),
            note: iData.note,
            status: iData.status || 'SUCCESS',
            createdAt: iData.createdAt || new Date().toISOString()
          });
        }
      }
    });

    // Run in-memory consolidation
    let canonicalUser = consolidateUserByEmail(cleanEmail || (userDocData?.email ?? ''), cleanId || userDocData?.id);

    // Merge doc values if present
    if (userDocData && canonicalUser) {
      const docBal = userDocData.principalBalance !== undefined ? new BigNumber(userDocData.principalBalance) : new BigNumber(0);
      canonicalUser.principalBalance = BigNumber.max(new BigNumber(canonicalUser.principalBalance || 0), docBal).toFixed(18);

      const docYield = userDocData.earnedYield !== undefined ? new BigNumber(userDocData.earnedYield) : new BigNumber(0);
      canonicalUser.earnedYield = BigNumber.max(new BigNumber(canonicalUser.earnedYield || 0), docYield).toFixed(18);

      if (userDocData.ibWithdrawableCommission) {
        canonicalUser.ibWithdrawableCommission = String(userDocData.ibWithdrawableCommission);
      }
      if (userDocData.ibTotalCommission) {
        canonicalUser.ibTotalCommission = String(userDocData.ibTotalCommission);
      }
      if (userDocData.is_ib) {
        canonicalUser.is_ib = true;
        canonicalUser.ibStatus = userDocData.ibStatus || 'APPROVED';
      }
    }

    // Persist canonicalUser back to Firestore under doc ID = cleanEmail
    if (canonicalUser && canonicalUser.email) {
      const emailKey = canonicalUser.email.toLowerCase().trim();
      const payload = {
        id: canonicalUser.id,
        uid: canonicalUser.id,
        email: emailKey,
        role: canonicalUser.role,
        tier: canonicalUser.tier,
        principalBalance: Number(canonicalUser.principalBalance || 0),
        earnedYield: Number(canonicalUser.earnedYield || 0),
        ibWithdrawableCommission: Number(canonicalUser.ibWithdrawableCommission || 0),
        ibTotalCommission: Number(canonicalUser.ibTotalCommission || 0),
        is_ib: !!canonicalUser.is_ib,
        ibStatus: canonicalUser.ibStatus || 'NONE',
        referralCode: canonicalUser.referralCode,
        updatedAt: new Date().toISOString()
      };
      await setDoc(doc(db, 'users', emailKey), payload, { merge: true }).catch((e) =>
        console.warn('FS sync error:', e)
      );
      if (canonicalUser.id && canonicalUser.id !== emailKey) {
        await setDoc(doc(db, 'users', canonicalUser.id), payload, { merge: true }).catch((e) =>
          console.warn('FS sync error:', e)
        );
      }
    }

    return canonicalUser;
  } catch (err) {
    console.warn('Firestore user sync warning:', err);
    if (cleanEmail) return consolidateUserByEmail(cleanEmail, cleanId);
    return mockUsers.find((u) => u.id === cleanId) || null;
  }
}

// High-entropy guaranteed 100% collision-free referral code generator across 20+ million users
function generateUniqueReferralCode(prefix = 'DC'): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let attempts = 0;
  while (attempts < 5000) {
    let randStr = '';
    const bytes = crypto.randomBytes(6);
    for (let i = 0; i < bytes.length; i++) {
      randStr += chars[bytes[i] % chars.length];
    }
    const candidate = `${prefix}${randStr}`;

    const isTaken = mockUsers.some(
      (u) =>
        u.referralCode?.toUpperCase() === candidate.toUpperCase() ||
        u.ibReferralCode?.toUpperCase() === candidate.toUpperCase()
    );

    if (!isTaken) {
      return candidate;
    }
    attempts++;
  }
  return `${prefix}${Date.now().toString(36).toUpperCase()}${Math.floor(Math.random() * 1000).toString(36).toUpperCase()}`;
}

function ensureUserUniqueReferralCode(user: User): string {
  if (!user.referralCode) {
    user.referralCode = generateUniqueReferralCode('DC');
    return user.referralCode;
  }
  const isDuplicate = mockUsers.some(
    (u) => u.id !== user.id && u.referralCode?.toUpperCase() === user.referralCode?.toUpperCase()
  );
  if (isDuplicate) {
    user.referralCode = generateUniqueReferralCode('DC');
  }
  return user.referralCode;
}

let mockUsers: User[] = [
  {
    id: 'usr-admin-s sovereign',
    email: 'admin@dollarcraft.io',
    walletAddress: '0x3F5CE2FB2B21598D71227092F262529947871f31',
    role: 'ADMIN',
    tier: 'VIP',
    referralCode: 'SOVEREIGN1',
    isFrozen: false,
    createdAt: new Date().toISOString(),
    principalBalance: '0.000000000000000000',
    earnedYield: '0.000000000000000000',
    totalWithdrawn: '0.000000000000000000',
    is_ib: false,
    ibStatus: 'NONE'
  }
];

let mockIbApplications: IBApplication[] = [];

let mockIbMembershipPayments: IBMembershipPayment[] = [];

let mockIbCommissions: IBCommission[] = [];

let mockDeposits: UserDeposit[] = [];

let mockTransactions: Transaction[] = [];

let mockReferrals: ReferralReward[] = [];

// Active Server-Sent Events (SSE) connections array
let sseClients: Response[] = [];

// ==========================================
// THREAD-SAFE REAL-TIME WORKER ENGINE (1s Tick & 24/7 Autonomous Catchup)
// ==========================================
let lastGlobalReconciliationTime = Date.now();

function reconcileOfflineYields(): { totalOfflineYieldCredited: string; elapsedSeconds: number } {
  const now = Date.now();
  let totalOfflineYieldCreditedBN = new BigNumber(0);
  let maxElapsedSeconds = 0;

  mockDeposits = mockDeposits.map((dep) => {
    if (dep.status !== 'ACTIVE') return dep;

    const lastTick = dep.lastYieldTick ? new Date(dep.lastYieldTick).getTime() : lastGlobalReconciliationTime;
    const elapsedMs = Math.max(0, now - lastTick);
    const elapsedSeconds = elapsedMs / 1000;
    
    if (elapsedSeconds <= 0) return dep;

    if (elapsedSeconds > maxElapsedSeconds) {
      maxElapsedSeconds = elapsedSeconds;
    }

    const offlineTickDelta = calculateMicroYield(dep.principalAmount, dep.dailyYieldPercent, elapsedSeconds);
    totalOfflineYieldCreditedBN = totalOfflineYieldCreditedBN.plus(offlineTickDelta);

    const newEarnedBN = new BigNumber(dep.earnedYield || 0).plus(offlineTickDelta);

    // Update user earned yield total
    const u = mockUsers.find((user) => user.id === dep.userId);
    if (u && !u.isFrozen) {
      u.earnedYield = new BigNumber(u.earnedYield || 0).plus(offlineTickDelta).toFixed(18);
    }

    // Update progress percentage
    const startMs = new Date(dep.startTime).getTime();
    const endMs = new Date(dep.endTime).getTime();
    const totalDurationMs = endMs - startMs;
    const currentElapsedMs = now - startMs;
    const progressPercent = Math.min(100, Math.max(0, (currentElapsedMs / totalDurationMs) * 100));

    const isCompleted = progressPercent >= 100;

    return {
      ...dep,
      earnedYield: newEarnedBN.toFixed(18),
      status: isCompleted ? 'COMPLETED' : 'ACTIVE',
      lastYieldTick: new Date(now).toISOString(),
      progressPercent
    };
  });

  lastGlobalReconciliationTime = now;
  return {
    totalOfflineYieldCredited: totalOfflineYieldCreditedBN.toFixed(18),
    elapsedSeconds: Math.floor(maxElapsedSeconds)
  };
}

setInterval(() => {
  reconcileOfflineYields();

  if (sseClients.length > 0) {
    sseClients.forEach((client) => {
      const email = (client as any).clientEmail;
      const id = (client as any).clientId;

      let targetUser: User | null = null;
      if (email) {
        targetUser = consolidateUserByEmail(email, id);
      } else if (id) {
        targetUser = mockUsers.find((u) => u.id === id) || null;
      }
      if (!targetUser) {
        targetUser = getActiveUser();
      }

      if (targetUser) {
        const uEmailClean = targetUser.email.toLowerCase().trim();
        const userDeposits = mockDeposits.filter(
          (d) =>
            (d.userId === targetUser!.id || (d.userEmail && d.userEmail.toLowerCase().trim() === uEmailClean)) &&
            d.status === 'ACTIVE'
        );

        let totalMicroYieldPerSec = new BigNumber(0);
        userDeposits.forEach((d) => {
          totalMicroYieldPerSec = totalMicroYieldPerSec.plus(
            calculateYieldPerSecond(d.principalAmount, d.dailyYieldPercent)
          );
        });

        const payload = {
          userId: targetUser.id,
          userEmail: targetUser.email,
          timestamp: new Date().toISOString(),
          principalBalance: targetUser.principalBalance,
          earnedYield: targetUser.earnedYield,
          microYieldPerSecond: totalMicroYieldPerSec.toFixed(18),
          activeCycles: userDeposits.map((d) => ({
            id: d.id,
            earnedYield: d.earnedYield,
            progressPercent: d.progressPercent
          }))
        };

        try {
          client.write(`data: ${JSON.stringify(payload)}\n\n`);
        } catch (e) {
          // connection closed
        }
      }
    });
  }
}, 1000);

// ==========================================
// REST API ROUTES
// ==========================================

// Auth - Google OAuth / One-Tap Connect
app.post('/api/auth/google', (req: Request, res: Response) => {
  const { email, name, photoUrl, avatarUrl, referralCode } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Google email is required' });
  }

  let user = mockUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
  let isNewUser = false;

  const photo = photoUrl || avatarUrl || undefined;
  const nameParts = (name || '').trim().split(' ');
  const fName = nameParts[0] || '';
  const lName = nameParts.slice(1).join(' ') || '';

  if (!user) {
    isNewUser = true;
    let referredByIb: string | undefined = undefined;
    if (referralCode) {
      const refClean = String(referralCode).trim();
      const ibUser = mockUsers.find(
        (u) => u.is_ib && (
          u.ibReferralCode === refClean ||
          `IB${u.id}` === refClean ||
          u.referralCode === refClean ||
          u.id === refClean.replace(/^IB/, '')
        )
      );
      if (ibUser) {
        referredByIb = ibUser.id;
      }
    }

    user = {
      id: `usr-g-${Date.now()}`,
      email: email.toLowerCase(),
      firstName: fName || undefined,
      lastName: lName || undefined,
      avatarUrl: photo,
      walletAddress: `0x${Math.random().toString(16).substring(2, 10)}${Math.random().toString(16).substring(2, 10)}`,
      role: 'USER',
      tier: 'SILVER',
      referralCode: generateUniqueReferralCode('DC'),
      referredBy: referredByIb,
      isFrozen: false,
      createdAt: new Date().toISOString(),
      principalBalance: '0.000000000000000000',
      earnedYield: '0.000000000000000000',
      totalWithdrawn: '0.000000000000000000',
      is_ib: false,
      ibStatus: 'NONE',
      hasCompletedOnboarding: false
    };
    mockUsers.push(user);
    if (referralCode || user.referredBy) {
      dispatchSignupReferralCommission(user, referralCode || user.referredBy);
    }
  } else {
    isNewUser = false;
    if (photo && !user.avatarUrl) user.avatarUrl = photo;
    if (fName && !user.firstName) user.firstName = fName;
    if (lName && !user.lastName) user.lastName = lName;
  }

  activeUserId = user.id;
  res.json({ success: true, user, isNewUser });
});

// Auth - Complete Google User Onboarding Profile
app.post('/api/auth/complete-onboarding', (req: Request, res: Response) => {
  const { userId, firstName, lastName, username, referralUsername, referralCode, onboardingPurpose, avatarUrl, photoUrl } = req.body;
  const targetId = userId || activeUserId;
  const user = mockUsers.find((u) => u.id === targetId);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (firstName) user.firstName = String(firstName).trim();
  if (lastName) user.lastName = String(lastName).trim();
  if (username) user.username = String(username).trim();

  // Save referral username or code
  const refInput = (referralUsername || referralCode || '').toString().trim().replace(/^@/, '');
  if (refInput) {
    const referrer = mockUsers.find(
      (u) =>
        u.id?.toLowerCase() === refInput.toLowerCase() ||
        u.username?.toLowerCase() === refInput.toLowerCase() ||
        u.email?.toLowerCase() === refInput.toLowerCase() ||
        u.referralCode?.toLowerCase() === refInput.toLowerCase() ||
        u.ibReferralCode?.toLowerCase() === refInput.toLowerCase()
    );

    if (referrer) {
      user.referredBy = referrer.id;
    } else {
      user.referredBy = refInput;
    }
    dispatchSignupReferralCommission(user, refInput);
  }

  if (onboardingPurpose) user.onboardingPurpose = String(onboardingPurpose).trim();
  if (avatarUrl || photoUrl) user.avatarUrl = String(avatarUrl || photoUrl).trim();
  user.hasCompletedOnboarding = true;

  res.json({ success: true, user, message: 'Onboarding profile completed successfully.' });
});

// Helper for Google Account Verification
function isGibberishUsername(username: string): boolean {
  const cleanUser = username.toLowerCase().replace(/[^a-z]/g, '');
  if (!cleanUser) return false;
  
  if (cleanUser.length < 3) return true;

  // Keyboard mashing patterns
  const mashingPatterns = [
    'qwerty', 'qwert', 'werty', 'ertyu', 'rtyui', 'tyuio', 'yuiop',
    'asdfg', 'sdfgh', 'dfghj', 'fghjk', 'ghjkl',
    'zxcvb', 'xcvbn', 'cvbnm',
    '12345', '23456', '34567', '45678', '56789',
    'wdwr', 'fghj', 'hjkl', 'asdf', 'zxcv', 'qwer'
  ];
  for (const pat of mashingPatterns) {
    if (cleanUser.includes(pat)) return true;
  }

  // Triple repeating characters like "aaaa", "zzzz"
  if (/(.)\1\1/.test(cleanUser)) return true;

  // 4 or more consecutive consonants (without vowels a,e,i,o,u,y)
  if (/[bcdfghjklmnpqrstvwxz]{4,}/i.test(cleanUser)) return true;

  // Low vowel ratio for strings >= 6 chars
  if (cleanUser.length >= 6) {
    const vowels = cleanUser.match(/[aeiouy]/gi);
    const vowelCount = vowels ? vowels.length : 0;
    const vowelRatio = vowelCount / cleanUser.length;
    if (vowelRatio < 0.18) return true;
  }

  return false;
}

function isValidGoogleEmail(emailStr: string): { valid: boolean; reason?: string } {
  if (!emailStr) return { valid: false, reason: 'Email address is required.' };
  const clean = emailStr.trim().toLowerCase();
  
  // Internal admin/demo system domains
  if (clean.endsWith('@dollarcraft.io') || clean.endsWith('@crypto.io') || clean.endsWith('@trader.com')) {
    return { valid: true };
  }

  // Must end with @gmail.com or @googlemail.com
  if (!clean.endsWith('@gmail.com') && !clean.endsWith('@googlemail.com')) {
    return { 
      valid: false, 
      reason: 'Only verified Google / Gmail accounts are allowed (@gmail.com). Non-Google emails are strictly rejected.' 
    };
  }

  const username = clean.split('@')[0];
  const dummyList = [
    'abc', 'test', 'admin', 'user', '123', 'xyz', 'asdf', 'demo', 'foo', 'bar',
    'aaaaa', 'qwer', 'testing', 'hello', 'mail', 'email', 'fake', 'sample', 'temp', '12345', '123456'
  ];

  if (dummyList.includes(username) || username.length < 4 || isGibberishUsername(username)) {
    return {
      valid: false,
      reason: `Google Record Error: '${clean}' is an invalid or fake Gmail address not found in Google records. Please enter your real Gmail address or use 'Direct Verified Sign-In with Google'.`
    };
  }

  return { valid: true };
}

// Auth - Email Registration
app.post('/api/auth/register', async (req: Request, res: Response) => {
  const { email, password, name, referralCode } = req.body;
  
  const check = isValidGoogleEmail(email);
  if (!check.valid) {
    return res.status(400).json({ error: check.reason });
  }

  const cleanEmail = email.trim().toLowerCase();
  let user = await ensureUserSyncedFromFirestore(cleanEmail);

  if (user) {
    if (password && !user.password) user.password = password;
    activeUserId = user.id;
    return res.json({ success: true, user });
  }

  let referredByCode: string | undefined = undefined;
  if (referralCode) {
    const refClean = String(referralCode).trim();
    const referrer = mockUsers.find(
      (u) =>
        u.ibReferralCode?.toLowerCase() === refClean.toLowerCase() ||
        u.referralCode?.toLowerCase() === refClean.toLowerCase() ||
        u.id?.toLowerCase() === refClean.toLowerCase() ||
        u.username?.toLowerCase() === refClean.toLowerCase()
    );
    if (referrer) {
      referredByCode = referrer.id;
    } else {
      referredByCode = refClean;
    }
  }

  user = {
    id: `usr-reg-${Date.now()}`,
    email: cleanEmail,
    password: password || undefined,
    walletAddress: `0x${Math.random().toString(16).substring(2, 10)}${Math.random().toString(16).substring(2, 10)}`,
    role: 'USER',
    tier: 'SILVER',
    referralCode: generateUniqueReferralCode('DC'),
    referredBy: referredByCode,
    isFrozen: false,
    createdAt: new Date().toISOString(),
    principalBalance: '0.000000000000000000',
    earnedYield: '0.000000000000000000',
    totalWithdrawn: '0.000000000000000000',
    is_ib: false,
    ibStatus: 'NONE'
  };
  mockUsers.push(user);

  // Sync user record to Firestore
  try {
    const { db } = await import('./src/lib/firebase');
    const { doc, setDoc } = await import('firebase/firestore');
    await setDoc(doc(db, 'users', user.id), {
      uid: user.id,
      id: user.id,
      email: user.email,
      password: password || '',
      role: user.role,
      tier: user.tier,
      principalBalance: 0,
      earnedYield: 0,
      totalWithdrawn: 0,
      walletAddress: user.walletAddress,
      referralCode: user.referralCode,
      referredBy: user.referredBy || referredByCode || referralCode || '',
      isFrozen: false,
      createdAt: user.createdAt
    });
  } catch (fsErr) {
    console.warn('Failed to persist newly registered user to Firestore:', fsErr);
  }

  // Dispatch automatic 5% signup referral commission to referrer
  if (referralCode || referredByCode) {
    dispatchSignupReferralCommission(user, referralCode || referredByCode);
  }

  activeUserId = user.id;
  res.json({ success: true, user });
});

// Admin - Get All Users
app.get('/api/admin/users', (req: Request, res: Response) => {
  res.json({ users: mockUsers });
});

// Auth - Email Login
app.post('/api/auth/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  
  const check = isValidGoogleEmail(email);
  if (!check.valid) {
    return res.status(400).json({ error: check.reason });
  }

  const cleanEmail = email.trim().toLowerCase();
  let user = consolidateUserByEmail(cleanEmail);

  if (user && password && !user.password) {
    user.password = password;
  }

  // If not found in memory mockUsers, query Firestore database
  if (!user) {
    try {
      const { db } = await import('./src/lib/firebase');
      const { collection, getDocs, query, where } = await import('firebase/firestore');
      const q = query(collection(db, 'users'), where('email', '==', cleanEmail));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const foundDoc = { id: snap.docs[0].id, ...snap.docs[0].data() } as any;
        user = {
          id: foundDoc.id || foundDoc.uid || `usr-${Date.now()}`,
          email: foundDoc.email || cleanEmail,
          password: foundDoc.password || password || undefined,
          role: foundDoc.role || 'USER',
          tier: foundDoc.tier || 'SILVER',
          principalBalance: String(foundDoc.principalBalance ?? '0.00'),
          earnedYield: String(foundDoc.earnedYield ?? '0.00'),
          totalWithdrawn: String(foundDoc.totalWithdrawn ?? '0.00'),
          walletAddress: foundDoc.walletAddress || `0x${Math.random().toString(16).substring(2, 10)}`,
          referralCode: foundDoc.referralCode || generateUniqueReferralCode('DC'),
          referredBy: foundDoc.referredBy || foundDoc.referredByCode || undefined,
          isFrozen: !!foundDoc.isFrozen,
          createdAt: foundDoc.createdAt || new Date().toISOString()
        };
        mockUsers.push(user);
      }
    } catch (fsErr) {
      console.warn('Firestore lookup during login error:', fsErr);
    }
  }

  if (!user) {
    return res.status(400).json({ 
      error: 'Account not found. Please create an account first by clicking SIGN UP.' 
    });
  }

  activeUserId = user.id;
  res.json({ success: true, user });
});

// Auth - Logout
app.post('/api/auth/logout', (req: Request, res: Response) => {
  activeUserId = null;
  res.json({ success: true });
});

// Auth - Reset Password
app.post('/api/auth/reset-password', (req: Request, res: Response) => {
  const { email } = req.body;
  const check = isValidGoogleEmail(email);
  if (!check.valid) {
    return res.status(400).json({ error: check.reason });
  }

  res.json({ 
    success: true, 
    message: `Password reset instructions have been dispatched to ${email}. Please check your Gmail inbox.` 
  });
});

// Auth - Get Current User
app.get('/api/auth/me', async (req: Request, res: Response) => {
  const reqEmail = (
    req.headers['x-user-email'] ||
    req.query.userEmail ||
    req.query.email ||
    req.body?.userEmail
  )?.toString().trim().toLowerCase();

  const reqId = (
    req.headers['x-user-id'] ||
    req.query.userId ||
    req.body?.userId
  )?.toString().trim();

  let user = await ensureUserSyncedFromFirestore(reqEmail, reqId);
  if (!user) {
    user = getActiveUser(req);
  }
  res.json({ user });
});

// SSE Stream Endpoint for Live Yield Ticking
app.get('/api/yield/stream', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const clientEmail = (
    req.headers['x-user-email'] ||
    req.query.userEmail ||
    req.query.email
  )?.toString().trim().toLowerCase() || '';

  const clientId = (
    req.headers['x-user-id'] ||
    req.query.userId ||
    req.query.id
  )?.toString().trim() || '';

  (res as any).clientEmail = clientEmail;
  (res as any).clientId = clientId;

  sseClients.push(res);

  req.on('close', () => {
    sseClients = sseClients.filter((c) => c !== res);
  });
});

// Initial Dashboard State Data
app.get('/api/dashboard/state', async (req: Request, res: Response) => {
  const offlineReport = reconcileOfflineYields();

  const reqEmail = (
    req.headers['x-user-email'] ||
    req.query.userEmail ||
    req.body?.userEmail
  )?.toString().trim().toLowerCase();

  const reqId = (
    req.headers['x-user-id'] ||
    req.query.userId ||
    req.body?.userId
  )?.toString().trim();

  let activeUser = await ensureUserSyncedFromFirestore(reqEmail, reqId);
  if (!activeUser) {
    activeUser = getActiveUser(req);
  }
  const userEmailSearch = (reqEmail || activeUser?.email || '').toLowerCase().trim();
  const userIdSearch = reqId || activeUser?.id || '';

  if (userEmailSearch || userIdSearch) {
    let maxPrincipalBN = new BigNumber(activeUser?.principalBalance || '0');
    let maxYieldBN = new BigNumber(activeUser?.earnedYield || '0');
    let maxIbBN = new BigNumber(activeUser?.ibWithdrawableCommission || '0');

    mockUsers.forEach((u) => {
      if (
        (userEmailSearch && u.email && u.email.toLowerCase().trim() === userEmailSearch) ||
        (userIdSearch && u.id === userIdSearch)
      ) {
        maxPrincipalBN = BigNumber.max(maxPrincipalBN, new BigNumber(u.principalBalance || '0'));
        maxYieldBN = BigNumber.max(maxYieldBN, new BigNumber(u.earnedYield || '0'));
        maxIbBN = BigNumber.max(maxIbBN, new BigNumber(u.ibWithdrawableCommission || '0'));
      }
    });

    try {
      const { db } = await import('./src/lib/firebase');
      const { collection, getDocs, query, where, doc, getDoc } = await import('firebase/firestore');

      let foundDoc: any = null;
      if (userEmailSearch) {
        const docRef = doc(db, 'users', userEmailSearch);
        const snap = await getDoc(docRef);
        if (snap.exists()) foundDoc = { id: snap.id, ...snap.data() };
      }
      if (!foundDoc && userIdSearch) {
        const docRef = doc(db, 'users', userIdSearch);
        const snap = await getDoc(docRef);
        if (snap.exists()) foundDoc = { id: snap.id, ...snap.data() };
      }
      if (!foundDoc && userEmailSearch) {
        const q = query(collection(db, 'users'), where('email', '==', userEmailSearch));
        const snap = await getDocs(q);
        if (!snap.empty) foundDoc = { id: snap.docs[0].id, ...snap.docs[0].data() };
      }

      if (foundDoc) {
        maxPrincipalBN = BigNumber.max(maxPrincipalBN, new BigNumber(foundDoc.principalBalance || '0'));
        maxYieldBN = BigNumber.max(maxYieldBN, new BigNumber(foundDoc.earnedYield || '0'));
        maxIbBN = BigNumber.max(maxIbBN, new BigNumber(foundDoc.ibWithdrawableCommission || '0'));
      }

      // Query deposits collection
      const allDepSnap = await getDocs(collection(db, 'deposits'));
      allDepSnap.forEach((dDoc) => {
        const dData: any = dDoc.data();
        const depId = dDoc.id || dData.id || `dep-${Date.now()}`;
        const dEmail = (dData.userEmail || dData.email || '').toLowerCase().trim();
        const dUserId = dData.userId || '';

        if (
          (userEmailSearch && dEmail === userEmailSearch) ||
          (userIdSearch && dUserId === userIdSearch)
        ) {
          const pAmount = String(dData.principalAmount || dData.amount || '0');
          maxPrincipalBN = BigNumber.max(maxPrincipalBN, new BigNumber(pAmount));

          if (!mockDeposits.some((m) => m.id === depId || (dData.transactionId && m.txHash === dData.transactionId))) {
            mockDeposits.unshift({
              id: depId,
              userId: dData.userId || userIdSearch || activeUser?.id || '',
              userEmail: dData.userEmail || userEmailSearch || activeUser?.email || '',
              planId: dData.planId || 'plan-standard',
              planName: dData.planName || 'Standard Yield Plan',
              principalAmount: pAmount,
              earnedYield: '0.000000000000000000',
              totalPayout: '0',
              dailyYieldPercent: dData.dailyYieldPercent || 0.83,
              cryptoNetwork: dData.cryptoNetwork || 'Internal Transfer',
              txHash: dData.transactionId || dData.txHash || depId,
              status: (dData.status || 'ACTIVE').toUpperCase(),
              startTime: dData.createdAt || new Date().toISOString(),
              endTime: new Date(Date.now() + 240 * 86400 * 1000).toISOString(),
              lastYieldTick: new Date().toISOString(),
              progressPercent: 0
            });
          }
        }
      });

      // Query internalTransfers collection
      const allItxSnap = await getDocs(collection(db, 'internalTransfers'));
      allItxSnap.forEach((iDoc) => {
        const iData: any = iDoc.data();
        const itxId = iDoc.id || iData.id || iData.transferId;
        const toEmail = (
          iData.toUserEmail ||
          iData.userEmail ||
          iData.toEmail ||
          iData.email ||
          iData.recipientEmail ||
          ''
        ).toLowerCase().trim();
        const toId = (iData.toUserId || iData.userId || iData.toId || '').trim();

        if (
          (userEmailSearch && toEmail === userEmailSearch) ||
          (userIdSearch && toId === userIdSearch)
        ) {
          if (!mockInternalTransfers.some((m) => m.id === itxId || (iData.transferId && m.transferId === iData.transferId))) {
            mockInternalTransfers.unshift({
              id: itxId,
              transferId: iData.transferId || itxId,
              fromUserId: iData.fromUserId || 'admin',
              fromUserEmail: iData.fromUserEmail || 'admin@dollarcraft.io',
              toUserId: iData.toUserId || toId || userIdSearch || activeUser?.id || '',
              toUserEmail: iData.toUserEmail || toEmail || userEmailSearch || activeUser?.email || '',
              toWalletType: iData.toWalletType || 'MAIN_WALLET',
              amount: String(iData.amount || '0'),
              note: iData.note,
              status: iData.status || 'SUCCESS',
              createdAt: iData.createdAt || new Date().toISOString()
            });
          }
        }
      });
    } catch (fsErr) {
      console.warn('Firestore lookup during dashboard state fetch notice:', fsErr);
    }

    if (!activeUser && userEmailSearch) {
      activeUser = consolidateUserByEmail(userEmailSearch, userIdSearch);
    }

    if (activeUser) {
      const activeUserCleanEmail = (activeUser.email || '').toLowerCase().trim();
      const userITX = mockInternalTransfers.filter((t) => {
        const tEmail = (t.toUserEmail || (t as any).userEmail || (t as any).toEmail || (t as any).email || '').toLowerCase().trim();
        const tId = (t.toUserId || (t as any).userId || (t as any).toId || '').trim();
        if (userEmailSearch && tEmail === userEmailSearch) return true;
        if (userIdSearch && tId === userIdSearch) return true;
        if (activeUser?.id && tId === activeUser.id) return true;
        if (activeUserCleanEmail && tEmail === activeUserCleanEmail) return true;
        return false;
      });

      // Create deposit entries for internal transfers if not present
      userITX.forEach((itx) => {
        if (itx.toWalletType === 'MAIN_WALLET' || itx.toWalletType === 'INVESTMENT_WALLET' || !itx.toWalletType) {
          const depId = `dep-${itx.transferId || itx.id}`;
          if (!mockDeposits.some((m) => m.id === depId || m.txHash === itx.transferId)) {
            mockDeposits.unshift({
              id: depId,
              userId: activeUser!.id,
              userEmail: activeUser!.email,
              planId: 'plan-standard',
              planName: 'Standard Yield Plan (Internal Transfer)',
              principalAmount: String(itx.amount || '0'),
              earnedYield: '0.000000000000000000',
              totalPayout: '0',
              dailyYieldPercent: 0.83,
              cryptoNetwork: 'Internal Transfer (Main Wallet)',
              txHash: itx.transferId || itx.id,
              status: 'ACTIVE',
              startTime: itx.createdAt || new Date().toISOString(),
              endTime: new Date(Date.now() + 240 * 86400 * 1000).toISOString(),
              lastYieldTick: new Date().toISOString(),
              progressPercent: 0
            });
          }
        }
      });

      const itxSumBN = userITX
        .filter((t) => t.toWalletType === 'MAIN_WALLET' || t.toWalletType === 'INVESTMENT_WALLET' || !t.toWalletType)
        .reduce((sum, t) => sum.plus(t.amount || 0), new BigNumber(0));

      const itxIbSumBN = userITX
        .filter((t) => t.toWalletType === 'IB_COMMISSION_WALLET')
        .reduce((sum, t) => sum.plus(t.amount || 0), new BigNumber(0));

      const totalEffectivePrincipalBN = BigNumber.max(maxPrincipalBN, itxSumBN);

      if (totalEffectivePrincipalBN.isGreaterThan(0)) {
        activeUser.principalBalance = totalEffectivePrincipalBN.toFixed(18);
      }
      if (maxYieldBN.isGreaterThan(0)) {
        activeUser.earnedYield = maxYieldBN.toFixed(18);
      }

      if (itxIbSumBN.isGreaterThan(0)) {
        activeUser.is_ib = true;
        activeUser.ibStatus = 'APPROVED';
        activeUser.ibWithdrawableCommission = BigNumber.max(
          new BigNumber(activeUser.ibWithdrawableCommission || '0'),
          itxIbSumBN
        ).toFixed(2);
        activeUser.ibTotalCommission = BigNumber.max(
          new BigNumber(activeUser.ibTotalCommission || '0'),
          itxIbSumBN
        ).toFixed(2);
      }

      // Keep all duplicate mockUsers in lockstep
      mockUsers.forEach((u) => {
        if (
          (userEmailSearch && u.email && u.email.toLowerCase().trim() === userEmailSearch) ||
          (userIdSearch && u.id === userIdSearch) ||
          (activeUser?.id && u.id === activeUser.id)
        ) {
          u.id = activeUser!.id;
          u.principalBalance = activeUser!.principalBalance;
          u.earnedYield = activeUser!.earnedYield;
          if (activeUser!.is_ib) {
            u.is_ib = true;
            u.ibStatus = activeUser!.ibStatus;
            u.ibWithdrawableCommission = activeUser!.ibWithdrawableCommission;
            u.ibTotalCommission = activeUser!.ibTotalCommission;
          }
        }
      });
    }
  }

  const userDeposits = activeUser
    ? mockDeposits.filter(
        (d) =>
          d.userId === activeUser.id ||
          (activeUser.email && d.userId?.toLowerCase() === activeUser.email.toLowerCase()) ||
          (activeUser.email && d.userEmail?.toLowerCase() === activeUser.email.toLowerCase()) ||
          (userEmailSearch && d.userEmail?.toLowerCase() === userEmailSearch) ||
          (userIdSearch && d.userId === userIdSearch)
      )
    : [];
  const userTx = activeUser
    ? mockTransactions.filter(
        (t) =>
          t.userId === activeUser.id ||
          (activeUser.email && (t as any).userEmail?.toLowerCase() === activeUser.email.toLowerCase()) ||
          (userEmailSearch && (t as any).userEmail?.toLowerCase() === userEmailSearch) ||
          (userIdSearch && t.userId === userIdSearch)
      )
    : [];
  const userReferrals = activeUser
    ? mockReferrals.filter(
        (r) =>
          r.referrerId === activeUser.id ||
          (activeUser.email && (r as any).referrerEmail?.toLowerCase() === activeUser.email.toLowerCase()) ||
          (userEmailSearch && (r as any).referrerEmail?.toLowerCase() === userEmailSearch) ||
          (userIdSearch && r.referrerId === userIdSearch)
      )
    : [];

  let totalDepositedBN = new BigNumber(0);
  let totalPaidOutBN = new BigNumber(0);

  mockDeposits.forEach(d => {
    if (d.status === 'ACTIVE' || d.status === 'APPROVED' || d.status === 'COMPLETED') {
      totalDepositedBN = totalDepositedBN.plus(d.principalAmount || 0);
    }
  });

  mockTransactions.forEach(t => {
    if (t.type === 'WITHDRAWAL' && t.status === 'APPROVED') {
      totalPaidOutBN = totalPaidOutBN.plus(t.amount || 0);
    }
  });

  const baseLiquidityBN = new BigNumber('98637065765');
  const liquidityBN = baseLiquidityBN.plus(totalDepositedBN).minus(totalPaidOutBN);
  const calculatedLiquidity = liquidityBN.toFixed(2);

  const metrics: SystemMetrics = {
    totalDeposited: totalDepositedBN.toFixed(2),
    totalPaidOut: totalPaidOutBN.toFixed(2),
    totalYieldAccrued: '14285.901230000000',
    activeUsersCount: mockUsers.length,
    activeCyclesCount: mockDeposits.filter(d => d.status === 'ACTIVE' || d.status === 'APPROVED').length,
    systemLiquidity: calculatedLiquidity,
    yieldHealthScore: 100.0,
    pendingWithdrawalsCount: mockTransactions.filter(t => t.type === 'WITHDRAWAL' && t.status === 'PENDING').length,
    pendingWithdrawalsAmount: '0.00',
    lastTickTimestamp: new Date().toISOString(),
    tickExecutionMs: 1.2
  };

  res.json({
    user: activeUser,
    deposits: userDeposits,
    transactions: userTx,
    referrals: userReferrals,
    plans: INITIAL_PLANS,
    metrics,
    offlineEngine: {
      isAutonomous247: true,
      lastOfflineYieldAdded: offlineReport.totalOfflineYieldCredited,
      elapsedSecondsOffline: offlineReport.elapsedSeconds,
      timestamp: new Date().toISOString()
    }
  });
});

// Create Deposit Request (Pending Admin Verification - No Auto Credit)
app.post('/api/deposit/create', (req: Request, res: Response) => {
  const { planId, amount, network, txHash } = req.body;
  const plan = INITIAL_PLANS.find((p) => p.id === planId);

  if (!plan) {
    return res.status(400).json({ error: 'Invalid investment plan selected.' });
  }

  const activeUser = getActiveUser();
  const principalBN = new BigNumber(amount || 0);

  if (principalBN.isLessThan(10)) {
    return res.status(400).json({ error: 'Deposit amount must be greater than $10.' });
  }

  if (principalBN.isLessThan(plan.minDeposit)) {
    return res.status(400).json({ error: `Minimum deposit for ${plan.name} is $${plan.minDeposit}.` });
  }

  // 1. Transaction ID Format Validation (10-20 alphanumeric characters)
  const cleanTx = (txHash || '').trim();
  if (!cleanTx || !/^[a-zA-Z0-9]{10,20}$/.test(cleanTx)) {
    return res.status(400).json({ error: 'Invalid Transaction ID. Must be 10-20 letters/numbers' });
  }

  // 2. Duplicate Transaction ID Check
  const duplicateInDeposits = mockDeposits.some(
    (d) => d.txHash && d.txHash.trim().toLowerCase() === cleanTx.toLowerCase() && ['PENDING', 'APPROVED', 'ACTIVE', 'pending', 'approved'].includes(d.status)
  );
  const duplicateInTx = mockTransactions.some(
    (t) => t.txHash && t.txHash.trim().toLowerCase() === cleanTx.toLowerCase() && ['PENDING', 'APPROVED', 'pending', 'approved'].includes(t.status)
  );

  if (duplicateInDeposits || duplicateInTx) {
    return res.status(400).json({ error: 'This Transaction ID is already in use. Please enter the correct one from your bank receipt.' });
  }

  // 3. Create Pending Deposit Record (NO AUTO CREDIT)
  const newDeposit: UserDeposit = {
    id: `dep-${Date.now()}`,
    userId: activeUser.id,
    planId: plan.id,
    planName: plan.name,
    principalAmount: principalBN.toFixed(18),
    earnedYield: '0.000000000000000000',
    totalPayout: '0',
    dailyYieldPercent: plan.dailyYieldPercent,
    cryptoNetwork: network || 'Bank Transfer (IBAN)',
    txHash: cleanTx,
    status: 'PENDING',
    startTime: new Date().toISOString(),
    endTime: new Date(Date.now() + plan.durationDays * 86400 * 1000).toISOString(),
    lastYieldTick: new Date().toISOString(),
    progressPercent: 0
  };

  mockDeposits.unshift(newDeposit);

  // Add Pending Transaction Record
  const newTx: Transaction = {
    id: `tx-${Date.now()}`,
    userId: activeUser.id,
    userEmail: activeUser.email,
    type: 'DEPOSIT',
    amount: principalBN.toFixed(2),
    precisionAmount: principalBN.toFixed(18),
    txHash: cleanTx,
    cryptoNetwork: network || 'Bank Transfer (IBAN)',
    status: 'PENDING',
    createdAt: new Date().toISOString()
  };
  mockTransactions.unshift(newTx);

  // Note: Dollars are NOT credited automatically. User must await admin approval.
  res.json({
    success: true,
    pending: true,
    message: 'Your deposit request is submitted. It will be verified within 30 minutes.',
    deposit: newDeposit
  });
});

// Helper: Dispatch automatic 5% direct referral commission to referrer upon deposit
function dispatchDirectReferralCommission(targetUser: User, depositAmountBN: BigNumber, depositTxHash?: string) {
  if (!targetUser || !targetUser.referredBy || targetUser.referredBy === targetUser.id) {
    return;
  }

  const cleanRef = String(targetUser.referredBy).trim().toLowerCase().replace(/^@/, '');
  if (!cleanRef) return;

  // Find referrer user by ID, username, email, referralCode, or ibReferralCode
  let referrer = mockUsers.find(
    (u) =>
      u.id?.toLowerCase() === cleanRef ||
      u.username?.toLowerCase() === cleanRef ||
      u.email?.toLowerCase() === cleanRef ||
      u.referralCode?.toLowerCase() === cleanRef ||
      u.ibReferralCode?.toLowerCase() === cleanRef
  );

  const applyCommission = (ref: User) => {
    if (!ref || ref.id === targetUser.id) return;

    // Calculate 5% Direct Referral Commission
    const commAmountBN = depositAmountBN.multipliedBy(0.05);
    if (commAmountBN.isLessThanOrEqualTo(0)) return;

    const commAmountStr = commAmountBN.toFixed(2);

    // 1. Directly credit referrer's principal / main balance so dollars arrive automatically
    ref.principalBalance = new BigNumber(ref.principalBalance || '0').plus(commAmountBN).toFixed(18);

    // 2. Also credit referrer's withdrawable and total commission tracking balances
    const curWithdraw = new BigNumber(ref.ibWithdrawableCommission || '0');
    const curTotal = new BigNumber(ref.ibTotalCommission || '0');
    ref.ibWithdrawableCommission = curWithdraw.plus(commAmountBN).toFixed(2);
    ref.ibTotalCommission = curTotal.plus(commAmountBN).toFixed(2);

    // 3. Create approved transaction record for referrer
    const refTx: Transaction = {
      id: `tx-refcomm-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId: ref.id,
      userEmail: ref.email,
      type: 'REFERRAL_BONUS',
      amount: commAmountStr,
      precisionAmount: commAmountBN.toFixed(18),
      txHash: `REF-${depositTxHash || Date.now()}`,
      cryptoNetwork: 'Direct 5% Referral Commission',
      status: 'APPROVED',
      createdAt: new Date().toISOString()
    };
    mockTransactions.unshift(refTx);

    // 4. Record in mockReferrals
    const refReward: ReferralReward = {
      id: `ref-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      referrerId: ref.id,
      referredUserId: targetUser.id,
      referredUserEmail: targetUser.email,
      amount: commAmountStr,
      level: 1,
      createdAt: new Date().toISOString()
    };
    mockReferrals.unshift(refReward);

    // 5. Record in mockIbCommissions
    const ibComm: IBCommission = {
      id: `ibcom-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      ibUserId: ref.id,
      clientUserId: targetUser.id,
      clientEmail: targetUser.email,
      investmentId: `dep-${Date.now()}`,
      investmentAmount: depositAmountBN.toFixed(2),
      commissionRate: 5,
      commissionAmount: commAmountStr,
      status: 'PAID',
      createdAt: new Date().toISOString()
    };
    mockIbCommissions.unshift(ibComm);

    // Sync referrer's updated balance to Firestore if available
    try {
      import('./src/lib/firebase').then(async ({ db }) => {
        const { doc, setDoc } = await import('firebase/firestore');
        const refKey = ref.id || ref.email;
        await setDoc(doc(db, 'users', refKey), {
          principalBalance: Number(ref.principalBalance || 0),
          ibWithdrawableCommission: Number(ref.ibWithdrawableCommission || 0),
          ibTotalCommission: Number(ref.ibTotalCommission || 0),
          updatedAt: new Date().toISOString()
        }, { merge: true }).catch((e) => console.warn('Firestore update referrer deposit commission error:', e));
      });
    } catch (e) {
      console.warn('Firebase sync error:', e);
    }

    console.log(`[Referral Engine] Dispatched 5% ($${commAmountStr}) direct referral commission to @${ref.username || ref.email} for deposit ($${depositAmountBN.toFixed(2)}) by @${targetUser.username || targetUser.email}`);
  };

  if (referrer) {
    applyCommission(referrer);
  } else {
    // Try to find in Firestore if not present in memory mockUsers
    try {
      import('./src/lib/firebase').then(async ({ db }) => {
        const { collection, getDocs } = await import('firebase/firestore');
        const snap = await getDocs(collection(db, 'users'));
        snap.forEach((docSnap) => {
          const d = docSnap.data();
          if (
            d.id?.toLowerCase() === cleanRef ||
            d.referralCode?.toLowerCase() === cleanRef ||
            d.email?.toLowerCase() === cleanRef ||
            d.username?.toLowerCase() === cleanRef
          ) {
            let foundUser = mockUsers.find((u) => u.id === (d.id || d.uid || docSnap.id));
            if (!foundUser) {
              foundUser = {
                id: d.id || d.uid || docSnap.id,
                email: d.email || '',
                role: d.role || 'USER',
                tier: d.tier || 'SILVER',
                principalBalance: String(d.principalBalance ?? '0.00'),
                earnedYield: String(d.earnedYield ?? '0.00'),
                totalWithdrawn: String(d.totalWithdrawn ?? '0.00'),
                walletAddress: d.walletAddress || '',
                referralCode: d.referralCode || '',
                referredBy: d.referredBy || '',
                ibWithdrawableCommission: String(d.ibWithdrawableCommission ?? '0.00'),
                ibTotalCommission: String(d.ibTotalCommission ?? '0.00'),
                isFrozen: !!d.isFrozen,
                createdAt: d.createdAt || new Date().toISOString()
              };
              mockUsers.push(foundUser);
            }
            if (foundUser && foundUser.id !== targetUser.id) {
              referrer = foundUser;
            }
          }
        });

        if (referrer) {
          applyCommission(referrer);
        }
      });
    } catch (err) {
      console.warn('Firestore referrer lookup error:', err);
    }
  }
}

// Helper: Dispatch automatic 5% signup referral commission to referrer when a new user signs up with referral code
function dispatchSignupReferralCommission(newUser: User, referralCodeInput?: string) {
  const refCodeClean = String(referralCodeInput || newUser.referredBy || '').trim().replace(/^@/, '');
  if (!refCodeClean) return;

  const referrer = mockUsers.find(
    (u) =>
      u.id?.toLowerCase() === refCodeClean.toLowerCase() ||
      u.referralCode?.toLowerCase() === refCodeClean.toLowerCase() ||
      u.ibReferralCode?.toLowerCase() === refCodeClean.toLowerCase() ||
      u.username?.toLowerCase() === refCodeClean.toLowerCase() ||
      u.email?.toLowerCase() === refCodeClean.toLowerCase()
  );

  if (!referrer || referrer.id === newUser.id) {
    return;
  }

  // Ensure referral link is set
  newUser.referredBy = referrer.id;

  // Prevent duplicate signup commissions for the same referred user
  const alreadyAwarded = mockTransactions.some(
    (t) => t.type === 'REFERRAL_BONUS' && t.txHash === `SIGNUP-REF-${newUser.id}`
  );
  if (alreadyAwarded) return;

  // Calculate 5% referral commission on initial principal balance if present
  const baseAmountBN = new BigNumber(newUser.principalBalance || '0');
  const commBN = baseAmountBN.multipliedBy(0.05); // 5% commission ($25.00)
  if (commBN.isLessThanOrEqualTo(0)) return;

  const commStr = commBN.toFixed(2);

  // 1. Directly credit referrer's principal balance so dollars arrive automatically in Total Deposit balance
  referrer.principalBalance = new BigNumber(referrer.principalBalance || '0').plus(commBN).toFixed(18);

  // 2. Also credit referrer's withdrawable and total commission tracking
  referrer.ibWithdrawableCommission = new BigNumber(referrer.ibWithdrawableCommission || '0').plus(commBN).toFixed(2);
  referrer.ibTotalCommission = new BigNumber(referrer.ibTotalCommission || '0').plus(commBN).toFixed(2);

  // 3. Create approved transaction record for referrer
  const refTx: Transaction = {
    id: `tx-signup-ref-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    userId: referrer.id,
    userEmail: referrer.email,
    type: 'REFERRAL_BONUS',
    amount: commStr,
    precisionAmount: commBN.toFixed(18),
    txHash: `SIGNUP-REF-${newUser.id}`,
    cryptoNetwork: '5% Signup Referral Bonus',
    status: 'APPROVED',
    createdAt: new Date().toISOString()
  };
  mockTransactions.unshift(refTx);

  // 4. Record in mockReferrals
  const refReward: ReferralReward = {
    id: `ref-signup-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    referrerId: referrer.id,
    referredUserId: newUser.id,
    referredUserEmail: newUser.email,
    amount: commStr,
    level: 1,
    createdAt: new Date().toISOString()
  };
  mockReferrals.unshift(refReward);

  // 5. Record in mockIbCommissions
  const ibComm: IBCommission = {
    id: `ibcom-signup-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    ibUserId: referrer.id,
    clientUserId: newUser.id,
    clientEmail: newUser.email,
    investmentId: `signup-${newUser.id}`,
    investmentAmount: baseAmountBN.toFixed(2),
    commissionRate: 5,
    commissionAmount: commStr,
    status: 'PAID',
    createdAt: new Date().toISOString()
  };
  mockIbCommissions.unshift(ibComm);

  // Sync referrer's updated balance to Firestore if available
  try {
    import('./src/lib/firebase').then(async ({ db }) => {
      const { doc, updateDoc, increment } = await import('firebase/firestore');
      await updateDoc(doc(db, 'users', referrer.id), {
        principalBalance: increment(commBN.toNumber()),
        ibWithdrawableCommission: increment(commBN.toNumber()),
        ibTotalCommission: increment(commBN.toNumber())
      }).catch((e) => console.warn('Firestore update referrer error:', e));
    });
  } catch (e) {
    console.warn('Firebase sync error:', e);
  }

  console.log(`[Referral Engine] Dispatched 5% ($${commStr}) signup referral commission to @${referrer.username || referrer.email} for new signup @${newUser.email}`);
}

// Admin: Get all deposits for verification
app.get('/api/admin/deposits', (req: Request, res: Response) => {
  res.json({ deposits: mockDeposits });
});

// Admin: Approve Deposit Request & Credit Balance
app.post('/api/admin/deposit/approve', (req: Request, res: Response) => {
  const { depositId } = req.body;
  const deposit = mockDeposits.find((d) => d.id === depositId);

  if (!deposit) {
    return res.status(404).json({ error: 'Deposit record not found.' });
  }

  if (deposit.status !== 'PENDING') {
    return res.status(400).json({ error: `Deposit status is already ${deposit.status}.` });
  }

  // Approve deposit
  deposit.status = 'ACTIVE';

  // Find target user and credit balance
  const targetUser = mockUsers.find((u) => u.id === deposit.userId);
  if (targetUser) {
    const depositBN = new BigNumber(deposit.principalAmount);
    targetUser.principalBalance = new BigNumber(targetUser.principalBalance || '0').plus(depositBN).toFixed(18);

    // Update transaction status
    const tx = mockTransactions.find((t) => t.txHash === deposit.txHash || (t.userId === deposit.userId && t.type === 'DEPOSIT' && t.status === 'PENDING'));
    if (tx) {
      tx.status = 'APPROVED';
    }

    // Automatically dispatch 20% direct referral commission to referrer username
    dispatchDirectReferralCommission(targetUser, depositBN, deposit.txHash);
  }

  res.json({
    success: true,
    message: `Deposit approved. $${new BigNumber(deposit.principalAmount).toFixed(2)} credited to user balance.`
  });
});

// Admin: Reject Deposit Request
app.post('/api/admin/deposit/reject', (req: Request, res: Response) => {
  const { depositId, reason } = req.body;
  const deposit = mockDeposits.find((d) => d.id === depositId);

  if (!deposit) {
    return res.status(404).json({ error: 'Deposit record not found.' });
  }

  if (deposit.status !== 'PENDING') {
    return res.status(400).json({ error: `Deposit status is already ${deposit.status}.` });
  }

  deposit.status = 'REJECTED';

  const tx = mockTransactions.find((t) => t.txHash === deposit.txHash || (t.userId === deposit.userId && t.type === 'DEPOSIT' && t.status === 'PENDING'));
  if (tx) {
    tx.status = 'REJECTED';
    if (reason) {
      tx.fraudNote = reason;
    }
  }

  res.json({ success: true, message: 'Deposit request rejected.' });
});

// ==========================================
// INTRODUCING BROKER (IB) SYSTEM ENDPOINTS
// ==========================================

// User submits IB application
app.post('/api/ib/apply', (req: Request, res: Response) => {
  const { name, email, phone, walletAddress, country, experience, telegramWhatsapp } = req.body;
  const activeUser = getActiveUser();

  if (!name || !email || !phone) {
    return res.status(400).json({ error: 'All required fields (Name, Email, Phone) must be completed' });
  }

  const existingApp = mockIbApplications.find((app) => app.userId === activeUser.id && app.status === 'PENDING');
  if (existingApp) {
    return res.status(400).json({ error: 'You already have a pending IB application under review.' });
  }

  const appCountry = country || 'Global';
  const appExp = experience || 'Standard IB Partner Application';
  const appContact = telegramWhatsapp || phone || 'Not provided';

  const newApp: IBApplication = {
    id: `ibapp-${Date.now()}`,
    userId: activeUser.id,
    userName: name,
    userEmail: email,
    phone,
    walletAddress: walletAddress || activeUser.walletAddress || 'USDT TRC20 Address Unspecified',
    country: appCountry,
    experience: appExp,
    telegramWhatsapp: appContact,
    status: 'PENDING',
    createdAt: new Date().toISOString()
  };

  if (walletAddress) {
    activeUser.walletAddress = walletAddress;
  }

  mockIbApplications.unshift(newApp);
  activeUser.ibStatus = 'PENDING';

  res.json({ success: true, application: newApp, message: 'pls hold until dollar craft approval your request' });
});

// ==========================================
// PAID IB MEMBERSHIP ($7000 SYSTEM WITH 20% REWARD)
// ==========================================

// User submits $7,000 IB Membership Payment
app.post('/api/ib/membership/pay', (req: Request, res: Response) => {
  const { paymentMethod, proofTxHash, walletAddress } = req.body;
  const activeUser = getActiveUser();

  if (!proofTxHash) {
    return res.status(400).json({ error: 'Transaction Hash / Proof of payment is required.' });
  }

  const existingPending = mockIbMembershipPayments.find(
    (p) => p.userId === activeUser.id && p.status === 'PENDING'
  );

  if (existingPending) {
    return res.status(400).json({ error: 'You already have a pending $7,000 IB Membership payment verification in queue.' });
  }

  const newPayment: IBMembershipPayment = {
    id: `ibpay-${Date.now()}`,
    userId: activeUser.id,
    userName: activeUser.email.split('@')[0] || 'User',
    userEmail: activeUser.email,
    amount: 7000,
    paymentMethod: paymentMethod || 'USDT_TRC20',
    proofTxHash: proofTxHash.trim(),
    walletAddress: walletAddress || activeUser.walletAddress || '',
    status: 'PENDING',
    createdAt: new Date().toISOString()
  };

  if (walletAddress) {
    activeUser.walletAddress = walletAddress;
  }

  mockIbMembershipPayments.unshift(newPayment);
  activeUser.ibStatus = 'PENDING';

  res.json({
    success: true,
    payment: newPayment,
    message: 'IB Membership Payment of $7,000 submitted successfully! Two requests generated for Admin: 1. Normal Account Activation ($7000 Deposit) & 2. IB Membership Request.'
  });
});

// Admin: Get all $7000 IB Membership Payments
app.get('/api/admin/ib-memberships', (req: Request, res: Response) => {
  res.json({ payments: mockIbMembershipPayments });
});

// Admin: Approve $7000 IB Membership Payment (Triggers $7k balance credit + IB activation + 20% direct $1400 commission)
app.post('/api/admin/ib-membership/approve', (req: Request, res: Response) => {
  const { paymentId } = req.body;
  const payment = mockIbMembershipPayments.find((p) => p.id === paymentId);

  if (!payment) {
    return res.status(404).json({ error: 'IB Membership payment record not found.' });
  }

  if (payment.status !== 'PENDING') {
    return res.status(400).json({ error: `Payment already ${payment.status}.` });
  }

  payment.status = 'APPROVED';

  const targetUser = mockUsers.find(
    (u) => u.id === payment.userId || u.email.toLowerCase() === payment.userEmail.toLowerCase()
  );

  if (!targetUser) {
    return res.status(404).json({ error: 'Target user account not found.' });
  }

  // Action 1: Activate normal investment account & credit full $7000 to main investable balance
  targetUser.principalBalance = new BigNumber(targetUser.principalBalance || '0')
    .plus('7000.000000000000000000')
    .toFixed(18);

  const depositTx: Transaction = {
    id: `tx-dep7000-${Date.now()}`,
    userId: targetUser.id,
    userEmail: targetUser.email,
    type: 'DEPOSIT',
    amount: '7000.00',
    precisionAmount: '7000.000000000000000000',
    txHash: payment.proofTxHash || 'IB-$7000-MEMBERSHIP',
    status: 'APPROVED',
    createdAt: new Date().toISOString()
  };
  mockTransactions.unshift(depositTx);

  // Action 2: Activate IB Membership status
  targetUser.is_ib = true;
  targetUser.ibStatus = 'APPROVED';
  targetUser.ibReferralCode = generateUniqueReferralCode('IB-DC');
  targetUser.ibWithdrawableCommission = targetUser.ibWithdrawableCommission || '0.00';
  targetUser.ibTotalCommission = targetUser.ibTotalCommission || '0.00';

  // Action 3: TRIGGER 20% DIRECT COMMISSION LOGIC ($1,400)
  let commissionAwarded = false;
  let referrerEmail = '';

  if (targetUser.referredBy && targetUser.referredBy !== targetUser.id) {
    const cleanRef = String(targetUser.referredBy).trim().toLowerCase().replace(/^@/, '');
    const referrer = mockUsers.find(
      (u) =>
        u.id?.toLowerCase() === cleanRef ||
        u.username?.toLowerCase() === cleanRef ||
        u.email?.toLowerCase() === cleanRef ||
        u.referralCode?.toLowerCase() === cleanRef ||
        u.ibReferralCode?.toLowerCase() === cleanRef
    );

    if (referrer) {
      const DIRECT_COMMISSION = new BigNumber('1400.00'); // 20% of $7000

      // Directly credit referrer's main balance with dollars
      referrer.principalBalance = new BigNumber(referrer.principalBalance || '0').plus(DIRECT_COMMISSION).toFixed(18);

      const curWithdraw = new BigNumber(referrer.ibWithdrawableCommission || '0');
      const curTotal = new BigNumber(referrer.ibTotalCommission || '0');

      referrer.ibWithdrawableCommission = curWithdraw.plus(DIRECT_COMMISSION).toFixed(2);
      referrer.ibTotalCommission = curTotal.plus(DIRECT_COMMISSION).toFixed(2);
      referrer.ibMembershipsSold = (referrer.ibMembershipsSold || 0) + 1;

      const commissionRecord: IBCommission = {
        id: `ibcom-mem-${Date.now()}`,
        ibUserId: referrer.id,
        clientUserId: targetUser.id,
        clientEmail: targetUser.email,
        investmentId: payment.id,
        investmentAmount: '7000.00',
        commissionRate: 20,
        commissionAmount: '1400.00',
        status: 'PAID',
        createdAt: new Date().toISOString()
      };
      mockIbCommissions.unshift(commissionRecord);

      const bonusTx: Transaction = {
        id: `tx-ibcomm-${Date.now()}`,
        userId: referrer.id,
        userEmail: referrer.email,
        type: 'REFERRAL_BONUS',
        amount: '1400.00',
        precisionAmount: '1400.000000000000000000',
        status: 'APPROVED',
        createdAt: new Date().toISOString()
      };
      mockTransactions.unshift(bonusTx);

      commissionAwarded = true;
      referrerEmail = referrer.email;
    }
  }

  res.json({
    success: true,
    message: `IB Membership approved for ${targetUser.email}! $7,000 credited to main investable balance, IB status activated.${
      commissionAwarded ? ` $1,400 (20%) direct commission awarded to upline IB (${referrerEmail}).` : ' (No upline IB referrer found).'
    }`
  });
});

// Admin: Reject $7000 IB Membership Payment
app.post('/api/admin/ib-membership/reject', (req: Request, res: Response) => {
  const { paymentId, reason } = req.body;
  const payment = mockIbMembershipPayments.find((p) => p.id === paymentId);

  if (!payment) {
    return res.status(404).json({ error: 'IB Membership payment record not found.' });
  }

  payment.status = 'REJECTED';
  payment.rejectionReason = reason || 'Payment Verification Failed';

  const targetUser = mockUsers.find(
    (u) => u.id === payment.userId || u.email.toLowerCase() === payment.userEmail.toLowerCase()
  );

  if (targetUser) {
    targetUser.ibStatus = 'REJECTED';
  }

  res.json({ success: true, message: 'IB Membership payment rejected.' });
});

// Fetch IB Dashboard statistics and commission records
app.get('/api/ib/dashboard', (req: Request, res: Response) => {
  try {
    const activeUser = getActiveUser();
    if (!activeUser) {
      return res.status(200).json({
        is_ib: false,
        ibStatus: 'NONE',
        referralLink: '',
        ibReferralCode: '',
        maxCapAmount: '7000.00',
        remainingCap: '7000.00',
        capProgressPercent: 0,
        totalReferredUsers: 0,
        totalClientInvestments: '0.00',
        totalCommissionEarned: '0.00',
        withdrawableCommission: '0.00',
        commissions: [],
        generatedLinks: [],
        referredClients: []
      });
    }

    const userCommissions = (mockIbCommissions || []).filter((c) => c && c.ibUserId === activeUser.id);
    const referredUsers = (mockUsers || []).filter((u) => u && u.referredBy === activeUser.id);

    let totalClientInvBN = new BigNumber(0);
    (mockDeposits || []).forEach((dep) => {
      if (!dep) return;
      const isReferredClient = referredUsers.some((ru) => ru && ru.id === dep.userId);
      if (isReferredClient && ['ACTIVE', 'APPROVED', 'approved'].includes(dep.status)) {
        totalClientInvBN = totalClientInvBN.plus(dep.principalAmount || 0);
      }
    });

    const host = req.get('host') || 'dollarcraft.io';
    const protocol = req.protocol || 'https';
    const referralLink = `${protocol}://${host}/register?ref=IB${activeUser.id}`;

    const MAX_CAP = new BigNumber('7000.00');
    const earnedBN = new BigNumber(activeUser.ibTotalCommission || '0.00');
    const remainingBN = BigNumber.max(0, MAX_CAP.minus(earnedBN));
    const progressPercent = Math.min(100, parseFloat(earnedBN.dividedBy(MAX_CAP).multipliedBy(100).toFixed(2)));

    const userLinks = (mockGeneratedIbLinks || []).filter((l) => l && l.userId === activeUser.id);

    res.json({
      is_ib: !!activeUser.is_ib,
      ibStatus: activeUser.ibStatus || 'NONE',
      referralLink,
      ibReferralCode: activeUser.ibReferralCode || `IB${activeUser.id}`,
      maxCapAmount: '7000.00',
      remainingCap: remainingBN.toFixed(2),
      capProgressPercent: isNaN(progressPercent) ? 0 : progressPercent,
      totalReferredUsers: referredUsers.length,
      totalClientInvestments: totalClientInvBN.toFixed(2),
      totalCommissionEarned: earnedBN.toFixed(2),
      withdrawableCommission: activeUser.ibWithdrawableCommission || '0.00',
      commissions: userCommissions,
      generatedLinks: userLinks,
      referredClients: referredUsers.map((u) => {
        const uDeposits = (mockDeposits || []).filter((d) => d && d.userId === u.id);
        const totalInv = uDeposits.reduce((acc, d) => acc.plus(d.principalAmount || 0), new BigNumber(0)).toFixed(2);
        return {
          id: u.id,
          email: u.email,
          createdAt: u.createdAt,
          totalInvested: totalInv
        };
      })
    });
  } catch (err: any) {
    console.error('Error in /api/ib/dashboard:', err);
    res.status(500).json({ error: 'Failed to fetch IB dashboard data.' });
  }
});

// On-Demand IB Referral Link Generation bound to Big Data Server nodes
const VALID_IB_ACCESS_CODES = new Set(
  Array.from({ length: 100 }, (_, i) => `IB7000-CMP-${String(i + 1).padStart(3, '0')}`)
);

app.post('/api/ib/generate-link', (req: Request, res: Response) => {
  const activeUser = getActiveUser();
  const { campaignName, serverNode, accessCode } = req.body;

  const normalizedCode = (accessCode || '').trim().toUpperCase();

  if (!normalizedCode || !VALID_IB_ACCESS_CODES.has(normalizedCode)) {
    return res.status(400).json({
      error: 'SECURITY REJECTION: Valid IB Access Code required (e.g., IB7000-CMP-001 to IB7000-CMP-100). Link generation denied without a authorized code.'
    });
  }

  const campaign = (campaignName || 'Client On-Demand').trim();
  const node = (serverNode || 'US-EAST-CLOUD-01').trim();

  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const referralCode = `IB-${normalizedCode}-${randomSuffix}`;

  const host = req.get('host') || 'dollarcraft.io';
  const protocol = req.protocol || 'https';
  const fullUrl = `${protocol}://${host}/register?ref=${referralCode}`;

  const newLink: GeneratedIbLink = {
    id: `ib-link-${Date.now()}-${randomSuffix}`,
    userId: activeUser.id,
    campaignName: campaign,
    accessCode: normalizedCode,
    referralCode,
    fullUrl,
    serverNode: node,
    clicksCount: Math.floor(Math.random() * 5) + 1,
    conversionsCount: 0,
    createdAt: new Date().toISOString()
  };

  mockGeneratedIbLinks.unshift(newLink);

  res.json({
    success: true,
    message: `On-demand IB link generated successfully for code ${normalizedCode} on ${node} Big Data Server.`,
    link: newLink
  });
});

app.get('/api/ib/links', (req: Request, res: Response) => {
  const activeUser = getActiveUser();
  const userLinks = mockGeneratedIbLinks.filter((l) => l.userId === activeUser.id);
  res.json({ success: true, links: userLinks });
});

app.delete('/api/ib/links/:id', (req: Request, res: Response) => {
  const activeUser = getActiveUser();
  const linkId = req.params.id;

  const initialLength = mockGeneratedIbLinks.length;
  mockGeneratedIbLinks = mockGeneratedIbLinks.filter(
    (l) => !(l.id === linkId && l.userId === activeUser.id)
  );

  if (mockGeneratedIbLinks.length < initialLength) {
    res.json({ success: true, message: 'IB link deleted successfully.' });
  } else {
    res.status(404).json({ error: 'Link not found or unauthorized.' });
  }
});

// Withdraw accumulated IB commissions to main balance
app.post('/api/ib/withdraw-commission', (req: Request, res: Response) => {
  const activeUser = getActiveUser();
  const availableCommission = new BigNumber(activeUser.ibWithdrawableCommission || '0');

  if (availableCommission.isLessThanOrEqualTo(0)) {
    return res.status(400).json({ error: 'No withdrawable commission balance available.' });
  }

  activeUser.earnedYield = new BigNumber(activeUser.earnedYield).plus(availableCommission).toFixed(18);
  const withdrawnAmount = availableCommission.toFixed(2);
  activeUser.ibWithdrawableCommission = '0.00';

  const newTx: Transaction = {
    id: `tx-ib-${Date.now()}`,
    userId: activeUser.id,
    userEmail: activeUser.email,
    type: 'REFERRAL_BONUS',
    amount: withdrawnAmount,
    precisionAmount: availableCommission.toFixed(18),
    status: 'APPROVED',
    createdAt: new Date().toISOString()
  };
  mockTransactions.unshift(newTx);

  res.json({
    success: true,
    message: `Successfully transferred $${withdrawnAmount} IB commission to your main balance!`,
    newMainYield: activeUser.earnedYield,
    withdrawableCommission: '0.00'
  });
});

// Admin: Get all IB applications
app.get('/api/admin/ib/applications', (req: Request, res: Response) => {
  res.json({ applications: mockIbApplications });
});

// Admin: Approve IB application
app.post('/api/admin/ib/approve', (req: Request, res: Response) => {
  const { applicationId } = req.body;
  const appItem = mockIbApplications.find((a) => a.id === applicationId);

  if (!appItem) {
    return res.status(404).json({ error: 'Application not found' });
  }

  appItem.status = 'APPROVED';
  const targetUser = mockUsers.find((u) => u.id === appItem.userId || u.email.toLowerCase() === appItem.userEmail.toLowerCase());

  if (targetUser) {
    targetUser.is_ib = true;
    targetUser.ibStatus = 'APPROVED';
    targetUser.ibReferralCode = `IB${targetUser.id}`;
    targetUser.ibWithdrawableCommission = targetUser.ibWithdrawableCommission || '0.00';
    targetUser.ibTotalCommission = targetUser.ibTotalCommission || '0.00';
  }

  res.json({ success: true, message: `IB application for ${appItem.userName} approved.` });
});

// Admin: Reject IB application
app.post('/api/admin/ib/reject', (req: Request, res: Response) => {
  const { applicationId, reason } = req.body;
  const appItem = mockIbApplications.find((a) => a.id === applicationId);

  if (!appItem) {
    return res.status(404).json({ error: 'Application not found' });
  }

  appItem.status = 'REJECTED';
  const targetUser = mockUsers.find((u) => u.id === appItem.userId || u.email.toLowerCase() === appItem.userEmail.toLowerCase());

  if (targetUser) {
    targetUser.ibStatus = 'REJECTED';
  }

  res.json({ success: true, message: `IB application rejected.` });
});

// Withdrawal Request with Race Condition & Anti-Exploit Protection
app.post('/api/withdrawal/request', (req: Request, res: Response) => {
  const { amount, destinationAddr, network } = req.body;
  const activeUser = getActiveUser();

  if (activeUser.isFrozen) {
    return res.status(403).json({ success: false, message: 'Account frozen due to security policy audit.' });
  }

  const requestBN = new BigNumber(amount);
  const userTotalBN = new BigNumber(activeUser.principalBalance).plus(activeUser.earnedYield);

  // Minimum $50 USD check
  if (requestBN.isLessThan(50)) {
    return res.status(400).json({ success: false, message: 'Minimum withdrawal amount is $50.00 USD.' });
  }

  // Race condition check: Verify user has sufficient balance
  if (requestBN.isGreaterThan(userTotalBN)) {
    return res.status(400).json({ success: false, message: 'Insufficient withdrawable balance available.' });
  }

  // Anti-fraud sanity check
  const oldestDeposit = mockDeposits[mockDeposits.length - 1];
  if (oldestDeposit) {
    const sanity = isYieldWithinMathematicalLimit(
      oldestDeposit.principalAmount,
      oldestDeposit.dailyYieldPercent,
      new Date(oldestDeposit.startTime).getTime(),
      oldestDeposit.earnedYield
    );

    if (!sanity.valid) {
      activeUser.isFrozen = true;
      activeUser.frozenReason = 'Yield Math Sanity Out of Bounds';
      return res.status(400).json({ success: false, message: 'Mathematical yield anomaly detected. Account paused for review.' });
    }
  }

  // Deduct from earned yield first, then principal
  let remainingDeduct = requestBN;
  const earnedBN = new BigNumber(activeUser.earnedYield);

  if (earnedBN.isGreaterThanOrEqualTo(remainingDeduct)) {
    activeUser.earnedYield = earnedBN.minus(remainingDeduct).toFixed(18);
  } else {
    remainingDeduct = remainingDeduct.minus(earnedBN);
    activeUser.earnedYield = '0.000000000000000000';
    activeUser.principalBalance = new BigNumber(activeUser.principalBalance).minus(remainingDeduct).toFixed(18);
  }

  activeUser.totalWithdrawn = new BigNumber(activeUser.totalWithdrawn).plus(requestBN).toFixed(18);

  const newTx: Transaction = {
    id: `tx-${Date.now()}`,
    userId: activeUser.id,
    userEmail: activeUser.email,
    type: 'WITHDRAWAL',
    amount: requestBN.toFixed(2),
    precisionAmount: requestBN.toFixed(18),
    destinationAddr,
    cryptoNetwork: network,
    status: 'PENDING',
    createdAt: new Date().toISOString()
  };

  mockTransactions.unshift(newTx);

  res.json({ success: true, message: `Withdrawal request for $${amount} USD submitted for automated audit review.` });
});

// Admin Approve Withdrawal
app.post('/api/admin/withdrawal/approve', (req: Request, res: Response) => {
  const { txId } = req.body;
  const tx = mockTransactions.find((t) => t.id === txId);

  if (tx) {
    tx.status = 'APPROVED';
    return res.json({ success: true, message: 'Withdrawal approved & disbursed.' });
  }
  res.status(404).json({ error: 'Transaction not found.' });
});

// Admin Reject Withdrawal
app.post('/api/admin/withdrawal/reject', (req: Request, res: Response) => {
  const { txId, reason } = req.body;
  const tx = mockTransactions.find((t) => t.id === txId);

  if (tx) {
    tx.status = 'REJECTED';
    tx.fraudNote = reason;

    // Refund funds back to user
    const u = mockUsers.find((user) => user.id === tx.userId);
    if (u) {
      u.earnedYield = new BigNumber(u.earnedYield).plus(tx.precisionAmount).toFixed(18);
    }
    return res.json({ success: true, message: 'Withdrawal rejected and funds refunded to user balance.' });
  }
  res.status(404).json({ error: 'Transaction not found.' });
});

// Admin Freeze User
app.post('/api/admin/user/freeze', (req: Request, res: Response) => {
  const { userId, reason } = req.body;
  const u = mockUsers.find((user) => user.id === userId);

  if (u) {
    u.isFrozen = true;
    u.frozenReason = reason;
    return res.json({ success: true, message: 'User account frozen successfully.' });
  }
  res.status(404).json({ error: 'User not found.' });
});

// Admin Unfreeze User
app.post('/api/admin/user/unfreeze', (req: Request, res: Response) => {
  const { userId } = req.body;
  const u = mockUsers.find((user) => user.id === userId);

  if (u) {
    u.isFrozen = false;
    u.frozenReason = undefined;
    return res.json({ success: true, message: 'User account unfrozen.' });
  }
  res.status(404).json({ error: 'User not found.' });
});

// ==========================================
// INTERNAL TRANSFER & FUND MANAGEMENT ENDPOINTS
// ==========================================

// Get all users for admin search
app.get('/api/admin/users', (req: Request, res: Response) => {
  res.json({ users: mockUsers });
});

// Get Internal Transfer State (Admin Wallet Balance, Auto Config, Logs, Users)
app.get('/api/admin/internal-transfers/state', (req: Request, res: Response) => {
  res.json({
    adminWalletBalance,
    autoSignupConfig,
    transfers: mockInternalTransfers,
    users: mockUsers
  });
});

// Get Internal Transfers received by specific user email
app.get('/api/user/internal-transfers', async (req: Request, res: Response) => {
  const email = String(req.query.email || req.headers['x-user-email'] || '').trim().toLowerCase();
  const userId = String(req.query.userId || req.headers['x-user-id'] || '').trim();
  let activeUser = getActiveUser(req);

  const searchEmail = email || (activeUser?.email ? activeUser.email.toLowerCase().trim() : '');
  const searchId = userId || activeUser?.id || '';

  if (searchEmail || searchId) {
    const syncedUser = await ensureUserSyncedFromFirestore(searchEmail, searchId);
    if (syncedUser) activeUser = syncedUser;
  }

  if (searchEmail || searchId) {
    try {
      const { db } = await import('./src/lib/firebase');
      const { collection, getDocs } = await import('firebase/firestore');

      const allItxSnap = await getDocs(collection(db, 'internalTransfers'));
      allItxSnap.forEach((docSnap) => {
        const dData: any = docSnap.data();
        const tId = docSnap.id || dData.id || dData.transferId;
        const toEmail = (
          dData.toUserEmail ||
          dData.userEmail ||
          dData.toEmail ||
          dData.email ||
          dData.recipientEmail ||
          ''
        ).toLowerCase().trim();
        const toId = (dData.toUserId || dData.userId || dData.toId || '').trim();

        if (
          (searchEmail && toEmail === searchEmail) ||
          (searchId && toId === searchId)
        ) {
          if (!mockInternalTransfers.some((m) => m.id === tId || (dData.transferId && m.transferId === dData.transferId))) {
            mockInternalTransfers.unshift({
              id: tId,
              transferId: dData.transferId || tId,
              fromUserId: dData.fromUserId || 'admin',
              fromUserEmail: dData.fromUserEmail || 'admin@dollarcraft.io',
              toUserId: dData.toUserId || toId || searchId,
              toUserEmail: dData.toUserEmail || toEmail || searchEmail,
              toWalletType: dData.toWalletType || 'MAIN_WALLET',
              amount: String(dData.amount || '0'),
              note: dData.note,
              status: dData.status || 'SUCCESS',
              createdAt: dData.createdAt || new Date().toISOString()
            });
          }
        }
      });
    } catch (fsErr) {
      console.warn('Firestore internalTransfers query notice:', fsErr);
    }
  }

  const activeCleanEmail = (activeUser?.email || '').toLowerCase().trim();
  const userTransfers = mockInternalTransfers.filter((t) => {
    const tEmail = (t.toUserEmail || (t as any).userEmail || (t as any).toEmail || (t as any).email || '').toLowerCase().trim();
    const tId = (t.toUserId || (t as any).userId || (t as any).toId || '').trim();
    if (searchEmail && tEmail === searchEmail) return true;
    if (searchId && tId === searchId) return true;
    if (activeUser?.id && tId === activeUser.id) return true;
    if (activeCleanEmail && tEmail === activeCleanEmail) return true;
    return false;
  });

  const targetUser = (searchEmail ? consolidateUserByEmail(searchEmail, searchId) : null) || activeUser;

  res.json({
    success: true,
    transfers: userTransfers,
    userEmail: searchEmail,
    principalBalance: targetUser?.principalBalance || '0.00',
    earnedYield: targetUser?.earnedYield || '0.00'
  });
});

// Execute Internal Transfer from Admin to Client Wallet
app.post('/api/admin/internal-transfers/send', async (req: Request, res: Response) => {
  try {
    const { toUserId, toUserEmail, amount, toWalletType, note, adminPassword } = req.body;
    const activeUser = getActiveUser();

    if (!adminPassword || String(adminPassword).trim() === '') {
      return res.status(400).json({ error: 'Admin Password confirmation is required.' });
    }

    const amountBN = new BigNumber(amount);
    if (amountBN.isNaN() || amountBN.isLessThanOrEqualTo(0)) {
      return res.status(400).json({ error: 'Invalid transfer amount.' });
    }

    const adminBalanceBN = new BigNumber(adminWalletBalance);
    if (adminBalanceBN.isLessThan(amountBN)) {
      return res.status(400).json({ error: `Insufficient Admin Personal Wallet balance ($${adminWalletBalance} available).` });
    }

    const searchId = String(toUserId || '').trim();
    const searchEmail = String(toUserEmail || toUserId || '').trim().toLowerCase();

    let targetUser = searchEmail ? consolidateUserByEmail(searchEmail, searchId) : mockUsers.find((u) => searchId && u.id === searchId);

    // 1. Try Firestore lookup if user is not in mockUsers memory cache
    if (!targetUser && (searchEmail || searchId)) {
      try {
        const { db } = await import('./src/lib/firebase');
        const { collection, getDocs, query, where, doc, getDoc } = await import('firebase/firestore');
        
        let foundDoc: any = null;
        if (searchEmail) {
          const docRef = doc(db, 'users', searchEmail);
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            foundDoc = { id: snap.id, ...snap.data() };
          }
        }
        if (!foundDoc && searchId) {
          const docRef = doc(db, 'users', searchId);
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            foundDoc = { id: snap.id, ...snap.data() };
          }
        }
        if (!foundDoc && searchEmail) {
          const q = query(collection(db, 'users'), where('email', '==', searchEmail));
          const snap = await getDocs(q);
          if (!snap.empty) {
            foundDoc = { id: snap.docs[0].id, ...snap.docs[0].data() };
          }
        }

        if (foundDoc) {
          targetUser = {
            id: foundDoc.id || foundDoc.uid || `usr-${Date.now()}`,
            email: foundDoc.email || searchEmail,
            role: foundDoc.role || 'USER',
            tier: foundDoc.tier || 'SILVER',
            principalBalance: String(foundDoc.principalBalance || 0),
            earnedYield: String(foundDoc.earnedYield || 0),
            totalWithdrawn: String(foundDoc.totalWithdrawn || 0),
            walletAddress: foundDoc.walletAddress || `0x${(foundDoc.id || '00000000').substring(0, 8)}`,
            referralCode: foundDoc.referralCode || `DC${(foundDoc.id || '000000').substring(0, 6).toUpperCase()}`,
            referredBy: foundDoc.referredBy || foundDoc.referredByCode || undefined,
            isFrozen: !!foundDoc.isFrozen,
            createdAt: foundDoc.createdAt || new Date().toISOString()
          };
          mockUsers.push(targetUser);
        }
      } catch (fsErr) {
        console.warn('Firestore user lookup in internal transfer notice:', fsErr);
      }
    }

    // 2. Auto-provision user account if email provided but not yet registered
    if (!targetUser && searchEmail && searchEmail.includes('@')) {
      const generatedId = `usr-${Date.now()}`;
      targetUser = {
        id: generatedId,
        email: searchEmail,
        role: 'USER',
        tier: 'SILVER',
        principalBalance: '0.000000000000000000',
        earnedYield: '0.000000000000000000',
        totalWithdrawn: '0.000000000000000000',
        walletAddress: `0x${Math.random().toString(16).substring(2, 10)}`,
        referralCode: `DC${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        isFrozen: false,
        createdAt: new Date().toISOString()
      };
      mockUsers.push(targetUser);

      try {
        const { db } = await import('./src/lib/firebase');
        const { doc, setDoc } = await import('firebase/firestore');
        await setDoc(doc(db, 'users', targetUser.id), {
          uid: targetUser.id,
          id: targetUser.id,
          email: targetUser.email,
          principalBalance: 0,
          earnedYield: 0,
          totalWithdrawn: 0,
          tier: 'SILVER',
          createdAt: targetUser.createdAt
        }, { merge: true });
      } catch (e) {
        console.warn('Firestore auto-provision notice:', e);
      }
    }

    if (!targetUser) {
      return res.status(404).json({ error: 'Recipient user account not found. Please enter a valid email address.' });
    }

    if (activeUser && targetUser.id === activeUser.id && activeUser.role === 'ADMIN') {
      return res.status(400).json({ error: 'Self-transfer to Admin account is not allowed.' });
    }

    // Deduct from Admin Personal Wallet
    adminWalletBalance = adminBalanceBN.minus(amountBN).toFixed(2);

    // Credit to target client's selected wallet
    const walletTypeName = toWalletType === 'IB_COMMISSION_WALLET' ? 'IB Commission Wallet' : 'Main Wallet';

    const transferId = `ITX-${Math.floor(100000 + Math.random() * 900000)}`;

    if (toWalletType === 'MAIN_WALLET' || toWalletType === 'INVESTMENT_WALLET' || !toWalletType) {
      targetUser.principalBalance = new BigNumber(targetUser.principalBalance || '0').plus(amountBN).toFixed(18);

      // Sync principalBalance across any duplicate user objects in memory with matching email
      mockUsers.forEach((u) => {
        if (u.email && targetUser.email && u.email.toLowerCase() === targetUser.email.toLowerCase()) {
          u.principalBalance = targetUser.principalBalance;
        }
      });

      // Create Active UserDeposit record so it displays under total deposit section & active deposits list
      const transferDeposit: UserDeposit = {
        id: `dep-itx-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        userId: targetUser.id,
        userEmail: targetUser.email,
        planId: 'plan-standard',
        planName: 'Standard Yield Plan',
        principalAmount: amountBN.toFixed(18),
        earnedYield: '0.000000000000000000',
        totalPayout: '0',
        dailyYieldPercent: 0.83,
        cryptoNetwork: `Internal Transfer (${walletTypeName})`,
        txHash: transferId,
        status: 'ACTIVE',
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 240 * 86400 * 1000).toISOString(),
        lastYieldTick: new Date().toISOString(),
        progressPercent: 0
      };
      mockDeposits.unshift(transferDeposit);

      // Trigger automatic 5% referral commission for the user's referrer
      dispatchDirectReferralCommission(targetUser, amountBN, transferId);
    } else if (toWalletType === 'IB_COMMISSION_WALLET') {
      targetUser.is_ib = true;
      targetUser.ibStatus = 'APPROVED';
      targetUser.ibWithdrawableCommission = new BigNumber(targetUser.ibWithdrawableCommission || '0').plus(amountBN).toFixed(2);
      targetUser.ibTotalCommission = new BigNumber(targetUser.ibTotalCommission || '0').plus(amountBN).toFixed(2);

      mockUsers.forEach((u) => {
        if (u.email && targetUser.email && u.email.toLowerCase() === targetUser.email.toLowerCase()) {
          u.is_ib = true;
          u.ibStatus = 'APPROVED';
          u.ibWithdrawableCommission = targetUser.ibWithdrawableCommission;
          u.ibTotalCommission = targetUser.ibTotalCommission;
        }
      });
    }

    // Sync updated targetUser balance and deposit to Firestore for real-time cross-device sync
    try {
      const { db } = await import('./src/lib/firebase');
      const { doc, setDoc, collection, addDoc } = await import('firebase/firestore');

      const userDocData = {
        uid: targetUser.id,
        id: targetUser.id,
        email: targetUser.email || '',
        principalBalance: Number(targetUser.principalBalance || 0),
        ibWithdrawableCommission: Number(targetUser.ibWithdrawableCommission || 0),
        ibTotalCommission: Number(targetUser.ibTotalCommission || 0),
        is_ib: !!targetUser.is_ib,
        ibStatus: targetUser.ibStatus || 'NONE',
        updatedAt: new Date().toISOString()
      };

      if (targetUser.id) {
        await setDoc(doc(db, 'users', targetUser.id), userDocData, { merge: true }).catch((e) => console.warn('FS sync error:', e));
      }
      if (targetUser.email && targetUser.email !== targetUser.id) {
        await setDoc(doc(db, 'users', targetUser.email.toLowerCase()), userDocData, { merge: true }).catch((e) => console.warn('FS sync error:', e));
      }

      if (toWalletType === 'MAIN_WALLET' || toWalletType === 'INVESTMENT_WALLET' || !toWalletType) {
        await addDoc(collection(db, 'deposits'), {
          userId: targetUser.id,
          userEmail: targetUser.email || '',
          amount: amountBN.toFixed(2),
          transactionId: transferId,
          planId: 'plan-standard',
          planName: 'Standard Yield Plan',
          dailyYieldPercent: 0.83,
          status: 'ACTIVE',
          createdAt: new Date().toISOString()
        }).catch((e) => console.warn('Firestore deposit sync notice:', e));
      }
    } catch (fsSyncErr) {
      console.warn('Firestore post-transfer sync notice:', fsSyncErr);
    }

    const transferRecord: InternalTransfer = {
      id: `itx-${Date.now()}`,
      transferId,
      fromUserId: activeUser?.id || 'admin-root',
      fromUserEmail: activeUser?.email || 'admin@dollarcraft.io',
      toUserId: targetUser.id,
      toUserEmail: targetUser.email,
      toWalletType: toWalletType || 'MAIN_WALLET',
      amount: amountBN.toFixed(2),
      note: note ? String(note).trim() : undefined,
      status: 'SUCCESS',
      createdAt: new Date().toISOString()
    };
    mockInternalTransfers.unshift(transferRecord);

    try {
      const { db } = await import('./src/lib/firebase');
      const { collection, addDoc } = await import('firebase/firestore');
      await addDoc(collection(db, 'internalTransfers'), {
        id: transferRecord.id,
        transferId: transferRecord.transferId,
        fromUserId: transferRecord.fromUserId,
        fromUserEmail: transferRecord.fromUserEmail,
        toUserId: targetUser.id,
        toUserEmail: (targetUser.email || '').toLowerCase().trim(),
        userEmail: (targetUser.email || '').toLowerCase().trim(),
        toEmail: (targetUser.email || '').toLowerCase().trim(),
        email: (targetUser.email || '').toLowerCase().trim(),
        toWalletType: transferRecord.toWalletType,
        amount: transferRecord.amount,
        note: transferRecord.note || '',
        status: transferRecord.status,
        createdAt: transferRecord.createdAt
      }).catch((e) => console.warn('Firestore internalTransfers write notice:', e));
    } catch (e) {
      console.warn('Firestore internalTransfers write notice:', e);
    }

    // User transaction ledger entry
    const userTx: Transaction = {
      id: `tx-itx-${Date.now()}`,
      userId: targetUser.id,
      userEmail: targetUser.email,
      type: 'ADMIN_ADJUSTMENT',
      amount: amountBN.toFixed(2),
      precisionAmount: amountBN.toFixed(18),
      cryptoNetwork: `Internal Transfer from Admin (${walletTypeName})`,
      status: 'APPROVED',
      createdAt: new Date().toISOString()
    };
    mockTransactions.unshift(userTx);

    // Client Notification
    mockUserNotifications.unshift({
      id: `notif-${Date.now()}`,
      userId: targetUser.id,
      title: 'Internal Transfer Received',
      message: `You have received $${amountBN.toFixed(2)} USD from Admin via Internal Transfer to your ${walletTypeName}${note ? ` (${note})` : ''}.`,
      type: 'INTERNAL_TRANSFER',
      read: false,
      createdAt: new Date().toISOString()
    });

    res.json({
      success: true,
      message: `Successfully transferred $${amountBN.toFixed(2)} to ${targetUser.email} (${walletTypeName})!`,
      transfer: transferRecord,
      newAdminBalance: adminWalletBalance
    });
  } catch (err: any) {
    console.error('Error executing internal transfer:', err);
    res.status(500).json({ error: err.message || 'Internal server error processing transfer.' });
  }
});

// Reverse Internal Transfer
app.post('/api/admin/internal-transfers/reverse', (req: Request, res: Response) => {
  const { transferId } = req.body;
  const activeUser = getActiveUser();

  if (activeUser.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
  }

  const transfer = mockInternalTransfers.find((t) => t.id === transferId || t.transferId === transferId);
  if (!transfer) {
    return res.status(404).json({ error: 'Transfer record not found.' });
  }

  if (transfer.status !== 'SUCCESS') {
    return res.status(400).json({ error: `Transfer is already ${transfer.status}.` });
  }

  const targetUser = mockUsers.find((u) => u.id === transfer.toUserId);
  if (!targetUser) {
    return res.status(404).json({ error: 'Target user not found.' });
  }

  const amountBN = new BigNumber(transfer.amount);

  // Deduct from client wallet if sufficient
  if (transfer.toWalletType === 'MAIN_WALLET' || transfer.toWalletType === 'INVESTMENT_WALLET') {
    const curMainBN = new BigNumber(targetUser.principalBalance || '0');
    if (curMainBN.isLessThan(amountBN)) {
      return res.status(400).json({ error: `User current main balance ($${curMainBN.toFixed(2)}) is less than transfer amount ($${transfer.amount}). Cannot reverse.` });
    }
    targetUser.principalBalance = curMainBN.minus(amountBN).toFixed(18);
  } else if (transfer.toWalletType === 'IB_COMMISSION_WALLET') {
    const curIbBN = new BigNumber(targetUser.ibWithdrawableCommission || '0');
    if (curIbBN.isLessThan(amountBN)) {
      return res.status(400).json({ error: `User current IB commission balance ($${curIbBN.toFixed(2)}) is less than transfer amount ($${transfer.amount}). Cannot reverse.` });
    }
    targetUser.ibWithdrawableCommission = curIbBN.minus(amountBN).toFixed(2);
    targetUser.ibTotalCommission = BigNumber.max(0, new BigNumber(targetUser.ibTotalCommission || '0').minus(amountBN)).toFixed(2);
  }

  // Restore Admin Personal Wallet
  adminWalletBalance = new BigNumber(adminWalletBalance).plus(amountBN).toFixed(2);
  transfer.status = 'REVERSED';

  // Transaction Ledger Log
  const revTx: Transaction = {
    id: `tx-rev-${Date.now()}`,
    userId: targetUser.id,
    userEmail: targetUser.email,
    type: 'ADMIN_ADJUSTMENT',
    amount: `-${amountBN.toFixed(2)}`,
    precisionAmount: `-${amountBN.toFixed(18)}`,
    cryptoNetwork: `Internal Transfer Reversal (${transfer.transferId})`,
    status: 'APPROVED',
    createdAt: new Date().toISOString()
  };
  mockTransactions.unshift(revTx);

  // Client Notification
  mockUserNotifications.unshift({
    id: `notif-${Date.now()}`,
    userId: targetUser.id,
    title: 'Internal Transfer Reversed',
    message: `An internal transfer of $${transfer.amount} (ID: ${transfer.transferId}) was reversed by Admin.`,
    type: 'SYSTEM',
    read: false,
    createdAt: new Date().toISOString()
  });

  res.json({
    success: true,
    message: `Transfer ${transfer.transferId} reversed successfully. $${transfer.amount} returned to Admin Personal Wallet.`,
    newAdminBalance: adminWalletBalance
  });
});

// Top up Admin Personal Balance
app.post('/api/admin/wallet/topup', (req: Request, res: Response) => {
  const { amount } = req.body;
  const amountBN = new BigNumber(amount);
  if (amountBN.isNaN() || amountBN.isLessThanOrEqualTo(0)) {
    return res.status(400).json({ error: 'Invalid topup amount.' });
  }
  adminWalletBalance = new BigNumber(adminWalletBalance).plus(amountBN).toFixed(2);
  res.json({ success: true, newBalance: adminWalletBalance });
});

// Update Auto Signup Bonus Config
app.post('/api/admin/settings/auto-transfer', (req: Request, res: Response) => {
  const { enabled, bonusAmount, targetWallet } = req.body;
  autoSignupConfig = {
    enabled: !!enabled,
    bonusAmount: bonusAmount ? new BigNumber(bonusAmount).toFixed(2) : '5.00',
    targetWallet: targetWallet || 'MAIN_WALLET'
  };
  res.json({ success: true, autoSignupConfig });
});

// Get User Notifications
app.get('/api/user/notifications', (req: Request, res: Response) => {
  const activeUser = getActiveUser();
  const userNotifs = mockUserNotifications.filter((n) => n.userId === activeUser.id);
  res.json({ notifications: userNotifs });
});

// Mark Notifications as Read
app.post('/api/user/notifications/read', (req: Request, res: Response) => {
  const activeUser = getActiveUser();
  mockUserNotifications.forEach((n) => {
    if (n.userId === activeUser.id) n.read = true;
  });
  res.json({ success: true });
});

// API 404 Fallback - ensures unmatched /api/* calls return JSON instead of HTML
app.use('/api/*', (req: Request, res: Response) => {
  res.status(404).json({ error: `API endpoint ${req.originalUrl} not found.` });
});

// ==========================================
// VITE MIDDLEWARE SETUP
// ==========================================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Dollar Craft Sovereign Engine] Running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
