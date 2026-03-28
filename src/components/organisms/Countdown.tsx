import { CountdownTimer } from "@/components/molecules/countdown-timer";
import { Typography } from "@/components/atoms/typography";

export const Countdown = () => {
    // Data do evento: 09 de Setembro de 2026
    const eventDate = new Date('2026-09-09T07:00:00').getTime();

    return (
        <section className="py-20 bg-white relative">
            <div className="container mx-auto px-4 text-center">
                <div className="flex flex-col items-center mb-10">
                    <Typography variant="h2" as="h2" className="md:text-4xl font-black mb-2">CONTAGEM REGRESSIVA</Typography>
                    <div className="w-24 h-1 bg-primary"></div>
                </div>

                <CountdownTimer targetDate={eventDate} />

                <p className="mt-8 text-xl text-gray-600 font-medium max-w-2xl mx-auto">
                    Faltam poucos dias para você fazer história nas ruas de <span className="text-secondary font-bold">Coxim</span>
                </p>
            </div>
        </section>
    );
};
