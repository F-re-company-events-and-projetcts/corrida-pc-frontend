"use client";

import React, { useState, useEffect } from 'react';

interface CountdownProps {
    targetDate: number;
}

const TimeBox = ({ value, label }: { value: number; label: string }) => (
    <div className="flex flex-col items-center bg-white p-4 rounded-xl border-b-4 border-primary shadow-xl w-24 md:w-32">
        <span className="text-3xl md:text-5xl font-black text-secondary">{String(value).padStart(2, '0')}</span>
        <span className="text-xs md:text-sm text-gray-500 font-bold uppercase mt-1">{label}</span>
    </div>
);

export const CountdownTimer = ({ targetDate }: CountdownProps) => {
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsMounted(true);
    }, []);

    useEffect(() => {
        const timer = setInterval(() => {
            const now = new Date().getTime();
            const distance = targetDate - now;

            if (distance < 0) {
                clearInterval(timer);
            } else {
                setTimeLeft({
                    days: Math.floor(distance / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                    minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
                    seconds: Math.floor((distance % (1000 * 60)) / 1000),
                });
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [targetDate]);

    if (!isMounted) return null;

    return (
        <div className="flex gap-4 md:gap-6 justify-center flex-wrap">
            <TimeBox value={timeLeft.days} label="Dias" />
            <TimeBox value={timeLeft.hours} label="Horas" />
            <TimeBox value={timeLeft.minutes} label="Min" />
            <TimeBox value={timeLeft.seconds} label="Seg" />
        </div>
    );
};
