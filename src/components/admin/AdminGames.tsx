import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, Loader2, Upload, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface Game {
  id: string;
  title: string;
  description: string | null;
  price: number;
  is_free: boolean;
  thumbnail_url: string | null;
  file_url: string | null;
  file_size: string | null;
  genre: string | null;
  rating: number;
  downloads: number;
  created_at: string;
}

const AdminGames = () => {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGame, setEditingGame] = useState<Game | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: 0,
    is_free: false,
    thumbnail_url: '',
    file_url: '',
    file_size: '',
    genre: '',
  });

  const fetchGames = async () => {
    const { data, error } = await supabase
      .from('games')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: 'Erro ao carregar games', description: error.message, variant: 'destructive' });
    } else {
      setGames(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchGames();
  }, []);

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      price: 0,
      is_free: false,
      thumbnail_url: '',
      file_url: '',
      file_size: '',
      genre: '',
    });
    setEditingGame(null);
  };

  const openEditDialog = (game: Game) => {
    setEditingGame(game);
    setFormData({
      title: game.title,
      description: game.description || '',
      price: game.price,
      is_free: game.is_free,
      thumbnail_url: game.thumbnail_url || '',
      file_url: game.file_url || '',
      file_size: game.file_size || '',
      genre: game.genre || '',
    });
    setIsDialogOpen(true);
  };

  const handleFileUpload = async (file: File, bucket: 'games' | 'gallery', type: 'thumbnail' | 'file') => {
    const isThumb = type === 'thumbnail';
    isThumb ? setUploadingThumbnail(true) : setUploadingFile(true);

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${type}s/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file);

    if (uploadError) {
      toast({ title: 'Erro no upload', description: uploadError.message, variant: 'destructive' });
      isThumb ? setUploadingThumbnail(false) : setUploadingFile(false);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    isThumb ? setUploadingThumbnail(false) : setUploadingFile(false);
    
    return publicUrl;
  };

  const handleThumbnailChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = await handleFileUpload(file, 'games', 'thumbnail');
    if (url) {
      setFormData(prev => ({ ...prev, thumbnail_url: url }));
    }
  };

  const handleGameFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = await handleFileUpload(file, 'games', 'file');
    if (url) {
      const size = file.size;
      const sizeStr = size > 1024 * 1024 * 1024
        ? `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`
        : size > 1024 * 1024
        ? `${(size / (1024 * 1024)).toFixed(0)} MB`
        : `${(size / 1024).toFixed(0)} KB`;

      setFormData(prev => ({ ...prev, file_url: url, file_size: sizeStr }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const gameData = {
      title: formData.title,
      description: formData.description || null,
      price: formData.is_free ? 0 : formData.price,
      is_free: formData.is_free,
      thumbnail_url: formData.thumbnail_url || null,
      file_url: formData.file_url || null,
      file_size: formData.file_size || null,
      genre: formData.genre || null,
    };

    if (editingGame) {
      const { error } = await supabase
        .from('games')
        .update(gameData)
        .eq('id', editingGame.id);

      if (error) {
        toast({ title: 'Erro ao atualizar', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Game atualizado!' });
        fetchGames();
        setIsDialogOpen(false);
        resetForm();
      }
    } else {
      const { error } = await supabase
        .from('games')
        .insert([gameData]);

      if (error) {
        toast({ title: 'Erro ao criar', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Game criado!' });
        fetchGames();
        setIsDialogOpen(false);
        resetForm();
      }
    }

    setSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este game?')) return;

    const { error } = await supabase
      .from('games')
      .delete()
      .eq('id', id);

    if (error) {
      toast({ title: 'Erro ao excluir', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Game excluído!' });
      fetchGames();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-bold text-foreground">
          Games ({games.length})
        </h2>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button variant="gaming">
              <Plus className="w-4 h-4 mr-2" />
              Novo Game
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-display">
                {editingGame ? 'Editar Game' : 'Novo Game'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Título *</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Gênero</Label>
                  <Input
                    value={formData.genre}
                    onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                    placeholder="Ex: RPG / Ação"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.is_free}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_free: checked })}
                  />
                  <Label>Grátis</Label>
                </div>
                {!formData.is_free && (
                  <div className="flex-1 space-y-2">
                    <Label>Preço (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Thumbnail</Label>
                <div className="flex items-center gap-4">
                  <Button type="button" variant="outline" className="relative" disabled={uploadingThumbnail}>
                    {uploadingThumbnail ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                    Upload Imagem
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleThumbnailChange}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </Button>
                  {formData.thumbnail_url && (
                    <div className="flex items-center gap-2">
                      <img src={formData.thumbnail_url} alt="Thumbnail" className="w-12 h-12 object-cover rounded" />
                      <button type="button" onClick={() => setFormData({ ...formData, thumbnail_url: '' })}>
                        <X className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Arquivo do Game</Label>
                <div className="flex items-center gap-4">
                  <Button type="button" variant="outline" className="relative" disabled={uploadingFile}>
                    {uploadingFile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                    Upload Arquivo
                    <input
                      type="file"
                      onChange={handleGameFileChange}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </Button>
                  {formData.file_url && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>Arquivo: {formData.file_size}</span>
                      <button type="button" onClick={() => setFormData({ ...formData, file_url: '', file_size: '' })}>
                        <X className="w-4 h-4 hover:text-destructive" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" variant="gaming" disabled={submitting}>
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : editingGame ? 'Salvar' : 'Criar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {games.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="font-body">Nenhum game cadastrado ainda.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {games.map((game) => (
            <div key={game.id} className="flex items-center gap-4 p-4 bg-card border border-border rounded-lg">
              {game.thumbnail_url ? (
                <img src={game.thumbnail_url} alt={game.title} className="w-20 h-14 object-cover rounded" />
              ) : (
                <div className="w-20 h-14 bg-secondary rounded flex items-center justify-center text-muted-foreground">
                  ?
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-display font-bold text-foreground truncate">{game.title}</h3>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span>{game.genre || 'Sem gênero'}</span>
                  <span>•</span>
                  <span className={game.is_free ? 'text-primary' : 'text-accent'}>
                    {game.is_free ? 'Grátis' : `R$ ${Number(game.price).toFixed(2)}`}
                  </span>
                  <span>•</span>
                  <span>{game.downloads} downloads</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={() => openEditDialog(game)}>
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => handleDelete(game.id)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminGames;
