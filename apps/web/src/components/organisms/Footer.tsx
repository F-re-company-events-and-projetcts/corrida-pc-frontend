import { Shield, Mail, Phone, Instagram } from "lucide-react";

export const Footer = () => {
    return (
        <footer className="bg-[#F24E29] text-white pt-16 pb-8 border-t border-white/10">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">

                    {/* Sobre */}
                    <div>
                        <div className="flex items-center gap-2 mb-6">
                            <Shield className="w-6 h-6 text-accent" />
                            <span className="font-bold text-lg">2ª CORRIDA DO POLICIAL CIVIL</span>
                        </div>
                        <p className="text-gray-300 text-sm leading-relaxed mb-6">
                            Evento oficial promovido pelo SINPOL do Mato Grosso do Sul, e organizado por F!ree, promovendo saúde, integração e espírito esportivo nas ruas de Coxim.
                        </p>
                        <div className="text-xs text-white/70">
                            <p className="leading-relaxed">
                                Parceria técnica: <span className="text-white font-bold">F!ree Soluções • Gustavo Encinas</span>
                            </p>
                            <a
                                href="https://linktr.ee/dev.gustavo.encinas"
                                className="mt-3 inline-flex w-full items-center justify-center rounded-md bg-white/10 px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-white/90 transition-colors hover:bg-white/15 hover:text-white md:w-auto"
                            >
                                Vamos construir algo juntos?
                            </a>
                        </div>
                    </div>

                    {/* Links Rápidos */}
                    <div>
                        <h4 className="font-bold text-accent mb-6 tracking-wide">LINKS RÁPIDOS</h4>
                        <ul className="space-y-3 text-sm text-gray-300">
                            {['Regulamento Oficial',  'Fale Conosco', 'Venda de Fotos 2025'].map(link => (
                                <li key={link}>
                                    <a href="#" className="hover:text-white hover:translate-x-1 transition-all inline-block">{link}</a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Contato */}
                    <div>
                        <h4 className="font-bold text-accent mb-6 tracking-wide">FALE CONOSCO</h4>
                        <ul className="space-y-4 text-sm text-gray-300">
                            <li className="flex items-center gap-3">
                                <Mail className="w-5 h-5 opacity-70" />
                                <span>oficial.firee@gmail.com</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Phone className="w-5 h-5 opacity-70" />
                                <span>(67) 99939-7817</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Instagram href="https://www.instagram.com/corridapolicialcivil/" className="w-5 h-5 opacity-70"/>
                                <a href="https://www.instagram.com/corridapolicialcivil/" className="hover:text-white hover:translate-x-1 transition-all inline-block">
                                    @corridapolicialcivil
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center text-xs gap-4">
                    <p>© 2026 F!ree Soluções Tecnologicas para Eventos. Todos os direitos reservados.</p>
                    <div className="flex gap-6">
                        <a href="#" className="hover:text-white">Termos de Uso</a>
                        <a href="#" className="hover:text-white">Política de Privacidade</a>
                    </div>
                </div>
            </div>
        </footer>
    );
};
