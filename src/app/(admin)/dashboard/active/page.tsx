import { redirect } from "next/navigation";

export const metadata = { title: "Active Today — TapShop Admin" };

export default function ActiveTodayPage() {
  redirect("/dashboard/spendings?period=today");
}
