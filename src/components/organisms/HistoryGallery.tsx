"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Typography } from "@/components/atoms/typography";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

const photos = [
    "/historygallery/foto-01.jpeg",
    "/historygallery/foto-02.jpeg",
    "/historygallery/foto-03.jpeg",
    "/historygallery/foto-04.jpeg",
    "/historygallery/foto-05.jpeg",
    "/historygallery/foto-06.jpeg"
];

export const HistoryGallery = () => {
    const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

    const handleClose = useCallback(() => setSelectedIdx(null), []);
    
    const handleNext = useCallback(() => {
        if (selectedIdx !== null) setSelectedIdx((selectedIdx + 1) % photos.length);
    }, [selectedIdx]);

    const handlePrev = useCallback(() => {
        if (selectedIdx !== null) setSelectedIdx((selectedIdx - 1 + photos.length) % photos.length);
    }, [selectedIdx]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (selectedIdx === null) return;
            if (e.key === "Escape") handleClose();
            if (e.key === "ArrowRight") handleNext();
            if (e.key === "ArrowLeft") handlePrev();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [selectedIdx, handleClose, handleNext, handlePrev]);

    return (
        <section className="py-20 md:py-24 bg-[#F2F2F2] relative w-full">
            <div className="container mx-auto px-4 text-center">
                <div className="flex flex-col items-center justify-center mb-16">
                    <Typography variant="h2" as="h2" className="md:text-4xl font-black mb-2">
                        VENHA FAZER PARTE DESSA HISTÓRIA!
                    </Typography>
                    <div className="w-24 h-1 bg-primary"></div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {photos.map((src, idx) => (
                        <div 
                            key={idx} 
                            className="relative aspect-square cursor-pointer overflow-hidden rounded-lg group"
                            onClick={() => setSelectedIdx(idx)}
                        >
                            <Image 
                                src={src} 
                                alt={`Foto da história ${idx + 1}`} 
                                fill 
                                className="object-cover transition-transform duration-500 group-hover:scale-110" 
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* Modal */}
            {selectedIdx !== null && (
                <div 
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                    onClick={handleClose}
                >
                    <button 
                        onClick={handleClose} 
                        className="absolute top-4 right-4 text-white hover:text-primary transition-colors z-50 p-2"
                        aria-label="Fechar"
                    >
                        <X size={32} />
                    </button>

                    <div 
                        className="relative w-full max-w-5xl lg:max-w-7xl h-[70vh] md:h-[80vh] flex items-center justify-center p-0 md:p-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <Image 
                            src={photos[selectedIdx]} 
                            alt={`Foto selecionada ${selectedIdx + 1}`}
                            fill
                            className="object-contain"
                        />

                        <button 
                            onClick={handlePrev}
                            className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 backdrop-blur-md text-white p-3 rounded-full transition-colors"
                            aria-label="Foto anterior"
                        >
                            <ChevronLeft size={36} />
                        </button>
                        <button 
                            onClick={handleNext}
                            className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 backdrop-blur-md text-white p-3 rounded-full transition-colors"
                            aria-label="Próxima foto"
                        >
                            <ChevronRight size={36} />
                        </button>
                    </div>
                </div>
            )}
        </section>
    );
};
