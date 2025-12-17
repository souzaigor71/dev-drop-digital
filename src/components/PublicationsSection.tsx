import { useState, useEffect } from "react";
import { Loader2, Calendar, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Post {
  id: string;
  title: string;
  content: string;
  thumbnail_url: string | null;
  created_at: string;
}

const PublicationsSection = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setPosts(data);
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post, index) => (
            <article
              key={post.id}
              className="group bg-card rounded-lg overflow-hidden border border-border hover:border-primary/50 transition-all duration-300 animate-fade-in flex flex-col"
              style={{ animationDelay: `${index * 0.1}s` }}
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
                  {truncateContent(post.content)}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PublicationsSection;
