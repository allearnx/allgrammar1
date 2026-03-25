const PAYMENT_URL = 'https://www.allrounderenglish.co.kr/login?next=%2F';

export default function SinaeSinPayButton() {
  return (
    <a
      href={PAYMENT_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="sinaesin-pricing-cta"
    >
      결제하기 &rarr;
    </a>
  );
}
