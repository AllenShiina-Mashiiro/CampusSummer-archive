import type { Metadata } from "next";

import { NotificationSettings } from "@/components/notification-settings";

export const metadata: Metadata = {
  title: "通知与隐私",
  robots: { index: false },
};

export default function NotificationSettingsPage() {
  return <NotificationSettings />;
}
