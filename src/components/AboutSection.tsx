import { Code, Gamepad2, Heart } from "lucide-react";

const AboutSection = () => {
  return (
    <section id="about" className="py-24 relative">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="w-20 h-20 mx-auto mb-8 rounded-full bg-primary/20 flex items-center justify-center animate-pulse-glow">
            <Gamepad2 className="w-10 h-10 text-primary" />
          </div>

          <h2 className="font-display text-4xl md:text-5xl font-bold mb-6">
            <span className="text-foreground">SOBRE </span>
            <span className="text-primary text-glow">MIM</span>
          </h2>

          <p className="font-body text-lg text-muted-foreground mb-8 leading-relaxed">
            Sou um desenvolvedor indie apaixonado por criar experiências únicas em jogos. 
            Aqui você encontra todos os meus projetos em desenvolvimento e games finalizados 
            disponíveis para download. Cada jogo é feito com dedicação e muito amor pelo 
            que faço!
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <div className="p-6 bg-card rounded-lg border border-border hover:border-primary/50 transition-all duration-300">
              <Code className="w-8 h-8 text-primary mx-auto mb-4" />
              <h3 className="font-display text-lg font-semibold text-foreground mb-2">
                Desenvolvimento
              </h3>
              <p className="font-body text-sm text-muted-foreground">
                Códigos limpos e mecânicas inovadoras
              </p>
            </div>

            <div className="p-6 bg-card rounded-lg border border-border hover:border-primary/50 transition-all duration-300">
              <Gamepad2 className="w-8 h-8 text-primary mx-auto mb-4" />
              <h3 className="font-display text-lg font-semibold text-foreground mb-2">
                Game Design
              </h3>
              <p className="font-body text-sm text-muted-foreground">
                Jogabilidade fluida e divertida
              </p>
            </div>

            <div className="p-6 bg-card rounded-lg border border-border hover:border-primary/50 transition-all duration-300">
              <Heart className="w-8 h-8 text-primary mx-auto mb-4" />
              <h3 className="font-display text-lg font-semibold text-foreground mb-2">
                Paixão
              </h3>
              <p className="font-body text-sm text-muted-foreground">
                Cada projeto feito com dedicação
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
