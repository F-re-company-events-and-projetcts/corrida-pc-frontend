import React from "react";

export const HistoryGallery = () => {
    // Array of Unsplash image URLs for the gallery placeholder
    const photos = [
        "https://images.unsplash.com/photo-1552674605-469523170d73?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1571008887538-b36bb32f4571?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1530549387789-4c1017266635?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1461896836934-ffe607fa8211?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1526676037777-05a232554f77?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    ];

    return (
        <section id="galeria" className="py-24 bg-[#F2F2F2]">
            <div className="container mx-auto px-4">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-black text-[#F25D27] mb-4 font-heading uppercase tracking-tight">
                        Venha fazer parte dessa história
                    </h2>
                    <div className="w-24 h-1 bg-[#F24E29] mx-auto rounded-full"></div>
                    <p className="mt-4 text-gray-500 font-medium max-w-2xl mx-auto">
                        Relembre os melhores momentos das edições passadas e prepare-se para o que vem por aí.
                    </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                    {photos.map((photo, index) => (
                        <div 
                            key={index} 
                            className="relative group overflow-hidden rounded-2xl aspect-square md:aspect-video shadow-md hover:shadow-xl transition-all duration-300"
                        >
                            <img 
                                src={photo} 
                                alt={`Galeria 2025 - Foto ${index + 1}`} 
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                loading="lazy"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-start p-6">
                                <span className="text-white font-bold text-lg drop-shadow-md">Edição 2025</span>
                            </div>
                        </div>
                    ))}
                </div>
                
                <div className="mt-12 text-center">
                    <a 
                        href="#" 
                        className="inline-block px-8 py-3 rounded-full border-2 border-[#F25D27] text-[#F25D27] font-bold hover:bg-[#F25D27] hover:text-white transition-colors duration-300"
                    >
                        VER GALERIA COMPLETA
                    </a>
                </div>
            </div>
        </section>
    );
};
