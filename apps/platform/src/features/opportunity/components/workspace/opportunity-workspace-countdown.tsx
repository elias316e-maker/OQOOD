"use client";

import { useEffect, useState } from "react";

type OpportunityWorkspaceCountdownProps = {
  closingDate: string | null;
};

type CountdownState = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  expired: boolean;
};

function calculateCountdown(
  closingDate: string | null,
): CountdownState {
  if (!closingDate) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      expired: false,
    };
  }

  const timestamp = new Date(closingDate).getTime();

  if (!Number.isFinite(timestamp)) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      expired: false,
    };
  }

  const remaining = Math.max(0, timestamp - Date.now());

  return {
    days: Math.floor(remaining / 86_400_000),
    hours: Math.floor((remaining % 86_400_000) / 3_600_000),
    minutes: Math.floor((remaining % 3_600_000) / 60_000),
    seconds: Math.floor((remaining % 60_000) / 1_000),
    expired: remaining === 0,
  };
}

export function OpportunityWorkspaceCountdown({
  closingDate,
}: OpportunityWorkspaceCountdownProps) {
  const [countdown, setCountdown] = useState<CountdownState>(() =>
    calculateCountdown(closingDate),
  );

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCountdown(calculateCountdown(closingDate));
    }, 1_000);

    return () => window.clearInterval(timer);
  }, [closingDate]);

  if (!closingDate) {
    return (
      <div className="opportunityWorkspaceCountdown is-empty">
        <span>الوقت المتبقي</span>
        <strong>غير محدد</strong>
      </div>
    );
  }

  return (
    <div
      className="opportunityWorkspaceCountdown"
      aria-label="الوقت المتبقي لإغلاق المنافسة"
    >
      <span>
        {countdown.expired
          ? "انتهى موعد التقديم"
          : "الوقت المتبقي لتقديم العروض"}
      </span>

      <div className="opportunityWorkspaceCountdown__units">
        <div>
          <strong>{String(countdown.days).padStart(2, "0")}</strong>
          <small>يوم</small>
        </div>

        <b>:</b>

        <div>
          <strong>{String(countdown.hours).padStart(2, "0")}</strong>
          <small>ساعة</small>
        </div>

        <b>:</b>

        <div>
          <strong>{String(countdown.minutes).padStart(2, "0")}</strong>
          <small>دقيقة</small>
        </div>

        <b>:</b>

        <div>
          <strong>{String(countdown.seconds).padStart(2, "0")}</strong>
          <small>ثانية</small>
        </div>
      </div>
    </div>
  );
}
