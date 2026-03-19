import { Button } from "@/components/atoms/button";
import { Shield, Award } from "lucide-react";

export const Hero = () => {
    return (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden [clip-path:polygon(0_0,100%_0,100%_90%,0_100%)] bg-[#F2F2F2]">

            {/* Background Image & Overlay */}
            <div className="absolute inset-0 z-0">
                <img
                    src="https://images.unsplash.com/photo-1552674605-469523170d73?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80"
                    alt=""
                    className="w-full h-full object-cover blur-sm"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-primary/95 to-destructive/90 mix-blend-multiply"></div>
            </div>

            {/* Watermark Element */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-0 pointer-events-none opacity-15">
                 <Shield className="w-[800px] h-[800px] text-white" />
            </div>

            <div className="relative z-10 container mx-auto px-4 text-center text-white mt-16">
                <div className="inline-block bg-primary px-4 py-1 rounded-full text-sm font-bold mb-6 tracking-widest uppercase animate-pulse">
                    Inscrições em Breve! Fique Atento! 
                </div>

                <h1 className="text-5xl md:text-7xl font-black mb-4 leading-tight tracking-tight drop-shadow-lg font-heading">
                    2ª CORRIDA DO<br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-200">
                        POLICIAL CIVIL
                    </span>
                </h1>

                <p className="text-xl md:text-2xl font-light mb-2 tracking-wide text-gray-200 mt-4">
                    Coxim/MS • 27 de Setembro de 2026
                </p>

                <p className="text-lg md:text-xl font-medium text-gray-300 mb-10 italic">
                    &quot;Força, Compromisso e Superação em Cada Passada&quot;
                </p>

                <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
                    <Button asChild className="text-lg px-10 py-5 w-full border-1 border-white md:w-auto shadow-orange-500/50 h-auto">
                        <a href="#registration">VEJA AS MODALIDADES</a>
                    </Button>
                    <a href="#registration" className="flex items-center gap-2 text-white font-semibold hover:text-accent transition-colors">
                        <Award className="w-5 h-5" />
                        DETALHES DO KIT 
                    </a>
                </div>
            </div>

            {/* Scroll Indicator */}
            <div className="absolute bottom-14 left-1/2 transform -translate-x-1/2 animate-bounce text-white/50">
                <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center pt-2">
                    <div className="w-1 h-2 bg-white rounded-full"></div>
                </div>
            </div>
        </section>
    );
};
