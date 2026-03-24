const PAYMENT_URL = 'https://www.allrounderenglish.co.kr/login?next=%2F';

export default function AllkillPayButton() {
  return (
    <a
      href={PAYMENT_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-block w-full text-center px-8 py-4 rounded-2xl font-bold text-lg text-white transition-all duration-200 hover:opacity-90 hover:scale-[1.02]"
      style={{ background: 'linear-gradient(135deg, #A78BFA 0%, #4DD9C0 100%)' }}
    >
      지금 시작하기 &rarr;
    </a>
  );
}
