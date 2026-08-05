"use client"

import * as React from "react"
import { Dialog as DialogPrimitive } from "radix-ui"
import { X, Award, Medal, Trophy } from "lucide-react"

interface PremiacaoModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

const FAIXAS = [
    { id: "FX1", label: "16 a 29 anos" },
    { id: "FX2", label: "30 a 39 anos" },
    { id: "FX3", label: "40 a 49 anos" },
    { id: "FX4", label: "50 a 59 anos" },
    { id: "FX5", label: "60 a 64 anos" },
    { id: "FX6", label: "65 anos ou mais" },
]

export const PremiacaoModal = ({ open, onOpenChange }: PremiacaoModalProps) => {
    return (
        <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
            <DialogPrimitive.Portal>
                <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
                <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-50 w-[95vw] max-w-2xl -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
                    <div className="bg-gradient-to-r from-[#F2C12E] to-[#E5A500] px-6 py-5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                <Award size={22} className="text-white" />
                            </div>
                            <DialogPrimitive.Title className="text-xl md:text-2xl font-black uppercase text-white font-heading">
                                Regras de Premiação
                            </DialogPrimitive.Title>
                        </div>
                        <DialogPrimitive.Close className="rounded-full p-1.5 text-white hover:bg-white/20 transition-colors" aria-label="Fechar">
                            <X size={20} />
                        </DialogPrimitive.Close>
                    </div>

                    <div className="px-6 py-6 space-y-6">
                        <div className="flex gap-3 p-4 rounded-lg bg-[#FFF8E1] border-l-4 border-[#F2C12E]">
                            <Medal className="w-6 h-6 text-[#F2C12E] shrink-0 mt-0.5" />
                            <p className="text-sm text-gray-800 leading-relaxed">
                                Todos os atletas que <strong>concluírem a prova</strong> receberão{" "}
                                <strong>medalha de participação</strong>.
                            </p>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <Trophy className="w-5 h-5 text-[#F2C12E]" />
                                <h4 className="font-bold text-gray-900 uppercase text-sm tracking-wide">
                                    Troféus na modalidade corrida
                                </h4>
                            </div>
                            <p className="text-sm text-gray-700 leading-relaxed">
                                Premiação para os <strong>três primeiros colocados</strong> da classificação geral
                                e também por <strong>faixas etárias</strong>, nas categorias{" "}
                                <strong>Cidadão</strong> e <strong>Segurança Pública</strong>, nos naipes{" "}
                                <strong>feminino</strong> e <strong>masculino</strong>.
                            </p>
                            <p className="text-xs text-gray-600 italic border-l-2 border-gray-300 pl-3">
                                Os atletas premiados na classificação geral não participam da premiação por
                                faixa etária.
                            </p>
                        </div>

                        <div className="space-y-3">
                            <h4 className="font-bold text-gray-900 uppercase text-sm tracking-wide">
                                Faixas Etárias
                            </h4>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                {FAIXAS.map((fx) => (
                                    <div
                                        key={fx.id}
                                        className="flex flex-col items-center justify-center p-3 rounded-lg bg-gray-50 border border-gray-200"
                                    >
                                        <span className="text-base font-black text-[#F2C12E]">{fx.id}</span>
                                        <span className="text-xs text-gray-700 text-center">{fx.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end">
                        <DialogPrimitive.Close className="px-5 py-2 rounded-lg bg-gray-900 text-white text-sm font-bold hover:bg-gray-800 transition-colors">
                            Fechar
                        </DialogPrimitive.Close>
                    </div>
                </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    )
}
