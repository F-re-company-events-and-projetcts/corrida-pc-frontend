"use client";
import { motion } from "framer-motion";
import { Bike, GlassWater, PersonStanding } from "lucide-react"; // Exemplos de ícones
import { useState, useEffect } from "react";

export const RunnerAnimation = () => {
    const [isDrinking, setIsDrinking] = useState(false);

    return (
        <div className="relative w-full h-12 overflow-hidden border-b border-gray-200 mb-8">
            <motion.div
                className="absolute flex items-center gap-2"
                initial={{ x: "-10%" }}
                animate={{ x: "100%" }}
                transition={{
                    duration: 10,
                    repeat: Infinity,
                    ease: "linear",
                    // Aqui criamos a pausa para beber água no final do trajeto
                    repeatDelay: 2 
                }}
                onUpdate={(latest) => {
                    // Quando chegar perto de 95% do caminho, muda o estado
                    const progress = typeof latest.x === 'string' ? parseFloat(latest.x) : 0;
                    if (progress > 90) setIsDrinking(true);
                    else setIsDrinking(false);
                }}
            >
                {isDrinking ? (
                    <div className="flex items-center gap-1 text-primary">
                        <PersonStanding size={24} />
                        <GlassWater size={20} className="animate-bounce" />
                        <span className="text-[10px] font-bold uppercase">Hidratação!</span>
                    </div>
                ) : (
                    <div className="text-secondary animate-pulse">
                        <img src="/runner-icon.svg" className="w-8 h-8" alt="Corredor" />
                    </div>
                )}
            </motion.div>
        </div>
    );
};