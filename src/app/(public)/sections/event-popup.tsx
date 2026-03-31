'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

export function EventPopup() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const hideUntil = localStorage.getItem('eventPopupHideUntil');
    const now = new Date().getTime();
    if (!hideUntil || now > parseInt(hideUntil)) {
      setShow(true); // eslint-disable-line react-hooks/set-state-in-effect -- reading localStorage
    }
  }, []);

  if (!show) return null;

  function close() {
    setShow(false);
  }

  function hideForToday() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    localStorage.setItem('eventPopupHideUntil', tomorrow.getTime().toString());
    setShow(false);
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[70] overflow-y-auto"
      onClick={close}
    >
      <div
        className="relative w-full max-w-5xl my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={close}
          className="absolute -top-10 right-0 md:right-0 text-white hover:text-gray-300 transition-colors z-10"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="flex flex-col md:flex-row gap-4 items-start justify-center">
          <div className="w-full md:w-auto md:max-w-xl rounded-2xl overflow-hidden shadow-2xl">
            <Image src="/popup/event.png" alt="이벤트 안내 1" width={1080} height={960} className="w-full h-auto" priority />
          </div>
          <div className="w-full md:w-auto md:max-w-xl rounded-2xl overflow-hidden shadow-2xl">
            <Image src="/popup/event2.png" alt="이벤트 안내 2" width={1080} height={1350} className="w-full h-auto" priority />
          </div>
        </div>

        <div className="flex mt-4 gap-2 max-w-md mx-auto">
          <button
            onClick={hideForToday}
            className="flex-1 py-3 bg-white/20 hover:bg-white/30 text-white text-sm rounded-xl backdrop-blur-sm transition-colors"
          >
            오늘 하루 보지 않기
          </button>
          <button
            onClick={close}
            className="flex-1 py-3 bg-white hover:bg-gray-100 text-gray-800 text-sm font-medium rounded-xl transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
