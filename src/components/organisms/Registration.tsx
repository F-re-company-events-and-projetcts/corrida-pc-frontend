import { useState } from "react";
import { PricingCard } from "@/components/molecules/pricing-card";
import { Button } from "@/components/atoms/button";
import { X, Check, Info, AlertCircle } from "lucide-react";

type Modalidade = {
    id: number;
    title: string;
    distance: string;
    priceFull: number;
    priceDiscount: number;
    type: "public" | "police";
    badge?: string;
    lotText?: string;
    subtext?: string;
    features: string[];
};

export const Registration = () => {
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedModalidade, setSelectedModalidade] = useState<Modalidade | null>(null);

    const openModal = (modalidade: Modalidade) => {
        setSelectedModalidade(modalidade);
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setSelectedModalidade(null);
    };

    const modalidades: Modalidade[] = [
        {
            id: 1,
            title: "5KM - CIDADÃO",
            distance: "5KM",
            priceFull: 90.00,
            priceDiscount: 80.00,
            type: "public",
            lotText: "1º Lote",
            features: ["Camiseta técnica personalizada", "Medalha de participação", "Chip de cronometragem", "Hidratação no percurso", "Certificado digital"]
        },
        {
            id: 2,
            title: "5KM - POLICIAL",
            distance: "5KM",
            priceFull: 80.00,
            priceDiscount: 80.00,
            type: "police",
            badge: "LOTE ÚNICO",
            subtext: "esta categoria abrange todas as forças policiais",
            lotText: "Valor Fixo",
            features: ["Camiseta técnica personalizada", "Medalha de participação", "Chip de cronometragem", "Hidratação no percurso", "Certificado digital"]
        },
        {
            id: 3,
            title: "10KM - CIDADÃO",
            distance: "10KM",
            priceFull: 90.00,
            priceDiscount: 80.00,
            type: "public",
            lotText: "1º Lote",
            features: ["Camiseta técnica personalizada", "Medalha de participação", "Chip de cronometragem", "Hidratação no percurso", "Certificado digital"]
        },
        {
            id: 4,
            title: "10KM - POLICIAL",
            distance: "10KM",
            priceFull: 80.00,
            priceDiscount: 80.00,
            type: "police",
            badge: "LOTE ÚNICO",
            subtext: "esta categoria abrange todas as forças policiais",
            lotText: "Valor Fixo",
            features: ["Camiseta técnica personalizada", "Medalha de participação", "Chip de cronometragem", "Hidratação no percurso", "Certificado digital"]
        }
    ];

    return (
        <section className="py-20 bg-white">
            <div className="container mx-auto px-4">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-black text-secondary mb-4 font-heading">ESCOLHA SUA MODALIDADE</h2>
                    <p className="text-gray-500 font-medium">Inscrições abertas de 08/06/2025 até 01/08/2025</p>
                </div>

                {/* Timeline de Lotes */}
                <div className="max-w-4xl mx-auto mb-16">
                    <div className="flex flex-col md:flex-row justify-between items-center relative">
                        {/* Linha de conexão (Desktop) */}
                        <div className="hidden md:block absolute top-1/2 left-0 w-full h-1 bg-gray-200 -z-10"></div>

                        <div className="bg-white p-2 z-10 flex flex-col items-center">
                            <div className="w-32 bg-primary text-white py-1 px-3 rounded-full text-xs font-bold text-center mb-2 shadow-lg">
                                ATUAL: 1º LOTE
                            </div>
                            <div className="w-4 h-4 bg-primary rounded-full ring-4 ring-orange-100"></div>
                            <span className="text-sm font-bold mt-2 text-primary">Até 29/06</span>
                            <span className="text-xs text-gray-500 font-bold">R$ 80,00</span>
                        </div>

                        <div className="bg-white p-2 z-10 flex flex-col items-center opacity-70">
                            <div className="w-4 h-4 bg-gray-300 rounded-full"></div>
                            <span className="text-sm font-bold mt-2 text-gray-500">30/06 a 19/07</span>
                            <span className="text-xs text-gray-500 font-bold">R$ 85,00</span>
                            <span className="text-[10px] text-gray-400 uppercase mt-0.5 max-w-[120px] text-center">Apenas para Cidadão</span>
                        </div>

                        <div className="bg-white p-2 z-10 flex flex-col items-center opacity-70">
                            <div className="w-4 h-4 bg-gray-300 rounded-full"></div>
                            <span className="text-sm font-bold mt-2 text-gray-500">A partir de 20/07</span>
                            <span className="text-xs text-gray-500 font-bold">R$ 90,00</span>
                            <span className="text-[10px] text-gray-400 uppercase mt-0.5 max-w-[120px] text-center">Apenas para Cidadão</span>
                        </div>
                    </div>
                </div>

                {/* Grid Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {modalidades.map((item) => (
                        <PricingCard
                            key={item.id}
                            title={item.title}
                            priceFull={item.priceFull}
                            priceDiscount={item.priceDiscount}
                            type={item.type}
                            badge={item.badge}
                            lotText={item.lotText}
                            subtext={item.subtext}
                            features={item.features}
                            onSelect={() => openModal(item)}
                        />
                    ))}
                </div>
            </div>

            {/* --- MODAL DE INSCRIÇÃO --- */}
            {modalOpen && selectedModalidade && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/90 backdrop-blur-sm" onClick={closeModal}></div>

                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl relative z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
                        <button
                            onClick={closeModal}
                            className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-red-100 hover:text-red-500 transition-colors"
                        >
                            <X size={20} />
                        </button>

                        <div className={`p-6 text-white ${selectedModalidade.type === 'police' ? 'bg-secondary' : 'bg-primary'}`}>
                            <span className="text-xs font-bold uppercase tracking-wider opacity-80 mb-1 block">Você selecionou</span>
                            <h3 className="text-2xl font-black font-heading">{selectedModalidade.title}</h3>
                            <div className="flex items-baseline gap-2 mt-2">
                                <span className="text-3xl font-bold">R$ {selectedModalidade.priceDiscount.toFixed(2)}</span>
                                <span className="opacity-70 text-sm">+ taxas do site</span>
                            </div>
                        </div>

                        <div className="p-8">
                            <div className="grid md:grid-cols-2 gap-8 mb-8">
                                <div>
                                    <h4 className="font-bold text-secondary mb-4 flex items-center gap-2">
                                        <Check size={18} className="text-primary" /> Benefícios Inclusos
                                    </h4>
                                    <ul className="space-y-2 text-sm text-gray-600">
                                        {selectedModalidade.features.map((feat, i) => (
                                            <li key={i} className="flex gap-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-gray-300 mt-1.5 shrink-0"></span>
                                                {feat}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div>
                                    <h4 className="font-bold text-secondary mb-4 flex items-center gap-2">
                                        <Info size={18} className="text-primary" /> Detalhes
                                    </h4>
                                    <div className="bg-gray-50 p-4 rounded-lg text-sm space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Idade Mínima:</span>
                                            <span className="font-bold">15 anos</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Lote Atual:</span>
                                            <span className="font-bold text-green-600">1º Lote (Aberto)</span>
                                        </div>
                                        {selectedModalidade.type === 'police' && (
                                            <div className="mt-2 text-xs text-orange-600 bg-orange-50 p-2 rounded border border-orange-100">
                                                Obrigatória apresentação de comprovação na retirada do kit.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="mb-6">
                                <label className="flex items-start gap-3 cursor-pointer p-3 rounded hover:bg-gray-50 transition-colors">
                                    <input type="checkbox" className="mt-1 w-5 h-5 text-primary rounded border-gray-300 focus:ring-primary" />
                                    <span className="text-sm text-gray-600">
                                        Declaro que li e concordo com o <a href="#" className="text-secondary underline font-bold">regulamento da prova</a> e que estou apto fisicamente para participar do evento.
                                    </span>
                                </label>
                            </div>

                            <Button className="w-full text-lg shadow-xl" onClick={() => alert('Redirecionando para plataforma de pagamento...')}>
                                CONTINUAR PARA PAGAMENTO
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
};
