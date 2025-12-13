import { Button } from "@/components/ui/button";
import { Download, Star, Clock, HardDrive } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface GameDownload {
  id: number;
  title: string;
  description: string;
  thumbnail: string;
  price: number | null; // null = grátis
  size: string;
  releaseDate: string;
  rating: number;
  genre: string;
}

const games: GameDownload[] = [
  {
    id: 1,
    title: "Dungeon Explorer",
    description: "RPG de ação com exploração de masmorras procedurais e sistema de loot épico.",
    thumbnail: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&h=400&fit=crop",
    price: 19.90,
    size: "2.3 GB",
    releaseDate: "2024",
    rating: 4.8,
    genre: "RPG / Ação"
  },
  {
    id: 2,
    title: "Space Runner Demo",
    description: "Demonstração gratuita do novo endless runner espacial. Teste suas habilidades!",
    thumbnail: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=600&h=400&fit=crop",
    price: null,
    size: "450 MB",
    releaseDate: "2024",
    rating: 4.5,
    genre: "Arcade"
  },
  {
    id: 3,
    title: "Pixel Warriors",
    description: "Jogo de luta retrô com gráficos pixel art e combos devastadores.",
    thumbnail: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&h=400&fit=crop",
    price: 14.90,
    size: "800 MB",
    releaseDate: "2023",
    rating: 4.9,
    genre: "Luta"
  },
  {
    id: 4,
    title: "Mini Puzzle Pack",
    description: "Coletânea gratuita de mini jogos de puzzle para exercitar o cérebro.",
    thumbnail: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=600&h=400&fit=crop",
    price: null,
    size: "120 MB",
    releaseDate: "2023",
    rating: 4.2,
    genre: "Puzzle"
  },
];

const DownloadsSection = () => {
  const { toast } = useToast();

  const handleDownload = (game: GameDownload) => {
    if (game.price === null) {
      toast({
        title: "Download iniciado!",
        description: `${game.title} está sendo baixado.`,
      });
    } else {
      toast({
        title: "Redirecionando para pagamento",
        description: `Prepare-se para comprar ${game.title} por R$ ${game.price.toFixed(2)}`,
      });
    }
  };

  return (
    <section id="downloads" className="py-24 relative bg-secondary/30">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_hsl(145_70%_35%_/_0.1)_0%,_transparent_60%)]" />
      
      <div className="container mx-auto px-4 relative">
        <div className="text-center mb-16">
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">
            <span className="text-foreground">BAIXE MEUS </span>
            <span className="text-primary text-glow">GAMES</span>
          </h2>
          <p className="font-body text-lg text-muted-foreground max-w-2xl mx-auto">
            Jogos completos prontos para jogar. Alguns são pagos, outros são totalmente gratuitos!
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {games.map((game, index) => (
            <div
              key={game.id}
              className="group bg-card rounded-lg overflow-hidden border border-border hover:border-primary/50 transition-all duration-300 animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex flex-col sm:flex-row">
                <div className="sm:w-48 h-48 sm:h-auto relative overflow-hidden flex-shrink-0">
                  <img
                    src={game.thumbnail}
                    alt={game.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent to-card sm:block hidden" />
                  
                  {/* Price badge */}
                  <div className="absolute top-3 left-3">
                    {game.price === null ? (
                      <span className="px-3 py-1 bg-primary/90 rounded font-display text-sm font-bold text-primary-foreground box-glow">
                        GRÁTIS
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-accent/90 rounded font-display text-sm font-bold text-accent-foreground box-glow-accent">
                        R$ {game.price.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex-1 p-5 flex flex-col">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <span className="text-xs font-body uppercase tracking-wider text-primary">
                        {game.genre}
                      </span>
                      <h3 className="font-display text-xl font-bold text-foreground">
                        {game.title}
                      </h3>
                    </div>
                    <div className="flex items-center gap-1 text-accent">
                      <Star className="w-4 h-4 fill-current" />
                      <span className="font-body text-sm font-semibold">{game.rating}</span>
                    </div>
                  </div>

                  <p className="font-body text-sm text-muted-foreground mb-4 flex-1">
                    {game.description}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                    <span className="flex items-center gap-1">
                      <HardDrive className="w-3 h-3" /> {game.size}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {game.releaseDate}
                    </span>
                  </div>

                  <Button
                    variant={game.price === null ? "free" : "price"}
                    className="w-full"
                    onClick={() => handleDownload(game)}
                  >
                    <Download className="w-4 h-4" />
                    {game.price === null ? "Download Grátis" : `Comprar - R$ ${game.price.toFixed(2)}`}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default DownloadsSection;
