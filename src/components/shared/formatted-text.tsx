'use client';

import { Fragment, type ReactNode } from 'react';

/**
 * 문제 텍스트에서 <u>...</u> 태그를 밑줄로, \n을 줄바꿈으로 렌더링.
 * 안전: dangerouslySetInnerHTML 미사용.
 */
export function FormattedText({ text }: { text: string }): ReactNode {
  // 1) 리터럴 \n → 실제 줄바꿈
  const normalized = text.replace(/\\n/g, '\n');

  // 2) <u>...</u> + 줄바꿈 파싱
  const parts = normalized.split(/(<u>.*?<\/u>|\n)/g);

  return (
    <>
      {parts.map((part, i) => {
        if (part === '\n') return <br key={i} />;
        const match = part.match(/^<u>(.*?)<\/u>$/);
        if (match) return <u key={i}>{match[1]}</u>;
        return <Fragment key={i}>{part}</Fragment>;
      })}
    </>
  );
}
