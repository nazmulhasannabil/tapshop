import { redirect } from "next/navigation";

export const metadata = { title: "Today's Spend — Money Back Admin" };

export default function TodaySpendPage() {
  redirect("/dashboard/spendings?period=today");
}
