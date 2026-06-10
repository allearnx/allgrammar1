'use client';

import { Fragment, type ReactNode } from 'react';

/** 테이블 구분선(|---|---|)인지 확인 */
function isSeparatorRow(line: string): boolean {
  return /^\|[\s\-:|]+\|$/.test(line.trim());
}

/** 파이프 구분 행을 셀 배열로 분해 */
function parseCells(line: string): string[] {
  const trimmed = line.trim();
  // 양 끝 | 제거 후 | 로 split
  const inner = trimmed.startsWith('|') ? trimmed.slice(1) : trimmed;
  const end = inner.endsWith('|') ? inner.slice(0, -1) : inner;
  return end.split('|').map((c) => c.trim());
}

/** 인라인 마크업(<u>, 밑줄) 파싱 */
function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const parts = text.split(/(<u>.*?<\/u>)/g);
  return parts.map((part, i) => {
    const match = part.match(/^<u>(.*?)<\/u>$/);
    if (match) return <u key={`${keyPrefix}-${i}`}>{match[1]}</u>;
    if (part === '') return null;
    return <Fragment key={`${keyPrefix}-${i}`}>{part}</Fragment>;
  });
}

/**
 * 문제 텍스트에서 <u>...</u> 태그를 밑줄로, \n을 줄바꿈으로,
 * 마크다운 파이프 테이블을 <table>로 렌더링.
 * 안전: dangerouslySetInnerHTML 미사용.
 */
export function FormattedText({ text }: { text: string }): ReactNode {
  // 리터럴 \n → 실제 줄바꿈
  const normalized = text.replace(/\\n/g, '\n');
  const lines = normalized.split('\n');

  // 블록 단위로 분류: table vs text
  type Block = { type: 'text' | 'table'; lines: string[] };
  const blocks: Block[] = [];
  let currentBlock: Block | null = null;

  for (const line of lines) {
    const isTableLine = line.trim().startsWith('|') && line.trim().endsWith('|');
    if (isTableLine) {
      if (currentBlock?.type === 'table') {
        currentBlock.lines.push(line);
      } else {
        if (currentBlock) blocks.push(currentBlock);
        currentBlock = { type: 'table', lines: [line] };
      }
    } else {
      if (currentBlock?.type === 'text') {
        currentBlock.lines.push(line);
      } else {
        if (currentBlock) blocks.push(currentBlock);
        currentBlock = { type: 'text', lines: [line] };
      }
    }
  }
  if (currentBlock) blocks.push(currentBlock);

  return (
    <>
      {blocks.map((block, bi) => {
        if (block.type === 'table') {
          // 구분선 제거, 나머지를 행으로 파싱
          const dataLines = block.lines.filter((l) => !isSeparatorRow(l));
          if (dataLines.length === 0) return null;
          const rows = dataLines.map((l) => parseCells(l));
          return (
            <table
              key={`b${bi}`}
              className="my-2 border-collapse text-sm w-auto"
            >
              <thead>
                <tr>
                  {rows[0].map((cell, ci) => (
                    <th
                      key={ci}
                      className="border border-gray-300 px-2 py-1 bg-gray-50 font-medium text-left"
                    >
                      {renderInline(cell, `b${bi}-h${ci}`)}
                    </th>
                  ))}
                </tr>
              </thead>
              {rows.length > 1 && (
                <tbody>
                  {rows.slice(1).map((row, ri) => (
                    <tr key={ri}>
                      {row.map((cell, ci) => (
                        <td
                          key={ci}
                          className="border border-gray-300 px-2 py-1"
                        >
                          {renderInline(cell, `b${bi}-r${ri}-c${ci}`)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              )}
            </table>
          );
        }

        // text block
        return (
          <Fragment key={`b${bi}`}>
            {block.lines.map((line, li) => (
              <Fragment key={li}>
                {li > 0 && <br />}
                {renderInline(line, `b${bi}-l${li}`)}
              </Fragment>
            ))}
          </Fragment>
        );
      })}
    </>
  );
}
