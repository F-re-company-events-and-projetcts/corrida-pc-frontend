import { CourseCard } from "@/components/molecules/course-card";

export const Routes = () => {
    return (
        <section className="py-20 bg-[#F3F4F6]">
            <div className="container mx-auto px-4">
                <div className="flex flex-col items-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-black text-secondary mb-2 font-heading">CONHEÇA OS PERCURSOS</h2>
                    <div className="w-24 h-1 bg-primary"></div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    {/* Coluna 1: Mapa Ilustrativo */}
                    <div className="bg-white p-4 rounded-2xl shadow-lg relative overflow-hidden group">
                        <div className="aspect-video bg-gray-200 rounded-xl relative overflow-hidden">
                            {/* Mock de Mapa */}
                            <img
                                src="https://images.unsplash.com/photo-1524661135-423995f22d0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
                                alt="Mapa Coxim"
                                className="w-full h-full object-cover opacity-50 grayscale group-hover:grayscale-0 transition-all duration-500"
                            />

                            {/* SVG Overlay das Rotas */}
                            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                                {/* Rota 8km (Azul) */}
                                <path d="M20,80 C30,70 40,80 50,60 C60,40 70,50 80,30" stroke="#1E3A8A" strokeWidth="2" fill="none" className="drop-shadow-md" strokeDasharray="5,5" />
                                {/* Rota 5km (Laranja) */}
                                <path d="M20,80 C30,75 40,70 50,75 C55,80 40,90 20,80" stroke="#F97316" strokeWidth="2" fill="none" className="drop-shadow-md" />

                                {/* Pontos */}
                                <circle cx="20" cy="80" r="2" fill="#FBBF24" /> {/* Largada */}
                                <circle cx="80" cy="30" r="2" fill="#1E3A8A" /> {/* 8km fim */}
                            </svg>

                            <div className="absolute bottom-4 left-4 bg-white/90 p-3 rounded-lg shadow-sm backdrop-blur-sm">
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="w-3 h-3 rounded-full bg-primary"></div>
                                    <span className="text-xs font-bold text-gray-800">5km - Intermediário</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-secondary"></div>
                                    <span className="text-xs font-bold text-gray-800">8km - Avançado</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Coluna 2: Cards */}
                    <div className="space-y-6">
                        <CourseCard
                            title="5 QUILÔMETROS"
                            distance={5}
                            elevation={45}
                            timeLimit="1h30"
                            level="intermediate"
                            color="orange"
                        />
                        <CourseCard
                            title="8 QUILÔMETROS"
                            distance={8}
                            elevation={78}
                            timeLimit="2h00"
                            level="advanced"
                            color="blue"
                        />
                    </div>
                </div>
            </div>
        </section>
    );
};
