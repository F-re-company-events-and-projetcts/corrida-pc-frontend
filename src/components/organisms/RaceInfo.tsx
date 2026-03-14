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
                                    <span className="block font-bold">05, 06 e 07/09/2026</span>
                                    <span className="text-gray-500">14h às 20h</span>
                                </div>
                            </li>
                            <li className="flex items-start gap-3">
                                <MapPin className="w-5 h-5 text-primary shrink-0" />
                                <div>
                                    <span className="block font-bold">Ginásio Municipal de Coxim</span>
                                    <span className="text-gray-500">Centro</span>
                                </div>
                            </li>
                        </ul>
                        <div className="mt-4 text-xs bg-gray-100 p-3 rounded text-gray-600 border-l-4 border-secondary">
                            Apresente documento com foto e comprovante.
                        </div>
                    </InfoCard>

                    {/* Card Dia da Prova */}
                    <div className="bg-white text-gray-900 p-8 rounded-2xl shadow-2xl transform md:-translate-y-4 border-t-8 border-accent">
                        <div className="w-12 h-12 bg-secondary rounded-lg flex items-center justify-center text-white mb-6">
                            <Calendar size={24} />
                        </div>
                        <h3 className="text-xl font-black mb-4">DIA DA PROVA</h3>
                        <div className="text-center bg-gray-50 rounded-xl p-4 mb-4">
                            <div className="text-4xl font-black text-secondary">09</div>
                            <div className="text-sm font-bold uppercase tracking-widest text-gray-500">Setembro 2026</div>
                        </div>
                        <ul className="space-y-3 text-sm">
                            <li className="flex justify-between border-b border-gray-100 pb-2">
                                <span>Concentração</span>
                                <span className="font-bold">06h30</span>
                            </li>
                            <li className="flex justify-between border-b border-gray-100 pb-2">
                                <span>Largada 8km</span>
                                <span className="font-bold text-primary">07h00</span>
                            </li>
                            <li className="flex justify-between">
                                <span>Largada 5km</span>
                                <span className="font-bold text-primary">07h30</span>
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
                            <li className="flex gap-3">
                                <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center text-accent font-bold shrink-0">1º</div>
                                <div>
                                    <span className="block font-bold">Geral (Masc/Fem)</span>
                                    <span className="text-xs text-gray-500">Troféu + Brindes</span>
                                </div>
                            </li>
                            <li className="flex gap-3">
                                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold shrink-0">fx</div>
                                <div>
                                    <span className="block font-bold">Por Faixa Etária</span>
                                    <span className="text-xs text-gray-500">Medalha Especial para 1º lugar</span>
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
