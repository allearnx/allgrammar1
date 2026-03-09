"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="ko">
      <body>
        <div style={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ textAlign: "center" }}>
            <h1 style={{ fontSize: "1.5rem", fontWeight: "bold" }}>오류 발생</h1>
            <p style={{ color: "#666", marginTop: "0.5rem" }}>
              예기치 않은 오류가 발생했습니다.
            </p>
            <button
              onClick={reset}
              style={{ marginTop: "1rem", padding: "0.5rem 1.5rem", border: "1px solid #ccc", borderRadius: "0.375rem", cursor: "pointer" }}
            >
              다시 시도
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
