import { Button } from "@/components/atoms/button";
import { Award } from "lucide-react";
import Image from "next/image";

export const Hero = () => {
    return (
        <section className="relative min-h-[100dvh] flex items-center justify-center overflow-hidden [clip-path:polygon(0_0,100%_0,100%_90%,0_100%)] bg-[#F2F2F2]">

            {/* Background Image & Overlay */}
            <div className="absolute inset-0 z-0">
                <Image
                    src="/hero/hero-delegacia-bg.jpeg"
                    alt="Hero Background"
                    fill
                    className="object-cover"
                    priority
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-black/30"></div>
            </div>

            {/* Watermark Element */}
            <div className="relative z-10 container mx-auto px-4 text-center text-white mt-16 md:mt-0 flex flex-col items-center justify-center gap-6">
                <div className="inline-block bg-primary px-3 py-1 md:px-4 md:py-2 rounded-full text-xs md:text-sm font-bold tracking-widest uppercase animate-pulse mb-2">
                    Inscrições Abertas! Fique Atento!
                </div>

                <h1 className="text-4xl sm:text-5xl md:text-7xl font-black leading-tight tracking-tight drop-shadow-lg font-heading">
                    2ª CORRIDA DO<br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-200">
                        POLICIAL CIVIL
                    </span>
                </h1>

                <div>
                    <p className="text-lg md:text-2xl font-light tracking-wide text-gray-200 mt-2">
                        Coxim/MS • 27 de Setembro de 2026
                    </p>
                    <p className="text-base md:text-xl font-medium text-gray-300 italic mt-4 px-4 md:px-0">
                        <strong>
                            &quot;Força, Compromisso e Superação em Cada Passada&quot;
                        </strong>
                    </p>
                </div>

                <div className="flex flex-col items-center justify-center w-full mt-6 gap-4 max-w-sm md:flex-row md:max-w-2xl">
                    <Button asChild className="text-base px-8 py-6 w-full box-border border-2 border-white md:text-lg md:w-auto shadow-orange-500/50 h-auto">
                        <a href="#registration">INSCREVA-SE AGORA!</a>
                    </Button>
                    <a href="#corrida-info" className="flex items-center justify-center gap-2 text-white font-semibold hover:text-accent transition-colors w-full md:w-auto p-4 md:p-0">
                        <Award className="w-5 h-5" />
                        DETALHES DO KIT 
                    </a>
                </div>
            </div>

            {/* Scroll Indicator */}
            <div className="absolute bottom-6 md:bottom-14 left-1/2 transform -translate-x-1/2 animate-bounce text-white/50">
                <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center pt-2">
                    <div className="w-1 h-2 bg-white rounded-full"></div>
                </div>
            </div>
        </section>
    );
};
