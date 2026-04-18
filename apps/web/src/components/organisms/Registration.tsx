import { PricingCard } from "@/components/molecules/pricing-card";
import { Typography } from "@/components/atoms/typography";
import { fetchCategorias } from "@/lib/api";
import type { Categoria } from "@corrida/types";

const FEATURES = [
    "Camiseta do Evento",
    "Medalha de participação",
    "Chip de cronometragem",
    "Hidratação no percurso",
    "Frutas e Isotônico na chegada",
];

function categoriaToPricingCardProps(cat: Categoria) {
    const isPolice = cat.tipo === "POLICIAL";
    return {
        id: cat.id,
        title: cat.nome.toUpperCase(),
        priceAtual: cat.precoAtual,
        type: (isPolice ? "police" : "public") as "police" | "public",
        badge: isPolice ? "LOTE ÚNICO" : undefined,
        subtext: isPolice ? "esta categoria abrange todas as forças policiais" : undefined,
        lotText: isPolice ? "Valor Fixo" : "Lote Ativo",
        features: FEATURES,
        disabled: cat.vagasDisponiveis === 0,
    };
}

export const Registration = async () => {
    const categorias = await fetchCategorias();

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
                    {categorias.map((cat) => {
                        const props = categoriaToPricingCardProps(cat);
                        return (
                            <PricingCard
                                key={props.id}
                                title={props.title}
                                priceAtual={props.priceAtual}
                                type={props.type}
                                badge={props.badge}
                                lotText={props.lotText}
                                subtext={props.subtext}
                                features={props.features}
                                disabled={props.disabled}
                            />
                        );
                    })}
                </div>
            </div>
        </section>
    );
};
