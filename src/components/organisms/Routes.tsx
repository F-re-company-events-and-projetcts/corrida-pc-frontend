import { CourseCard } from "@/components/molecules/course-card";
import Script from "next/script";

export const Routes = () => {
    return (
        <section className="py-20 bg-[#F3F4F6]">
            <div className="container mx-auto px-4">
                <div className="flex flex-col items-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-black text-secondary mb-2 font-heading">CONHEÇA OS PERCURSOS</h2>
                    <div className="w-24 h-1 bg-primary"></div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-12 items-start">
                    {/* Coluna 1: Mapa Ilustrativo / Strava */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="bg-white p-2 rounded-2xl shadow-lg relative overflow-hidden group">
                            <h3 className="font-bold text-center py-2 text-secondary">PERCURSO 5KM</h3>
                            <div className="strava-embed-placeholder" data-embed-type="route" data-embed-id="3467602342172181650" data-full-width="true" data-style="standard" data-map-hash="14.01/-18.50665/-54.75162" data-from-embed="true"></div>
                        </div>

                        <div className="bg-white p-2 rounded-2xl shadow-lg relative overflow-hidden group">
                            <h3 className="font-bold text-center py-2 text-secondary">PERCURSO 10KM</h3>
                            <div className="strava-embed-placeholder" data-embed-type="route" data-embed-id="3467601184110314654" data-full-width="true" data-style="standard" data-map-hash="12.73/-18.51407/-54.75009" data-from-embed="true"></div>
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
                            title="10 QUILÔMETROS"
                            distance={10}
                            elevation={78}
                            timeLimit="2h00"
                            level="advanced"
                            color="blue"
                        />
                    </div>
                </div>
            </div>
            <Script src="https://strava-embeds.com/embed.js" strategy="lazyOnload" />
        </section>
    );
};
