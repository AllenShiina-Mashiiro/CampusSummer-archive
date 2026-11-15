import type { Metadata } from "next";

import { SettingsCard } from "@/components/settings-card";

export const metadata: Metadata = {
  title: "内容申诉",
  robots: { index: false },
};

export default function AppealSettingsPage() {
  return (
    <SettingsCard
      title="内容申诉"
      description="未通过内容审核而被隐藏的评论、评价与资源会显示在这里。您可以修改内容后提交申诉，由管理员人工复核；申诉通过后内容将恢复展示，申诉被拒绝后内容将被删除。"
    >
      <div className="flex flex-col items-center justify-center py-14 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-subtle text-[23px] text-faint">
          ◌
        </div>
        <p className="mt-3 text-[14px] text-muted">暂无被拒的内容</p>
      </div>
    </SettingsCard>
  );
}
