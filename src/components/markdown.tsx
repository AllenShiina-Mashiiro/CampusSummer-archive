import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";

import { headingId } from "@/lib/toc";

/** Markdown 渲染：服务端执行，解析器不进客户端包 */
export function Markdown({ content }: { content: string }) {
  return (
    <div className="doc-prose">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[[rehypeHighlight, { detect: true, ignoreMissing: true }]]}
        components={{
          // 给二/三级标题加 id，配合右侧「本页面索引」锚点跳转
          h2: ({ children }) => <h2 id={headingId(textOf(children))}>{children}</h2>,
          h3: ({ children }) => <h3 id={headingId(textOf(children))}>{children}</h3>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

/** 把 React children 拍平成纯文本，用于生成锚点 id */
function textOf(children: React.ReactNode): string {
  if (children == null || typeof children === "boolean") return "";
  if (typeof children === "string" || typeof children === "number") return String(children);
  if (Array.isArray(children)) return children.map(textOf).join("");
  if (typeof children === "object" && "props" in (children as never)) {
    const props = (children as { props?: { children?: React.ReactNode } }).props;
    return textOf(props?.children);
  }
  return "";
}
