import { redirect } from "next/navigation";

export const metadata = { title: "Month Revenue — TapShop Admin" };

export default function MonthSpendPage() {
  redirect("/dashboard/spendings?period=month");
}
