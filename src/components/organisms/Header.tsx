"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/atoms/button";
import { cn } from "@/lib/utils";
import { Shield, Menu, X } from "lucide-react";

export const Header = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleCorredoresClick = (e: React.MouseEvent) => {
        e.preventDefault();
        alert("Disponível após o fim das inscrições");
    };

    const navLinks = [
        { name: "Em Breve", href: "#", disabled: true, onClick: () => alert("Detalhes serão divulgados em breve") },
        { name: "Entrega de Kit", href: "#" },
        { name: "Galeria 2025", href: "#galeria" },
        { name: "Corredores", href: "#", onClick: handleCorredoresClick },
    ];

    return (
        <header className={cn(
            "fixed w-full z-50 transition-all duration-300",
            scrolled ? "bg-[#F2F2F2] shadow-md py-2" : "bg-transparent py-4"
        )}>
            <div className="container mx-auto px-4 md:px-8 flex justify-between items-center">
                <div className="flex items-center gap-2 relative z-10">
                    <div className="bg-white/90 p-1.5 rounded-lg shadow-sm">
                        <img src="/logo.jpeg" alt="Logo" className="w-12 h-12 md:w-16 md:h-16 object-contain" />
                    </div>
                </div>

                {/* Header Watermark Shield - Absolute to right */}
                <div className="absolute right-10 top-1/2 transform -translate-y-1/2 opacity-5 pointer-events-none hidden md:block z-0">
                    <Shield className="w-24 h-24 text-secondary" />
                </div>

                {/* Desktop Menu */}
                <nav className="hidden md:flex items-center gap-8 relative z-10">
                    {navLinks.map((item) => (
                        <a
                            key={item.name}
                            href={item.href}
                            onClick={item.onClick}
                            className={cn(
                                "font-semibold text-sm uppercase tracking-wide transition-colors",
                                item.disabled ? "cursor-not-allowed text-gray-400" : "hover:text-primary",
                                !item.disabled && (scrolled ? "text-gray-800" : "text-white/90")
                            )}
                        >
                            {item.name}
                        </a>
                    ))}
                    <Button asChild className="py-2 px-6 text-sm shadow-orange-500/30">
                        <a href="#registration">INSCREVA-SE</a>
                    </Button>
                </nav>

                {/* Mobile Toggle */}
                <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden relative z-10">
                    {isMenuOpen ? <X className="text-primary" /> : <Menu className={scrolled ? "text-secondary" : "text-white"} />}
                </button>
            </div>

            {/* Mobile Menu */}
            {isMenuOpen && (
                <div className="absolute top-full left-0 w-full bg-white shadow-xl py-6 flex flex-col items-center gap-4 md:hidden border-t animate-in slide-in-from-top-2">
                    {navLinks.map((item) => (
                        <a 
                            key={item.name} 
                            href={item.href} 
                            onClick={item.onClick}
                            className={cn(
                                "font-bold text-lg transition-colors",
                                item.disabled ? "cursor-not-allowed text-gray-400" : "text-secondary hover:text-primary"
                            )}
                        >
                            {item.name}
                        </a>
                    ))}
                    <Button asChild className="w-3/4">
                        <a href="#registration" onClick={() => setIsMenuOpen(false)}>INSCREVA-SE</a>
                    </Button>
                </div>
            )}
        </header>
    );
};