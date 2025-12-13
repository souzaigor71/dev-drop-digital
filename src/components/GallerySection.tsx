import { useState } from "react";
import { Play, Image as ImageIcon, X } from "lucide-react";

interface MediaItem {
  id: number;
  type: "video" | "image";
  title: string;
  thumbnail: string;
  videoUrl?: string;
  description: string;
}

const mediaItems: MediaItem[] = [
  {
    id: 1,
    type: "image",
    title: "Conceito Visual - Personagem Principal",
    thumbnail: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&h=400&fit=crop",
    description: "Design do protagonista do novo RPG"
  },
  {
    id: 2,
    type: "video",
    title: "Gameplay Preview - Dungeon Explorer",
    thumbnail: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=600&h=400&fit=crop",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    description: "Primeira demonstração do sistema de combate"
  },
  {
    id: 3,
    type: "image",
    title: "Cenário - Floresta Sombria",
    thumbnail: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=600&h=400&fit=crop",
    description: "Arte conceitual do primeiro level"
  },
  {
    id: 4,
    type: "image",
    title: "UI Design - Menu Principal",
    thumbnail: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&h=400&fit=crop",
    description: "Interface do usuário estilizada"
  },
  {
    id: 5,
    type: "video",
    title: "Devlog #3 - Sistema de Inventário",
    thumbnail: "https://images.unsplash.com/photo-1493711662062-fa541f7f3d24?w=600&h=400&fit=crop",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    description: "Explicação do novo sistema de items"
  },
  {
    id: 6,
    type: "image",
    title: "Boss Design - Dragão de Obsidiana",
    thumbnail: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&h=400&fit=crop",
    description: "Conceito do boss final"
  },
];

const GallerySection = () => {
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);

  return (
    <section id="gallery" className="py-24 relative">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">
            <span className="text-foreground">GALERIA DE </span>
            <span className="text-primary text-glow">DESENVOLVIMENTO</span>
          </h2>
          <p className="font-body text-lg text-muted-foreground max-w-2xl mx-auto">
            Acompanhe o progresso dos meus jogos através de fotos e vídeos exclusivos do desenvolvimento
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mediaItems.map((item, index) => (
            <div
              key={item.id}
              className="group relative bg-card rounded-lg overflow-hidden border border-border hover:border-primary/50 transition-all duration-300 cursor-pointer animate-fade-in hover:box-glow"
              style={{ animationDelay: `${index * 0.1}s` }}
              onClick={() => setSelectedMedia(item)}
            >
              <div className="aspect-video relative overflow-hidden">
                <img
                  src={item.thumbnail}
                  alt={item.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent" />
                
                {item.type === "video" && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-primary/90 flex items-center justify-center group-hover:scale-110 transition-transform box-glow">
                      <Play className="w-7 h-7 text-primary-foreground ml-1" />
                    </div>
                  </div>
                )}

                <div className="absolute top-3 left-3">
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-background/80 rounded text-xs font-body uppercase text-muted-foreground">
                    {item.type === "video" ? (
                      <>
                        <Play className="w-3 h-3" /> Vídeo
                      </>
                    ) : (
                      <>
                        <ImageIcon className="w-3 h-3" /> Foto
                      </>
                    )}
                  </span>
                </div>
              </div>

              <div className="p-4">
                <h3 className="font-display text-lg font-semibold text-foreground mb-1 line-clamp-1">
                  {item.title}
                </h3>
                <p className="font-body text-sm text-muted-foreground line-clamp-2">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {selectedMedia && (
        <div 
          className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedMedia(null)}
        >
          <div 
            className="relative max-w-4xl w-full bg-card rounded-lg border border-border overflow-hidden animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedMedia(null)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-background/80 text-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {selectedMedia.type === "video" ? (
              <div className="aspect-video">
                <iframe
                  src={selectedMedia.videoUrl}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : (
              <img
                src={selectedMedia.thumbnail}
                alt={selectedMedia.title}
                className="w-full"
              />
            )}

            <div className="p-6">
              <h3 className="font-display text-2xl font-bold text-foreground mb-2">
                {selectedMedia.title}
              </h3>
              <p className="font-body text-muted-foreground">
                {selectedMedia.description}
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default GallerySection;
