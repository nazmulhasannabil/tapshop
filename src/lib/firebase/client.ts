"use client";

import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";

import { firebasePublicConfig } from "@/lib/firebase/public-config";

export type FirebaseWebConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  appId: string;
  storageBucket?: string;
  messagingSenderId?: string;
};

function readConfig(): FirebaseWebConfig {
  return {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || firebasePublicConfig.apiKey,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || firebasePublicConfig.authDomain,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || firebasePublicConfig.projectId,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || firebasePublicConfig.appId,
    storageBucket:
      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || firebasePublicConfig.storageBucket,
    messagingSenderId:
      process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ||
      firebasePublicConfig.messagingSenderId,
  };
}

export function isFirebaseConfigured(): boolean {
  const config = readConfig();
  return Boolean(config.apiKey && config.authDomain && config.projectId && config.appId);
}

export function getFirebaseAuth(): Auth {
  const config = readConfig();

  const app: FirebaseApp = getApps()[0] ?? initializeApp(config);
  return getAuth(app);
}
