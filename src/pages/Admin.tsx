import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Gamepad2, LogOut, Loader2, GamepadIcon, ImageIcon, ShieldAlert, FileText } from 'lucide-react';
import AdminGames from '@/components/admin/AdminGames';
import AdminGallery from '@/components/admin/AdminGallery';
import AdminPosts from '@/components/admin/AdminPosts';

const Admin = () => {
  const { user, isAdmin, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate('/auth');
      } else {
        setChecking(false);
      }
    }
  }, [user, loading, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (loading || checking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <ShieldAlert className="w-16 h-16 text-destructive mx-auto mb-4" />
          <h1 className="font-display text-2xl font-bold text-foreground mb-2">
            Acesso Negado
          </h1>
          <p className="font-body text-muted-foreground mb-6">
            Você não tem permissão de administrador para acessar esta área.
          </p>
          <div className="flex gap-4 justify-center">
            <Button variant="outline" onClick={() => navigate('/')}>
              Voltar ao Site
            </Button>
            <Button variant="gaming" onClick={handleSignOut}>
              Sair
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gamepad2 className="w-6 h-6 text-primary" />
            <span className="font-display text-xl font-bold text-primary">ADMIN</span>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="font-body text-sm text-muted-foreground hidden sm:block">
              {user?.email}
            </span>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline ml-2">Sair</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-foreground">
            Painel de Administração
          </h1>
          <p className="font-body text-muted-foreground mt-1">
            Gerencie seus games e galeria de desenvolvimento
          </p>
        </div>

        <Tabs defaultValue="games" className="space-y-6">
          <TabsList className="bg-card border border-border">
            <TabsTrigger value="games" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <GamepadIcon className="w-4 h-4 mr-2" />
              Games
            </TabsTrigger>
            <TabsTrigger value="gallery" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <ImageIcon className="w-4 h-4 mr-2" />
              Galeria
            </TabsTrigger>
            <TabsTrigger value="posts" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <FileText className="w-4 h-4 mr-2" />
              Publicações
            </TabsTrigger>
          </TabsList>

          <TabsContent value="games">
            <AdminGames />
          </TabsContent>

          <TabsContent value="gallery">
            <AdminGallery />
          </TabsContent>

          <TabsContent value="posts">
            <AdminPosts />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;
