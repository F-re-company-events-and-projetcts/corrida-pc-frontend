import { useState } from "react";
import { PricingCard } from "@/components/molecules/pricing-card";
import { Button } from "@/components/atoms/button";
import { X, Check, Info } from "lucide-react";
import { Typography } from "@/components/atoms/typography";

type Modalidade = {
    id: number;
    title: string;
    distance: "4KM" | "10KM";
    priceFull: number;
    priceDiscount: number;
    type: "public" | "police"
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
            title: "CAMINHADA 4KM - CIDADÃO",
            distance: "4KM",
            priceFull: 90.00,
            priceDiscount: 80.00,
            type: "public",
            lotText: "1º Lote",
            features: ["Camiseta do Evento", "Medalha de participação", "Chip de cronometragem", "Hidratação no percurso", "Frutas e Isotônico na chegada"]
        },
        {
            id: 2,
            title: "CAMINHADA 4KM - POLICIAL",
            distance: "4KM",
            priceFull: 80.00,
            priceDiscount: 80.00,
            type: "police",
            badge: "LOTE ÚNICO",
            subtext: "esta categoria abrange todas as forças policiais",
            lotText: "Valor Fixo",
            features: ["Camiseta do Evento", "Medalha de participação", "Chip de cronometragem", "Hidratação no percurso", "Certificado digital", "Frutas e Isotônico na chegada"]
        },
        {
            id: 3,
            title: "CORRIDA 10KM - CIDADÃO",
            distance: "10KM",
            priceFull: 90.00,
            priceDiscount: 80.00,
            type: "public",
            lotText: "1º Lote",
            features: ["Camiseta do Evento", "Medalha de participação", "Chip de cronometragem", "Hidratação no percurso", "Certificado digital", "Frutas e Isotônico na chegada"]
        },
        {
            id: 4,
            title: "CORRIDA 10KM - POLICIAL",
            distance: "10KM",
            priceFull: 80.00,
            priceDiscount: 80.00,
            type: "police",
            badge: "LOTE ÚNICO",
            subtext: "esta categoria abrange todas as forças policiais",
            lotText: "Valor Fixo",
            features: ["Camiseta do Evento", "Medalha de participação", "Chip de cronometragem", "Hidratação no percurso", "Certificado digital", "Frutas e Isotônico na chegada"]
        }
    ];

    const renderModalContent = (modalidade: Modalidade) => (
        <div className="p-8">
            <div className="grid md:grid-cols-2 gap-8 mb-8">
                <div>
                    <h4 className="font-bold text-secondary mb-4 flex items-center gap-2">
                        <Check size={18} className="text-primary" /> Benefícios Inclusos
                    </h4>
                    <ul className="space-y-2 text-sm text-gray-600">
                        {modalidade.features.map((feat, i) => (
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
                            <span className="font-bold text-green-600">1º Lote (EM BREVE)</span>
                        </div>
                        {modalidade.type === 'police' && (
                            <div className="mt-2 text-xs text-orange-600 bg-orange-50 p-2 rounded border border-orange-100">
                                <div className="mb-2">
                                    <span className="font-bold block mb-1">Atenção:</span>
                                    A categoria policial, nesta edição, será destinada a todas as forças policiais de Mato Grosso do Sul, sendo necessária a comprovação de vínculo com a mesma na retirada do kit.
                                </div>
                                <div>
                                    <span className="font-bold block mb-1">Instituições válidas:</span>
                                    PMMS, PCMS, CBMMS, PF, PRF, PPMS     
                                </div> 
                            </div>
                        )}
                        {modalidade.distance === '4KM'  && (
                            <div className="mt-2 text-xs text-orange-600 bg-orange-50 p-2 rounded border border-orange-100">
                                <span className="font-bold block mb-1">Atenção:</span>
                                Nesta categoria, não haverá premiação geral nem por faixas etárias, apenas medalhas para os participantes.
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

            <Button disabled className="w-full text-lg shadow-xl opacity-60 cursor-not-allowed">
                INSCRIÇÕES EM BREVE
            </Button>
        </div>
    );

    return (
        <section id="registration" className="py-20 bg-white">
            <div className="container mx-auto px-6">
                <div className="flex flex-col items-center text-center mb-14">
                    <Typography variant="h2" as="h2" className="font-black mb-4 md:text-4xl ">ESCOLHA SUA MODALIDADE</Typography>
                    <div className="w-24 h-1 bg-primary"></div>
                    <p className="text-gray-500 font-medium">Inscrições abertas de 08/06/2025 até 05/08/2025</p>
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
                            <span className="text-[10px] text-gray-400 uppercase mt-0.5 max-w-30 text-center">Apenas para Cidadão</span>
                        </div>

                        <div className="bg-white p-2 z-10 flex flex-col items-center opacity-70">
                            <div className="w-4 h-4 bg-gray-300 rounded-full"></div>
                            <span className="text-sm font-bold mt-2 text-gray-500">A partir de 20/07</span>
                            <span className="text-xs text-gray-500 font-bold">R$ 90,00</span>
                            <span className="text-[10px] text-gray-400 uppercase mt-0.5 max-w-30 text-center">Apenas para Cidadão</span>
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
                <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/90 backdrop-blur-sm" onClick={closeModal}></div>

                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl relative z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
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

                        {selectedModalidade.type === 'public' ? (
                            <div className="md:grid md:grid-cols-[280px_1fr]">
                                <div className="hidden md:flex flex-col items-center justify-center bg-gray-50 p-6 border-r">
                                    <img
                                        src="/Running.gif"
                                        alt="Animação de corrida"
                                        className="w-full h-auto max-h-90 object-contain"
                                    />
                                    <a
                                        href="https://storyset.com/people"
                                        target="_blank"
                                        rel="noreferrer"
                                        className="mt-4 text-xs text-gray-400 underline"
                                    >
                                        People illustrations by Storyset
                                    </a>
                                </div>
                                {renderModalContent(selectedModalidade)}
                            </div>
                        ) : (
                            renderModalContent(selectedModalidade)
                        )}
                    </div>
                </div>
            )}
        </section>
    );
};
