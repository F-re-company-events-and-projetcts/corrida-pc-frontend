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

    const navLinks = [
        { name: "Regulamento", href: "#" },
        { name: "Entrega de Kit", href: "#" },
        { name: "Área de Inscritos", href: "#" },
        { name: "Corredores", href: "#" },
    ];

    return (
        <header className={cn(
            "fixed w-full z-50 transition-all duration-300",
            scrolled ? "bg-white shadow-md py-2" : "bg-transparent py-4"
        )}>
            <div className="container mx-auto px-4 md:px-8 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <Shield className={cn("w-8 h-8", scrolled ? "text-secondary" : "text-white")} />
                    <div className={cn(
                        "font-black text-xl tracking-tighter leading-none font-heading",
                        scrolled ? "text-secondary" : "text-white"
                    )}>
                        2ª CORRIDA<br />
                        <span className="text-primary">POLICIAL CIVIL</span>
                    </div>
                </div>

                {/* Desktop Menu */}
                <nav className="hidden md:flex items-center gap-8">
                    {navLinks.map((item) => (
                        <a
                            key={item.name}
                            href={item.href}
                            className={cn(
                                "font-semibold text-sm uppercase tracking-wide hover:text-primary transition-colors",
                                scrolled ? "text-gray-800" : "text-white/90"
                            )}
                        >
                            {item.name}
                        </a>
                    ))}
                    <Button className="py-2 px-6 text-sm shadow-orange-500/30">INSCREVA-SE</Button>
                </nav>

                {/* Mobile Toggle */}
                <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden">
                    {isMenuOpen ? <X className="text-primary" /> : <Menu className={scrolled ? "text-secondary" : "text-white"} />}
                </button>
            </div>

            {/* Mobile Menu */}
            {isMenuOpen && (
                <div className="absolute top-full left-0 w-full bg-white shadow-xl py-6 flex flex-col items-center gap-4 md:hidden border-t animate-in slide-in-from-top-2">
                    {navLinks.map((item) => (
                        <a key={item.name} href={item.href} className="font-bold text-secondary text-lg hover:text-primary transition-colors">{item.name}</a>
                    ))}
                    <Button className="w-3/4">INSCREVA-SE</Button>
                </div>
            )}
        </header>
    );
};