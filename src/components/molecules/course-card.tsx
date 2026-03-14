import React from 'react';
import { MapPin, Clock, ChevronRight, User, Award } from 'lucide-react';
import { cn } from "@/lib/utils";

interface CourseCardProps {
    title: string;
    distance: number;
    elevation: number;
    timeLimit: string;
    level: "beginner" | "intermediate" | "advanced";
    color: "orange" | "blue";
    onClickDetails?: () => void;
}

export const CourseCard = ({ title, elevation, timeLimit, level, color, onClickDetails }: CourseCardProps) => {
    const isOrange = color === "orange";

    return (
        <div className={cn(
            "bg-white p-6 rounded-xl shadow-md border-l-4 hover:shadow-xl transition-all",
            isOrange ? "border-primary" : "border-secondary"
        )}>
            <div className="flex justify-between items-start mb-4">
                <div className={cn(
                    "p-3 rounded-lg",
                    isOrange ? "bg-orange-100 text-primary" : "bg-blue-100 text-secondary"
                )}>
                    {isOrange ? <User size={24} /> : <Award size={24} />}
                </div>
                <span className="text-xs font-bold text-gray-400 uppercase">
                    {level === "beginner" ? "Iniciante / Interm." :
                        level === "intermediate" ? "Intermediário" :
                            "Interm. / Avançado"}
                </span>
            </div>
            <h3 className="text-2xl font-black text-secondary mb-2">{title}</h3>
            <div className="flex gap-4 text-sm text-gray-600 mb-4">
                <div className="flex items-center gap-1"><MapPin size={16} /> Elevação: {elevation}m</div>
                <div className="flex items-center gap-1"><Clock size={16} /> Limite: {timeLimit}</div>
            </div>
            <button
                onClick={onClickDetails}
                className={cn(
                    "font-bold text-sm hover:underline flex items-center gap-1",
                    isOrange ? "text-primary" : "text-secondary"
                )}
            >
                Ver trajeto detalhado <ChevronRight size={16} />
            </button>
        </div>
    );
};
