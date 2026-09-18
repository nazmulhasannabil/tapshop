import { redirect } from "next/navigation";

export const metadata = { title: "Today's Spend — TapShop Admin" };

export default function TodaySpendPage() {
  redirect("/dashboard/spendings?period=today");
}
