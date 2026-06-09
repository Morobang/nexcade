'use client';

import { useState, useEffect } from 'react';

function getTimeLeft(targetDate: string) {
  const diff = new Date(targetDate).getTime() - Date.now();
  if (diff <= 0) return null;
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
  };
}

export function CountdownTimer({ targetDate }: { targetDate: string }) {
  const [timeLeft, setTimeLeft] = useState(() => getTimeLeft(targetDate));

  useEffect(() => {
    const timer = setInterval(() => setTimeLeft(getTimeLeft(targetDate)), 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  if (!timeLeft) return <span className="text-xs text-red-400 font-semibold">Starting now</span>;

  if (timeLeft.days > 0) {
    return (
      <span className="text-xs text-zinc-400">
        {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m
      </span>
    );
  }

  return (
    <span className="text-xs text-orange-400 font-mono font-bold">
      {String(timeLeft.hours).padStart(2, '0')}:
      {String(timeLeft.minutes).padStart(2, '0')}:
      {String(timeLeft.seconds).padStart(2, '0')}
    </span>
  );
}

interface UnitProps {
  value: number;
  label: string;
}

function Unit({ value, label }: UnitProps) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-4xl font-display text-white leading-none">
        {String(value).padStart(2, '0')}
      </span>
      <span className="text-xs text-zinc-500 uppercase tracking-widest mt-1">{label}</span>
    </div>
  );
}

export function HeroCountdown({ targetDate, label }: { targetDate: string; label: string }) {
  const [timeLeft, setTimeLeft] = useState(() => getTimeLeft(targetDate));

  useEffect(() => {
    const timer = setInterval(() => setTimeLeft(getTimeLeft(targetDate)), 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  if (!timeLeft) {
    return (
      <div className="text-center">
        <p className="text-red-500 font-display text-2xl">LIVE NOW</p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-xs text-zinc-500 uppercase tracking-widest mb-3 text-center">{label}</p>
      <div className="flex items-end gap-4">
        {timeLeft.days > 0 && <Unit value={timeLeft.days} label="days" />}
        <Unit value={timeLeft.hours} label="hrs" />
        <Unit value={timeLeft.minutes} label="min" />
        <Unit value={timeLeft.seconds} label="sec" />
      </div>
    </div>
  );
}
