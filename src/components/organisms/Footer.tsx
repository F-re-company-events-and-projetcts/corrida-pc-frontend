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
                        <div className="text-xs text-gray-400">
                            Parceria técnica: <span className="text-white font-bold">F!ree Solucoes</span>
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
                                <Mail className="w-5 h-5 text-primary" />
                                <span>oficial.firee@gmail.com</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Phone className="w-5 h-5 text-primary" />
                                <span>(67) 99939-7817</span>
                            </li>
                            <li className="flex gap-4 mt-4">
                                <a href="https://www.instagram.com/corridapolicialcivil/" className="bg-white/10 p-2 rounded hover:bg-primary transition-colors"><Instagram size={20} /></a>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-gray-500 gap-4">
                    <p>© 2026 F!ree Solucoes Tecnologicas para Eventos. Todos os direitos reservados.</p>
                    <div className="flex gap-6">
                        <a href="#" className="hover:text-white">Termos de Uso</a>
                        <a href="#" className="hover:text-white">Política de Privacidade</a>
                    </div>
                </div>
            </div>
        </footer>
    );
};
