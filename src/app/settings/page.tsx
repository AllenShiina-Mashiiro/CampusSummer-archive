import { redirect } from "next/navigation";

/** /settings 本身没有内容，默认进个人资料 */
export default function SettingsIndexPage() {
  redirect("/settings/profile");
}
