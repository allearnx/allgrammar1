'use client';

import { Fragment, type ReactNode } from 'react';

/**
 * 문제 텍스트에서 <u>...</u> 태그를 실제 밑줄로 렌더링.
 * 안전: dangerouslySetInnerHTML 미사용, <u> 태그만 파싱.
 */
export function FormattedText({ text }: { text: string }): ReactNode {
  // <u>...</u> 패턴으로 분리
  const parts = text.split(/(<u>.*?<\/u>)/g);
  if (parts.length === 1) return text;

  return (
    <>
      {parts.map((part, i) => {
        const match = part.match(/^<u>(.*?)<\/u>$/);
        if (match) {
          return <u key={i}>{match[1]}</u>;
        }
        return <Fragment key={i}>{part}</Fragment>;
      })}
    </>
  );
}
