import { useState, useEffect } from "react";
import { Play, Image as ImageIcon, X, Loader2, Folder, FolderOpen, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Game {
  id: string;
  title: string;
  thumbnail_url?: string | null;
}

interface MediaItem {
  id: string;
  type: "video" | "image";
  title: string;
  url: string;
  thumbnail_url: string | null;
  game_id: string | null;
  created_at: string | null;
  games?: Game | null;
}

interface ProjectFolder {
  game: Game | null;
  items: MediaItem[];
  latestDate: string | null;
}

const GallerySection = () => {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [openFolder, setOpenFolder] = useState<string | null>(null);

  useEffect(() => {
    const fetchGallery = async () => {
      const { data, error } = await supabase
        .from('gallery')
        .select('*, games(id, title, thumbnail_url)')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setMediaItems(data as MediaItem[]);
      }
      setLoading(false);
    };

    fetchGallery();
  }, []);

  const folders = mediaItems.reduce<ProjectFolder[]>((acc, item) => {
    const existingFolder = acc.find(f => 
      (f.game?.id === item.game_id) || (!f.game && !item.game_id)
    );
    
    if (existingFolder) {
      existingFolder.items.push(item);
      // Update latest date if this item is newer
      if (item.created_at && (!existingFolder.latestDate || item.created_at > existingFolder.latestDate)) {
        existingFolder.latestDate = item.created_at;
      }
    } else {
      acc.push({
        game: item.games || null,
        items: [item],
        latestDate: item.created_at
      });
    }
    return acc;
  }, []);

  // Sort folders by latest date (most recent first), with "Outros" always at the end
  const sortedFolders = folders.sort((a, b) => {
    // "Outros" (no game) always goes last
    if (a.game && !b.game) return -1;
    if (!a.game && b.game) return 1;
    
    // Sort by latest date (most recent first)
    const dateA = a.latestDate || '';
    const dateB = b.latestDate || '';
    return dateB.localeCompare(dateA);
  });

  const toggleFolder = (folderId: string) => {
    setOpenFolder(openFolder === folderId ? null : folderId);
  };

  if (loading) {
    return (
      <section id="gallery" className="py-24 relative">
        <div className="container mx-auto px-4 flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </section>
    );
  }

  if (mediaItems.length === 0) {
    return (
      <section id="gallery" className="py-24 relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">
              <span className="text-foreground">GALERIA DE </span>
              <span className="text-primary text-glow">DESENVOLVIMENTO</span>
            </h2>
            <p className="font-body text-lg text-muted-foreground max-w-2xl mx-auto">
              Em breve teremos fotos e vídeos do desenvolvimento dos jogos
            </p>
          </div>
        </div>
      </section>
    );
  }

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

        {/* Project Folders */}
        <div className="space-y-4">
          {sortedFolders.map((folder, folderIndex) => {
            const folderId = folder.game?.id || 'others';
            const isOpen = openFolder === folderId;
            const folderThumbnail = folder.game?.thumbnail_url || folder.items[0]?.thumbnail_url || folder.items[0]?.url;

            return (
              <div 
                key={folderId} 
                className="animate-fade-in"
                style={{ animationDelay: `${folderIndex * 0.1}s` }}
              >
                {/* Folder Header */}
                <button
                  onClick={() => toggleFolder(folderId)}
                  className={`w-full flex items-center gap-4 p-4 rounded-lg border transition-all duration-300 ${
                    isOpen 
                      ? 'bg-primary/10 border-primary' 
                      : 'bg-card border-border hover:border-primary/50 hover:bg-card/80'
                  }`}
                >
                  {/* Folder Thumbnail */}
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    {folderThumbnail ? (
                      <img 
                        src={folderThumbnail} 
                        alt={folder.game?.title || 'Outros'} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        {isOpen ? (
                          <FolderOpen className="w-8 h-8 text-primary" />
                        ) : (
                          <Folder className="w-8 h-8 text-muted-foreground" />
                        )}
                      </div>
                    )}
                  </div>

                  {/* Folder Info */}
                  <div className="flex-1 text-left">
                    <h3 className="font-display text-xl font-bold text-foreground flex items-center gap-2">
                      {isOpen ? (
                        <FolderOpen className="w-5 h-5 text-primary" />
                      ) : (
                        <Folder className="w-5 h-5 text-muted-foreground" />
                      )}
                      {folder.game?.title || 'Outros'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {folder.items.length} {folder.items.length === 1 ? 'item' : 'itens'}
                      {folder.latestDate && (
                        <span className="ml-2 text-muted-foreground/70">
                          • Atualizado em {new Date(folder.latestDate).toLocaleDateString('pt-BR')}
                        </span>
                      )}
                    </p>
                  </div>

                  {/* Arrow */}
                  <ChevronRight 
                    className={`w-5 h-5 text-muted-foreground transition-transform duration-300 ${
                      isOpen ? 'rotate-90' : ''
                    }`}
                  />
                </button>

                {/* Folder Content */}
                {isOpen && (
                  <div className="mt-4 ml-4 pl-4 border-l-2 border-primary/30">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {folder.items.map((item, index) => (
                        <div
                          key={item.id}
                          className="group relative bg-card rounded-lg overflow-hidden border border-border hover:border-primary/50 transition-all duration-300 cursor-pointer animate-fade-in hover:box-glow"
                          style={{ animationDelay: `${index * 0.05}s` }}
                          onClick={() => setSelectedMedia(item)}
                        >
                          <div className="aspect-video relative overflow-hidden">
                            <img
                              src={item.thumbnail_url || item.url}
                              alt={item.title}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent" />
                            
                            {item.type === "video" && (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-12 h-12 rounded-full bg-primary/90 flex items-center justify-center group-hover:scale-110 transition-transform box-glow">
                                  <Play className="w-5 h-5 text-primary-foreground ml-0.5" />
                                </div>
                              </div>
                            )}

                            <div className="absolute top-2 left-2">
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-background/80 rounded text-xs font-body uppercase text-muted-foreground">
                                {item.type === "video" ? (
                                  <>
                                    <Play className="w-2.5 h-2.5" /> Vídeo
                                  </>
                                ) : (
                                  <>
                                    <ImageIcon className="w-2.5 h-2.5" /> Foto
                                  </>
                                )}
                              </span>
                            </div>
                          </div>

                          <div className="p-3">
                            <h3 className="font-display text-sm font-semibold text-foreground line-clamp-1">
                              {item.title}
                            </h3>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
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
                <video
                  src={selectedMedia.url}
                  className="w-full h-full"
                  controls
                  autoPlay
                />
              </div>
            ) : (
              <img
                src={selectedMedia.url}
                alt={selectedMedia.title}
                className="w-full"
              />
            )}

            <div className="p-6">
              <h3 className="font-display text-2xl font-bold text-foreground">
                {selectedMedia.title}
              </h3>
              {selectedMedia.games && (
                <p className="text-primary mt-2 flex items-center gap-2">
                  <Folder className="w-4 h-4" />
                  {selectedMedia.games.title}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default GallerySection;