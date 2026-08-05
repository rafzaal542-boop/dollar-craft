import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut, 
  sendPasswordResetEmail,
  User 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDocFromServer 
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Auth
export const auth = getAuth(app);

// Initialize Firestore
export const db = getFirestore(
  app, 
  (firebaseConfig as any).firestoreDatabaseId || undefined
);

// Google Auth Provider with Gmail scopes and account selection prompt
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});
googleProvider.addScope('https://www.googleapis.com/auth/gmail.readonly');
googleProvider.addScope('https://www.googleapis.com/auth/gmail.send');
googleProvider.addScope('https://www.googleapis.com/auth/gmail.compose');

// In-memory token cache & active popup state
let cachedAccessToken: string | null = null;
let activeSignInPromise: Promise<{ user: User; accessToken: string }> | null = null;

export const setCachedAccessToken = (token: string | null) => {
  cachedAccessToken = token;
};

export const getCachedAccessToken = () => cachedAccessToken;

// Sign in with Google Popup with singleton promise guard
export const signInWithGoogle = async (): Promise<{ user: User; accessToken: string }> => {
  if (activeSignInPromise) {
    return activeSignInPromise;
  }

  activeSignInPromise = (async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken || null;
      
      if (token) {
        setCachedAccessToken(token);
      }

      return {
        user: result.user,
        accessToken: token || ''
      };
    } catch (error: any) {
      const errCode = error?.code || '';
      const errStr = String(error?.message || error || '');

      if (
        errCode === 'auth/cancelled-popup-request' ||
        errCode === 'auth/popup-closed-by-user' ||
        errCode === 'auth/popup-blocked' ||
        errStr.includes('cancelled-popup-request') ||
        errStr.includes('popup-closed-by-user') ||
        errStr.includes('popup-blocked')
      ) {
        console.warn('Google Sign-In popup process notice:', errCode || errStr);
      } else {
        console.error('Google Sign-In Error:', error);
      }
      throw error;
    } finally {
      activeSignInPromise = null;
    }
  })();

  return activeSignInPromise;
};

// Sign Out
export const logoutFirebase = async () => {
  setCachedAccessToken(null);
  await signOut(auth);
};

// Error Handling Standard Helper
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Gmail API Helper Functions
export async function sendGmailAlert(
  toEmail: string, 
  subject: string, 
  bodyText: string,
  accessToken: string
) {
  if (!accessToken) {
    throw new Error('No OAuth access token available for Gmail API. Please sign in with Google.');
  }

  // Construct raw MIME email string
  const utf8Subject = `=?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`;
  const messageParts = [
    `To: ${toEmail}`,
    `Subject: ${utf8Subject}`,
    'Content-Type: text/html; charset=utf-8',
    'MIME-Version: 1.0',
    '',
    bodyText
  ];
  const message = messageParts.join('\n');
  const encodedMessage = btoa(unescape(encodeURIComponent(message)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      raw: encodedMessage
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || 'Failed to send email via Gmail API');
  }

  return response.json();
}

export async function fetchGmailProfile(accessToken: string) {
  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch Gmail profile');
  }

  return response.json();
}

export const sendResetPasswordEmail = async (emailAddress: string) => {
  try {
    await sendPasswordResetEmail(auth, emailAddress);
    return { success: true };
  } catch (err: any) {
    console.warn("Firebase password reset email notice:", err);
    return { success: false, error: err?.message || 'Failed to send password reset email' };
  }
};
