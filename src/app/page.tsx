import { redirect } from "next/navigation";

// Auth gating happens in `proxy.ts`. Authenticated visitors land on /home;
// unauthenticated ones are bounced to /login before this renders.
export default function RootPage() {
  redirect("/home");
}
