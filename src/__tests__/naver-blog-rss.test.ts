import { describe, it, expect } from 'vitest';
import { parseNaverRss } from '@/lib/naver-blog-rss';

// 실제 rss.blog.naver.com/allrounder_eng.xml 구조를 축약한 샘플 (2026-09-17)
const SAMPLE = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title><![CDATA[실시간 온라인 영어 수업 올라영]]></title>
    <item>
      <author>allrounder_eng</author>
      <category><![CDATA[교육 이야기]]></category>
      <title><![CDATA[중1 영어 내신 서술형 대비, 2025년 기출문제로 시작하세요]]></title>
      <link><![CDATA[https://blog.naver.com/allrounder_eng/224412196718?fromRss=true&trackingCode=rss]]></link>
      <description><![CDATA[<img src="https://blogthumb.pstatic.net/abc/tmp.jpg?type=s3" alt=""><p>요즘 학교 현장에서 &amp; 느끼시는&nbsp;분들이 많으실 텐데</p>]]></description>
      <pubDate>Tue, 15 Sep 2026 10:28:25 +0900</pubDate>
      <guid><![CDATA[https://blog.naver.com/allrounder_eng/224412196718]]></guid>
    </item>
    <item>
      <category><![CDATA[[모집] 수강 신청]]></category>
      <title><![CDATA[썸네일 없는 글]]></title>
      <link><![CDATA[https://blog.naver.com/allrounder_eng/224402524916?fromRss=true]]></link>
      <description><![CDATA[본문만 있음]]></description>
      <pubDate>Sun, 06 Sep 2026 12:18:25 +0900</pubDate>
    </item>
    <item>
      <title><![CDATA[링크 없는 깨진 항목]]></title>
      <pubDate>Sun, 06 Sep 2026 12:18:25 +0900</pubDate>
    </item>
  </channel>
</rss>`;

describe('parseNaverRss', () => {
  const posts = parseNaverRss(SAMPLE);

  it('link·pubDate 없는 항목은 건너뛰고 나머지를 파싱한다', () => {
    expect(posts).toHaveLength(2);
  });

  it('RSS 추적 파라미터를 떼고 글 번호로 id를 만든다', () => {
    expect(posts[0].link).toBe('https://blog.naver.com/allrounder_eng/224412196718');
    expect(posts[0].id).toBe('naver-224412196718');
  });

  it('description에서 썸네일·HTML 제거·엔티티 복원한 요약을 뽑는다', () => {
    expect(posts[0].thumbnailUrl).toBe('https://blogthumb.pstatic.net/abc/tmp.jpg?type=s3');
    expect(posts[0].excerpt).toBe('요즘 학교 현장에서 & 느끼시는 분들이 많으실 텐데');
    expect(posts[1].thumbnailUrl).toBeNull();
  });

  it('카테고리·발행일(ISO)을 보존한다', () => {
    expect(posts[0].category).toBe('교육 이야기');
    expect(posts[1].category).toBe('[모집] 수강 신청');
    expect(posts[0].publishedAt).toBe('2026-09-15T01:28:25.000Z');
  });
});
