import React from 'react';
import Link from 'next/link';
import { Check, AlertCircle } from 'lucide-react';
import { cn } from "@/lib/utils";

interface PricingCardProps {
    id?: string;
    title: string;
    priceAtual: number | null;
    type: "public" | "police";
    badge?: string;
    features: string[];
    lotText?: string;
    subtext?: string;
    disabled?: boolean;
}

export const PricingCard = ({ id, title, priceAtual, type, badge, features, lotText, subtext, disabled }: PricingCardProps) => {
    const isPolice = type === "police";
    const isSoldOut = disabled;

    return (
        <div className={cn(
            "relative rounded-2xl p-6 border transition-all duration-300 flex flex-col",
            isSoldOut
                ? "opacity-60 bg-gray-100 border-gray-200 text-gray-400"
                : isPolice
                    ? "bg-primary text-white border-primary hover:-translate-y-2 hover:shadow-2xl"
                    : "bg-white text-gray-800 border-gray-200 hover:-translate-y-2 hover:shadow-2xl"
        )}>
            {isSoldOut && (
                <div className="absolute top-0 right-0 bg-gray-500 text-white text-xs font-black px-3 py-1 rounded-bl-lg rounded-tr-lg">
                    ESGOTADO
                </div>
            )}
            {!isSoldOut && isPolice && badge && (
                <div className="absolute top-0 right-0 bg-accent text-primary text-xs font-black px-3 py-1 rounded-bl-lg rounded-tr-lg">
                    {badge}
                </div>
            )}

            <h3 className={cn("text-xl font-black mb-1", isSoldOut ? "text-gray-400" : isPolice ? "text-white" : "text-secondary")}>
                {title}
            </h3>
            {subtext && <p className="text-[10px] uppercase opacity-80 mb-2 font-medium tracking-wider">{subtext}</p>}

            <div className="my-4">
                <div className="flex items-baseline gap-1">
                    {priceAtual !== null ? (
                        <>
                            <span className="text-sm font-bold">R$</span>
                            <span className={cn("text-4xl font-black", isSoldOut ? "text-gray-400" : isPolice ? "text-accent" : "text-primary")}>
                                {priceAtual.toFixed(2)}
                            </span>
                        </>
                    ) : (
                        <span className="text-2xl font-black text-gray-400">—</span>
                    )}
                </div>
                {lotText && <span className="text-xs opacity-70 mt-1 block">{lotText}</span>}
            </div>

            <ul className="space-y-3 mb-8 flex-grow">
                {features.slice(0, 4).map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                        <Check className={cn("w-4 h-4 mt-0.5", isSoldOut ? "text-gray-400" : isPolice ? "text-accent" : "text-primary")} />
                        <span className="opacity-90">{feat}</span>
                    </li>
                ))}
            </ul>

            {!isSoldOut && isPolice && (
                <div className="flex items-center gap-2 text-xs bg-white/10 p-2 rounded mb-4">
                    <AlertCircle size={14} className="text-accent flex-shrink-0" />
                    <span className="uppercase font-bold tracking-wider">Necessário comprovação</span>
                </div>
            )}

            {isSoldOut ? (
                <button
                    disabled
                    className="w-full py-3 rounded-lg font-bold text-sm tracking-wide bg-gray-300 text-gray-500 cursor-not-allowed"
                >
                    ESGOTADO
                </button>
            ) : (
                <Link
                    href={id ? `/inscricao?cat=${id}` : "/inscricao"}
                    className={cn(
                        "w-full py-3 rounded-lg font-bold text-sm tracking-wide transition-colors text-center block",
                        isPolice
                            ? "bg-accent text-primary hover:bg-white"
                            : "bg-secondary text-white hover:bg-primary"
                    )}
                >
                    INSCREVER-SE
                </Link>
            )}
        </div>
    );
};
