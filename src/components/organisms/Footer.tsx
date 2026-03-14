import { Shield, Mail, Phone, Instagram, Facebook } from "lucide-react";

export const Footer = () => {
    return (
        <footer className="bg-secondary text-white pt-16 pb-8 border-t border-white/10">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">

                    {/* Sobre */}
                    <div>
                        <div className="flex items-center gap-2 mb-6">
                            <Shield className="w-6 h-6 text-accent" />
                            <span className="font-bold text-lg">2ª CORRIDA PC</span>
                        </div>
                        <p className="text-gray-300 text-sm leading-relaxed mb-6">
                            Evento oficial organizado pela Polícia Civil de Mato Grosso do Sul, promovendo saúde, integração e espírito esportivo nas ruas de Coxim.
                        </p>
                        <div className="text-xs text-gray-400">
                            Parceria técnica: <span className="text-white font-bold">F!re Eventos Esportivos</span>
                        </div>
                    </div>

                    {/* Links Rápidos */}
                    <div>
                        <h4 className="font-bold text-accent mb-6 tracking-wide">LINKS RÁPIDOS</h4>
                        <ul className="space-y-3 text-sm text-gray-300">
                            {['Regulamento Oficial', 'Política de Reembolso', 'Dúvidas Frequentes (FAQ)', 'Fale Conosco', 'Área de Inscritos'].map(link => (
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
                                <span>contato@corridapc.com.br</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Phone className="w-5 h-5 text-primary" />
                                <span>(67) 99999-9999</span>
                            </li>
                            <li className="flex gap-4 mt-4">
                                <a href="#" className="bg-white/10 p-2 rounded hover:bg-primary transition-colors"><Instagram size={20} /></a>
                                <a href="#" className="bg-white/10 p-2 rounded hover:bg-secondary bg-[#1877F2] transition-colors"><Facebook size={20} /></a>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-gray-500 gap-4">
                    <p>© 2026 F!re Eventos Esportivos. Todos os direitos reservados.</p>
                    <div className="flex gap-6">
                        <a href="#" className="hover:text-white">Termos de Uso</a>
                        <a href="#" className="hover:text-white">Política de Privacidade</a>
                    </div>
                </div>
            </div>
        </footer>
    );
};
