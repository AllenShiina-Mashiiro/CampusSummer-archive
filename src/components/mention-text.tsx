import Link from "next/link";

/**
 * 把正文里的 @用户名 渲染成可点击的主页链接。
 * 服务端组件：不产生客户端 JS。
 */
export function MentionText({ text }: { text: string }) {
  const parts = text.split(/(@[\w-]{2,20})/g);

  return (
    <>
      {parts.map((part, index) => {
        if (!part.startsWith("@") || part.length < 3) {
          return <span key={index}>{part}</span>;
        }

        const username = part.slice(1);
        return (
          <Link
            key={index}
            href={`/user/${username}`}
            className="font-medium text-primary-strong hover:underline"
          >
            {part}
          </Link>
        );
      })}
    </>
  );
}
