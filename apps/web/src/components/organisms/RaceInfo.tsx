"use client";

import { useState } from "react";
import { User, Calendar, MapPin, Award, Medal, Trophy, FileText, ExternalLink } from "lucide-react";
import { Typography } from "@/components/atoms/typography";
import { PremiacaoModal } from "@/components/organisms/PremiacaoModal";

const REGULAMENTO_URL = "https://drive.google.com/drive/folders/1T3syuXmTeNV9qj9LyW6NdIXWWdOBiS0M";

export const RaceInfo = () => {
    const [premiacaoOpen, setPremiacaoOpen] = useState(false);

    return (
        <section className="py-20 md:py-24 bg-[#F2F2F2] w-full" id="corrida-info">
            <div className="container mx-auto px-4 flex flex-col items-center mb-16">
                <Typography variant="h2" as="h2" className="md:text-4xl font-black text-center mb-2">
                    MANTENHA-SE INFORMADO!
                </Typography>
                <div className="w-24 h-1 bg-primary"></div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 w-full h-auto min-h-[500px]">

                {/* Card Entrega de Kit */}
                <div className="relative group overflow-hidden cursor-pointer w-full text-white flex flex-col justify-end p-8 md:p-12 transition-all duration-500 hover:scale-105 z-10 hover:z-20 border-r border-white/10 last:border-r-0">
                    <div className="absolute inset-0 z-0">
                        <img
                            src="/receinfo/entrega-de-kit.jpeg"
                            alt="Entrega de Kit"
                            className="w-full h-full object-cover object-[center_20%] transition-transform duration-700 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
                    </div>

                    <div className="relative z-10 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                        <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center text-white mb-6">
                            <User size={24} />
                        </div>
                        <h3 className="text-2xl font-black mb-4 uppercase font-heading">Entrega de Kit</h3>
                        <ul className="space-y-3 text-sm opacity-90">
                            <li className="flex items-start gap-3">
                                <Calendar className="w-5 h-5 text-primary shrink-0" />
                                <div>
                                    <span className="block font-bold">26/09/2026</span>
                                    <span className="text-gray-300">08h às 18h</span>
                                </div>
                            </li>
                            <li className="flex items-start gap-3">
                                <MapPin className="w-5 h-5 text-primary shrink-0" />
                                <div>
                                    <span className="block font-bold">Delegacia de Polícia Civil - Coxim</span>
                                    <span className="text-gray-300">Apenas presencial</span>
                                </div>
                            </li>
                        </ul>
                        <div className="mt-4 text-xs bg-white/10 backdrop-blur-sm p-3 rounded text-gray-200 border-l-4 border-primary">
                            Apresente documento com foto e comprovante.
                        </div>
                    </div>
                </div>

                {/* Card Premiação */}
                <div className="relative group overflow-hidden w-full text-white flex flex-col justify-end p-8 md:p-12 transition-all duration-500 hover:scale-105 z-10 hover:z-20 border-r border-white/10 last:border-r-0">
                    <div className="absolute inset-0 z-0">
                        <img
                            src="/receinfo/premiacao-card.jpeg"
                            alt="Premiação"
                            className="w-full h-full object-cover object-[center_20%] transition-transform duration-700 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
                    </div>

                    <div className="relative z-10 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                        <div className="w-12 h-12 bg-[#F2C12E] rounded-lg flex items-center justify-center text-secondary mb-6">
                            <Award size={24} />
                        </div>
                        <h3 className="text-2xl font-black mb-4 uppercase font-heading">Premiação</h3>
                        <ul className="space-y-3 text-sm opacity-90 mb-6">
                            <li className="flex items-start gap-3">
                                <Medal className="w-5 h-5 text-[#F2C12E] shrink-0 mt-0.5" />
                                <span>Medalha para todos que <strong>concluírem a prova</strong></span>
                            </li>
                            <li className="flex items-start gap-3">
                                <Trophy className="w-5 h-5 text-[#F2C12E] shrink-0 mt-0.5" />
                                <span>Troféus para 1º–3º — <strong>Geral</strong> e por <strong>Faixa Etária</strong></span>
                            </li>
                            <li className="flex items-start gap-3">
                                <Award className="w-5 h-5 text-[#F2C12E] shrink-0 mt-0.5" />
                                <span className="text-gray-300 text-xs">Cidadão e Segurança Pública • Masculino e Feminino</span>
                            </li>
                        </ul>
                        <button
                            type="button"
                            onClick={() => setPremiacaoOpen(true)}
                            className="w-full mt-2 px-4 py-2.5 rounded-lg bg-[#F2C12E] text-white text-sm font-bold uppercase tracking-wide hover:bg-[#E5A500] transition-colors cursor-pointer"
                        >
                            Ver regras de premiação
                        </button>
                    </div>
                </div>

                {/* Card Dia da Prova */}
                <div className="relative group overflow-hidden cursor-pointer w-full text-white flex flex-col justify-end p-8 md:p-12 transition-all duration-500 hover:scale-105 z-10 hover:z-20">
                    <div className="absolute inset-0 z-0">
                        <img
                            src="/receinfo/dia-da-prova-card.jpeg"
                            alt="Dia da Prova"
                            className="w-full h-full object-cover object-[center_20%] transition-transform duration-700 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-accent/40 to-transparent"></div>
                    </div>

                    <div className="relative z-10 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                        <div className="w-12 h-12 bg-accent rounded-lg flex items-center justify-center text-secondary mb-6">
                            <Calendar size={24} />
                        </div>
                        <h3 className="text-2xl font-black mb-4 uppercase font-heading">Dia da Prova</h3>

                        <div className="text-center bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-4 border border-white/20">
                            <div className="text-4xl font-black text-accent drop-shadow-md">27</div>
                            <div className="text-sm font-bold uppercase tracking-widest text-gray-200">Setembro 2026</div>
                        </div>

                        <ul className="space-y-3 text-sm opacity-90">
                            <li className="flex justify-between border-b border-white/10 pb-2">
                                <span>Concentração</span>
                                <span className="font-bold">05h00</span>
                            </li>
                            <li className="flex justify-between border-b border-white/10 pb-2">
                                <span>Largada 10km</span>
                                <span className="font-bold text-accent">05h30</span>
                            </li>
                            <li className="flex justify-between">
                                <span>Largada 4KM</span>
                                <span className="font-bold text-accent">05h30</span>
                            </li>
                        </ul>
                        <div className="mt-4 flex items-center gap-2 text-sm text-gray-200">
                            <MapPin size={16} className="text-accent" /> Delegacia de Polícia Civil - Coxim
                        </div>
                    </div>
                </div>

            </div>

            {/* Banner Regulamento */}
            <div className="container mx-auto px-4 mt-12">
                <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 md:p-8 flex flex-col md:flex-row items-center gap-6">
                    <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <FileText className="w-7 h-7 text-primary" />
                    </div>
                    <div className="flex-1 text-center md:text-left">
                        <h4 className="font-black text-lg text-gray-900 mb-1 uppercase font-heading">
                            Antes de se inscrever, leia o regulamento
                        </h4>
                        <p className="text-sm text-gray-600 leading-relaxed">
                            Para garantir a segurança e a organização do evento, todos os participantes devem
                            respeitar o percurso oficial e as normas estabelecidas pela comissão organizadora.
                            Consulte o regulamento completo para conhecer todas as regras, orientações e condições
                            de participação.
                        </p>
                    </div>
                    <a
                        href={REGULAMENTO_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-primary text-white text-sm font-bold uppercase tracking-wide hover:bg-primary/90 transition-colors"
                    >
                        Regulamento Completo
                        <ExternalLink size={16} />
                    </a>
                </div>
            </div>

            <PremiacaoModal open={premiacaoOpen} onOpenChange={setPremiacaoOpen} />
        </section>
    );
};
