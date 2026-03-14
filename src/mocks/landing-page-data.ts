export const RACE_DATE = "2026-09-27T07:00:00";
export const POLICE_DISCOUNT = 0.20; // 20% discount

export const ROUTES = [
    {
        distance: "5KM",
        name: "CIDADÃO",
        description: "Percurso plano e rápido, ideal para iniciantes e para quem busca recorde pessoal.",
        features: ["Camiseta Poliamida", "Medalha Finisher", "Chip de Cronometragem", "Hidratação"],
    },
    {
        distance: "8KM",
        name: "POLICIAL CIVIL",
        description: "Desafio técnico para testar sua resistência. Percurso misto com leve altimetria.",
        features: ["Camiseta Poliamida", "Medalha Finisher", "Chip de Cronometragem", "Hidratação", "Largada Preferencial"],
    }
];

export const LOTS = [
    {
        id: 1,
        name: "LOTE PROMOCIONAL",
        price: 69.90,
        deadline: "2026-06-09T23:59:59",
        soldOut: true
    },
    {
        id: 2,
        name: "1º LOTE",
        price: 89.90,
        deadline: "2026-07-31T23:59:59",
        soldOut: false
    },
    {
        id: 3,
        name: "2º LOTE",
        price: 109.90,
        deadline: "2026-09-15T23:59:59",
        soldOut: false
    }
];
