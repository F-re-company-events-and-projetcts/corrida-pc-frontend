import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from "@/lib/utils";

interface InfoCardProps {
    title: string;
    icon: LucideIcon;
    color: "orange" | "blue" | "gold";
    children: React.ReactNode;
    footerText?: string;
    className?: string;
}

export const InfoCard = ({ title, icon: Icon, color, children, footerText, className }: InfoCardProps) => {
    const colorMap = {
        orange: { bg: "bg-primary", text: "text-primary", hover: "group-hover:bg-primary" },
        blue: { bg: "bg-secondary", text: "text-secondary", hover: "group-hover:bg-secondary" },
        gold: { bg: "bg-accent", text: "text-accent", hover: "group-hover:bg-accent" }
    };

    const selectedColor = colorMap[color];

    return (
        <div className={cn("bg-white text-gray-800 p-8 rounded-2xl shadow-2xl relative overflow-hidden group", className)}>
            <div className={cn("absolute top-0 right-0 w-20 h-20 bg-gray-100 rounded-bl-full -mr-10 -mt-10 transition-colors", selectedColor.hover)}></div>
            <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center text-white mb-6 relative z-10", selectedColor.bg)}>
                <Icon size={24} className={color === 'gold' ? 'text-secondary' : 'text-white'} />
            </div>
            <h3 className="text-xl font-black mb-4 relative z-10">{title}</h3>
            <div className="relative z-10">
                {children}
            </div>
            {footerText && (
                <div className="mt-4 text-xs bg-gray-100 p-3 rounded text-gray-600 border-l-4 border-secondary relative z-10">
                    {footerText}
                </div>
            )}
        </div>
    );
};
