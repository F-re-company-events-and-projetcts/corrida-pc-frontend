import React from 'react';
import { Check, AlertCircle } from 'lucide-react';
import { cn } from "@/lib/utils";

interface PricingCardProps {
    title: string;
    priceFull: number;
    priceDiscount: number;
    type: "public" | "police";
    badge?: string;
    features: string[];
    onSelect: () => void;
}

export const PricingCard = ({ title, priceFull, priceDiscount, type, badge, features, onSelect }: PricingCardProps) => {
    const isPolice = type === "police";

    return (
        <div className={cn(
            "relative rounded-2xl p-6 border transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl flex flex-col",
            isPolice ? "bg-secondary text-white border-secondary" : "bg-white text-gray-800 border-gray-200"
        )}>
            {isPolice && badge && (
                <div className="absolute top-0 right-0 bg-accent text-secondary text-xs font-black px-3 py-1 rounded-bl-lg rounded-tr-lg">
                    {badge}
                </div>
            )}

            <h3 className={cn("text-xl font-black mb-1", isPolice ? "text-white" : "text-secondary")}>
                {title}
            </h3>

            <div className="my-4">
                <span className="text-xs line-through opacity-60 mr-2">R$ {priceFull.toFixed(2)}</span>
                <div className="flex items-baseline gap-1">
                    <span className="text-sm font-bold">R$</span>
                    <span className={cn("text-4xl font-black", isPolice ? "text-accent" : "text-primary")}>
                        {priceDiscount.toFixed(2)}
                    </span>
                </div>
                <span className="text-xs opacity-70">1º Lote (Economize 20%)</span>
            </div>

            <ul className="space-y-3 mb-8 flex-grow">
                {features.slice(0, 4).map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                        <Check className={cn("w-4 h-4 mt-0.5", isPolice ? "text-accent" : "text-primary")} />
                        <span className="opacity-90">{feat}</span>
                    </li>
                ))}
            </ul>

            {isPolice && (
                <div className="flex items-center gap-2 text-xs bg-white/10 p-2 rounded mb-4">
                    <AlertCircle size={14} className="text-accent flex-shrink-0" />
                    <span>Necessário documento funcional</span>
                </div>
            )}

            <button
                onClick={onSelect}
                className={cn(
                    "w-full py-3 rounded-lg font-bold text-sm tracking-wide transition-colors",
                    isPolice
                        ? "bg-accent text-secondary hover:bg-white"
                        : "bg-secondary text-white hover:bg-primary"
                )}
            >
                QUERO ESTA MODALIDADE
            </button>
        </div>
    );
};
