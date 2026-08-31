import { redirect } from "next/navigation";

/** Stats UI moved onto Activity — keep old URLs working. */
export default function StatsPage() {
  redirect("/activity");
}
