import React from 'react';
import { ChevronRight, User, Award } from 'lucide-react';
import { cn } from "@/lib/utils";

interface CourseCardProps {
    title: string;
    distance: number;
    color: "orange" | "blue";
    onClickDetails?: () => void;
}

export const CourseCard = ({ title, distance, color, onClickDetails }: CourseCardProps) => {
    const isOrange = color === "orange";

    return (
        <div className={cn(
            "bg-white p-6 rounded-xl shadow-md border-l-4 hover:shadow-xl transition-all flex flex-col justify-center h-full min-h-[160px]",
            isOrange ? "border-primary" : "border-secondary"
        )}>
            <div className="flex justify-between items-start mb-4">
                <div className={cn(
                    "p-3 rounded-lg",
                    isOrange ? "bg-orange-100 text-primary" : "bg-blue-100 text-secondary"
                )}>
                    {isOrange ? <User size={32} /> : <Award size={32} />}
                </div>
                <div className="flex flex-col items-end">
                    <span className={cn(
                        "text-3xl font-black",
                        isOrange ? "text-primary" : "text-secondary"
                    )}>
                        {distance}k
                    </span>
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                        Percurso
                    </span>
                </div>
            </div>
            <h3 className="text-2xl font-black text-secondary mb-4">{title}</h3>
            
            <button
                onClick={onClickDetails}
                className={cn(
                    "font-bold text-sm hover:underline flex items-center gap-1 mt-auto",
                    isOrange ? "text-primary" : "text-secondary"
                )}
            >
                Ver trajeto detalhado no mapa <ChevronRight size={16} />
            </button>
        </div>
    );
};

