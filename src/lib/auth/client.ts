import { createAuthClient } from "better-auth/react";

/** Browser-side auth client (signIn / signUp / signOut / useSession). */
export const authClient = createAuthClient();

export const { signIn, signUp, signOut, useSession } = authClient;
