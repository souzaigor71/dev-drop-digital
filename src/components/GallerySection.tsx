import { useState, useEffect } from "react";
import { Play, Image as ImageIcon, X, Loader2, Gamepad2, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

interface Game {
  id: string;
  title: string;
}

interface MediaItem {
  id: string;
  type: "video" | "image";
  title: string;
  url: string;
  thumbnail_url: string | null;
  game_id: string | null;
  games?: Game | null;
}

interface GroupedMedia {
  game: Game | null;
  items: MediaItem[];
}

const GallerySection = () => {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [availableProjects, setAvailableProjects] = useState<Game[]>([]);

  useEffect(() => {
    const fetchGallery = async () => {
      const { data, error } = await supabase
        .from('gallery')
        .select('*, games(id, title)')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setMediaItems(data as MediaItem[]);
        
        // Extract unique projects
        const projects = data
          .filter(item => item.games)
          .map(item => item.games as Game)
          .filter((game, index, self) => 
            self.findIndex(g => g.id === game.id) === index
          );
        setAvailableProjects(projects);
      }
      setLoading(false);
    };

    fetchGallery();
  }, []);

  // Filter items based on selected project
  const filteredItems = selectedProject
    ? mediaItems.filter(item => item.game_id === selectedProject)
    : mediaItems;

  const groupedMedia = filteredItems.reduce<GroupedMedia[]>((acc, item) => {
    const existingGroup = acc.find(g => 
      (g.game?.id === item.game_id) || (!g.game && !item.game_id)
    );
    
    if (existingGroup) {
      existingGroup.items.push(item);
    } else {
      acc.push({
        game: item.games || null,
        items: [item]
      });
    }
    return acc;
  }, []);

  // Sort: projects with games first, then "Outros" (no project)
  const sortedGroups = groupedMedia.sort((a, b) => {
    if (a.game && !b.game) return -1;
    if (!a.game && b.game) return 1;
    return (a.game?.title || '').localeCompare(b.game?.title || '');
  });

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

        {/* Project Filter */}
        {availableProjects.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-2 mb-12">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Button
              variant={selectedProject === null ? "gaming" : "outline"}
              size="sm"
              onClick={() => setSelectedProject(null)}
              className="rounded-full"
            >
              Todos
            </Button>
            {availableProjects.map((project) => (
              <Button
                key={project.id}
                variant={selectedProject === project.id ? "gaming" : "outline"}
                size="sm"
                onClick={() => setSelectedProject(project.id)}
                className="rounded-full"
              >
                <Gamepad2 className="w-3 h-3 mr-1" />
                {project.title}
              </Button>
            ))}
          </div>
        )}

        <div className="space-y-12">
          {sortedGroups.map((group, groupIndex) => (
            <div key={group.game?.id || 'no-project'} className="animate-fade-in" style={{ animationDelay: `${groupIndex * 0.1}s` }}>
              <div className="flex items-center gap-3 mb-6">
                <Gamepad2 className="w-6 h-6 text-primary" />
                <h3 className="font-display text-2xl font-bold text-foreground">
                  {group.game?.title || 'Outros'}
                </h3>
                <span className="px-2 py-1 bg-primary/10 text-primary rounded text-sm">
                  {group.items.length} {group.items.length === 1 ? 'item' : 'itens'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {group.items.map((item, index) => (
                  <div
                    key={item.id}
                    className="group relative bg-card rounded-lg overflow-hidden border border-border hover:border-primary/50 transition-all duration-300 cursor-pointer animate-fade-in hover:box-glow"
                    style={{ animationDelay: `${(groupIndex * 0.1) + (index * 0.05)}s` }}
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
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {filteredItems.length === 0 && selectedProject && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Nenhum item encontrado para este projeto.</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedProject(null)}
              className="mt-4"
            >
              Ver todos
            </Button>
          </div>
        )}
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
                  <Gamepad2 className="w-4 h-4" />
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