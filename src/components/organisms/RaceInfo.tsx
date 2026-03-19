import { User, Calendar, MapPin, Award, Clock } from "lucide-react";

export const RaceInfo = () => {
    return (
        <section className="w-full">
            <div className="grid grid-cols-1 md:grid-cols-3 w-full h-auto min-h-[500px]">

                {/* Card Entrega de Kit */}
                <div className="relative group overflow-hidden cursor-pointer w-full text-white flex flex-col justify-end p-8 md:p-12 transition-all duration-500 hover:scale-105 z-10 hover:z-20 border-r border-white/10 last:border-r-0">
                    <div className="absolute inset-0 z-0">
                        <img 
                            src="https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
                            alt="Entrega de Kit" 
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent"></div>
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

                {/* Card Dia da Prova */}
                <div className="relative group overflow-hidden cursor-pointer w-full text-white flex flex-col justify-end p-8 md:p-12 transition-all duration-500 hover:scale-105 z-10 hover:z-20 border-r border-white/10 last:border-r-0">
                    <div className="absolute inset-0 z-0">
                        <img 
                            src="https://images.unsplash.com/photo-1551698618-1dfe5d97d256?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
                            alt="Dia da Prova" 
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-accent/50 to-black/30"></div>
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
                                <span>Largada 5km</span>
                                <span className="font-bold text-accent">05h30</span>
                            </li>
                        </ul>
                        <div className="mt-4 flex items-center gap-2 text-sm text-gray-200">
                            <MapPin size={16} className="text-accent" /> Delegacia de Polícia Civil - Coxim
                        </div>
                    </div>
                </div>

                {/* Card Premiação */}
                <div className="relative group overflow-hidden cursor-pointer w-full text-white flex flex-col justify-end p-8 md:p-12 transition-all duration-500 hover:scale-105 z-10 hover:z-20">
                    <div className="absolute inset-0 z-0">
                        <img 
                            src="https://images.unsplash.com/photo-1526676037777-05a232554f77?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
                            alt="Premiação" 
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent"></div>
                    </div>

                    <div className="relative z-10 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                        <div className="w-12 h-12 bg-[#F2C12E] rounded-lg flex items-center justify-center text-secondary mb-6">
                            <Award size={24} />
                        </div>
                        <h3 className="text-2xl font-black mb-4 uppercase font-heading">Premiação</h3>
                        <ul className="space-y-4 text-sm opacity-90">
                            <li className="flex gap-3 items-center">
                                <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-[#F2C12E] font-bold shrink-0">1º</div>
                                <div>
                                    <span className="block font-bold">Geral e Faixa Etária</span>
                                    <span className="text-gray-300 text-xs">Ambas separadas por sexo</span>
                                </div>
                            </li>
                        </ul>
                        <div className="mt-8 pt-4 border-t border-white/20 text-sm font-bold text-[#F2C12E] flex items-center gap-2">
                            <Clock size={16} />
                            Cerimônia: 10h00
                        </div>
                    </div>
                </div>

            </div>
        </section>
    );
};

