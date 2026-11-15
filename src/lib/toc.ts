/**
 * 从 Markdown 里抽取二/三级标题，用于「本页面索引」。
 * id 规则必须与 Markdown 渲染时一致，否则锚点跳不过去。
 */

export type Heading = { id: string; text: string; level: 2 | 3 };

export function headingId(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[`*_~[\]()#!?.,:;'"，。、：；！？（）【】《》]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function extractHeadings(markdown: string): Heading[] {
  const headings: Heading[] = [];
  let inFence = false;

  for (const raw of markdown.split("\n")) {
    const line = raw.trim();

    // 代码块里的 # 不算标题
    if (line.startsWith("```")) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;

    const match = /^(#{2,3})\s+(.+)$/.exec(line);
    if (!match) continue;

    const text = match[2].replace(/#+\s*$/, "").trim();
    if (!text) continue;

    headings.push({
      id: headingId(text),
      text,
      level: match[1].length === 2 ? 2 : 3,
    });
  }

  return headings;
}
