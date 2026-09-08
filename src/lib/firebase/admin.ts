import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";

import { firebasePublicConfig } from "@/lib/firebase/public-config";

type ServiceAccountJson = {
  project_id?: string;
  client_email?: string;
  private_key?: string;
};

function readServiceAccount(): ServiceAccountJson | null {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ServiceAccountJson;
  } catch {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON.");
  }
}

function adminConfig() {
  const fromJson = readServiceAccount();
  const projectId = process.env.FIREBASE_PROJECT_ID ?? fromJson?.project_id;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL ?? fromJson?.client_email;
  const privateKey = (process.env.FIREBASE_PRIVATE_KEY ?? fromJson?.private_key)?.replace(
    /\\n/g,
    "\n",
  );

  if (!projectId || !clientEmail || !privateKey) return null;
  return { projectId, clientEmail, privateKey };
}

function projectIdOnly(): string {
  return (
    process.env.FIREBASE_PROJECT_ID ??
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ??
    firebasePublicConfig.projectId
  );
}

function getAdminApp(): App {
  const existing = getApps()[0];
  if (existing) return existing;

  const config = adminConfig();
  if (config) {
    return initializeApp({
      credential: cert(config),
      projectId: config.projectId,
    });
  }

  const projectId = projectIdOnly();
  if (!projectId) {
    throw new Error(
      "Firebase Admin is not configured. Set FIREBASE_PROJECT_ID, or FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY.",
    );
  }

  return initializeApp({ projectId });
}

export function firebaseAdminCanCheckRevocation(): boolean {
  return adminConfig() !== null;
}

export function getFirebaseAdminAuth(): Auth {
  return getAuth(getAdminApp());
}
