import { InfoCard } from "@/components/molecules/info-card";
import { User, Calendar, MapPin, Award } from "lucide-react";

export const RaceInfo = () => {
    return (
        <section className="py-20 bg-linear-to-br from-secondary to-primary text-white">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                    {/* Card Entrega de Kit */}
                    <InfoCard
                        title="ENTREGA DE KIT"
                        icon={User}
                        color="orange"
                    >
                        <ul className="space-y-3 text-sm">
                            <li className="flex items-start gap-3">
                                <Calendar className="w-5 h-5 text-primary shrink-0" />
                                <div>
                                    <span className="block font-bold">26/09/2025</span>
                                    <span className="text-gray-500">08h às 18h</span>
                                </div>
                            </li>
                            <li className="flex items-start gap-3">
                                <MapPin className="w-5 h-5 text-primary shrink-0 transition-transform duration-300 group-hover:animate-pulse" />
                                <div>
                                    <span className="block font-bold">Delegacia de Polícia Civil - Coxim</span>
                                    <span className="text-gray-500">Apenas presencial</span>
                                </div>
                            </li>
                        </ul>
                        <div className="mt-4 text-xs bg-gray-100 p-3 rounded text-gray-600 border-l-4 border-secondary">
                            Apresente documento com foto e comprovante.
                        </div>
                    </InfoCard>

                    {/* Card Dia da Prova */}
                    <div className="bg-white text-gray-900 p-8 rounded-2xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 transform md:-translate-y-4 border-t-8 border-accent group">
                        <div className="w-12 h-12 bg-secondary rounded-lg flex items-center justify-center text-white mb-6 transition-transform duration-300 group-hover:scale-110">
                            <Calendar size={24} className="transition-transform duration-300 group-hover:animate-pulse" />
                        </div>
                        <h3 className="text-xl font-black mb-4">DIA DA PROVA</h3>
                        <div className="text-center bg-gray-50 rounded-xl p-4 mb-4">
                            <div className="text-4xl font-black text-secondary">28</div>
                            <div className="text-sm font-bold uppercase tracking-widest text-gray-500">Setembro 2025</div>
                        </div>
                        <ul className="space-y-3 text-sm">
                            <li className="flex justify-between border-b border-gray-100 pb-2">
                                <span>Concentração</span>
                                <span className="font-bold">05h00</span>
                            </li>
                            <li className="flex justify-between border-b border-gray-100 pb-2">
                                <span>Largada 10km</span>
                                <span className="font-bold text-primary">05h30</span>
                            </li>
                            <li className="flex justify-between">
                                <span>Largada 5km</span>
                                <span className="font-bold text-primary">05h45</span>
                            </li>
                        </ul>
                        <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
                            <MapPin size={16} /> Praça da Matriz
                        </div>
                    </div>

                    {/* Card Premiação */}
                    <InfoCard
                        title="PREMIAÇÃO"
                        icon={Award}
                        color="gold"
                    >
                        <ul className="space-y-4 text-sm">
                            <li className="flex gap-3 items-center">
                                <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center text-accent font-bold shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:animate-pulse">1º</div>
                                <div>
                                    <span className="block font-bold">Geral e Faixa Etária: ambas separadas por sexo</span>
                                </div>
                            </li>
                        </ul>
                        <div className="mt-6 pt-4 border-t text-sm font-bold text-secondary">
                            Cerimônia: 10h00
                        </div>
                    </InfoCard>

                </div>
            </div>
        </section>
    );
};
