import { useState, useEffect } from "react";
import { Loader2, Calendar, FileText, Gamepad2, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

interface Game {
  id: string;
  title: string;
}

interface Post {
  id: string;
  title: string;
  content: string;
  thumbnail_url: string | null;
  created_at: string;
  game_id: string | null;
  games?: Game | null;
}

interface GroupedPosts {
  game: Game | null;
  posts: Post[];
}

const PublicationsSection = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [availableProjects, setAvailableProjects] = useState<Game[]>([]);

  useEffect(() => {
    const fetchPosts = async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('*, games(id, title)')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setPosts(data);
        
        // Extract unique projects
        const projects = data
          .filter(post => post.games)
          .map(post => post.games as Game)
          .filter((game, index, self) => 
            self.findIndex(g => g.id === game.id) === index
          );
        setAvailableProjects(projects);
      }
      setLoading(false);
    };

    fetchPosts();
  }, []);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const truncateContent = (content: string, maxLength: number = 150) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength).trim() + '...';
  };

  const renderContentWithLinks = (content: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = content.split(urlRegex);
    
    return parts.map((part, index) => {
      if (urlRegex.test(part)) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline break-all"
            onClick={(e) => e.stopPropagation()}
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  // Filter posts based on selected project
  const filteredPosts = selectedProject
    ? posts.filter(post => post.game_id === selectedProject)
    : posts;

  const groupedPosts = filteredPosts.reduce<GroupedPosts[]>((acc, post) => {
    const existingGroup = acc.find(g => 
      (g.game?.id === post.game_id) || (!g.game && !post.game_id)
    );
    
    if (existingGroup) {
      existingGroup.posts.push(post);
    } else {
      acc.push({
        game: post.games || null,
        posts: [post]
      });
    }
    return acc;
  }, []);

  // Sort: projects with games first, then "Outros" (no project)
  const sortedGroups = groupedPosts.sort((a, b) => {
    if (a.game && !b.game) return -1;
    if (!a.game && b.game) return 1;
    return (a.game?.title || '').localeCompare(b.game?.title || '');
  });

  if (loading) {
    return (
      <section id="publications" className="py-24 relative">
        <div className="container mx-auto px-4 flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </section>
    );
  }

  if (posts.length === 0) {
    return (
      <section id="publications" className="py-24 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_hsl(145_70%_35%_/_0.05)_0%,_transparent_60%)]" />
        <div className="container mx-auto px-4 relative">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">
              <span className="text-foreground">MINHAS </span>
              <span className="text-primary text-glow">PUBLICAÇÕES</span>
            </h2>
            <p className="font-body text-lg text-muted-foreground max-w-2xl mx-auto">
              Em breve teremos publicações disponíveis!
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="publications" className="py-24 relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_hsl(145_70%_35%_/_0.05)_0%,_transparent_60%)]" />
      
      <div className="container mx-auto px-4 relative">
        <div className="text-center mb-16">
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">
            <span className="text-foreground">MINHAS </span>
            <span className="text-primary text-glow">PUBLICAÇÕES</span>
          </h2>
          <p className="font-body text-lg text-muted-foreground max-w-2xl mx-auto">
            Novidades, devlogs e atualizações sobre meus projetos de games
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
                  {group.posts.length} {group.posts.length === 1 ? 'publicação' : 'publicações'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {group.posts.map((post, index) => (
                  <article
                    key={post.id}
                    className="group bg-card rounded-lg overflow-hidden border border-border hover:border-primary/50 transition-all duration-300 animate-fade-in flex flex-col"
                    style={{ animationDelay: `${(groupIndex * 0.1) + (index * 0.05)}s` }}
                  >
                    {post.thumbnail_url ? (
                      <div className="h-48 overflow-hidden">
                        <img
                          src={post.thumbnail_url}
                          alt={post.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      </div>
                    ) : (
                      <div className="h-48 bg-secondary flex items-center justify-center">
                        <FileText className="w-12 h-12 text-muted-foreground" />
                      </div>
                    )}

                    <div className="p-5 flex flex-col flex-1">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(post.created_at)}</span>
                      </div>

                      <h3 className="font-display text-lg font-bold text-foreground mb-3 group-hover:text-primary transition-colors">
                        {post.title}
                      </h3>

                      <p className="font-body text-sm text-muted-foreground flex-1">
                        {renderContentWithLinks(truncateContent(post.content))}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ))}
        </div>

        {filteredPosts.length === 0 && selectedProject && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Nenhuma publicação encontrada para este projeto.</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedProject(null)}
              className="mt-4"
            >
              Ver todas
            </Button>
          </div>
        )}
      </div>
    </section>
  );
};

export default PublicationsSection;