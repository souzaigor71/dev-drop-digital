import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, Loader2, Upload, X, Image, Video } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Game {
  id: string;
  title: string;
}

interface GalleryItem {
  id: string;
  title: string;
  type: string;
  url: string;
  thumbnail_url: string | null;
  created_at: string;
  game_id: string | null;
  games?: Game | null;
}

const AdminGallery = () => {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<GalleryItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: '',
    type: 'image' as 'image' | 'video',
    url: '',
    thumbnail_url: '',
    game_id: '' as string,
  });

  const fetchItems = async () => {
    const { data, error } = await supabase
      .from('gallery')
      .select('*, games(id, title)')
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: 'Erro ao carregar galeria', description: error.message, variant: 'destructive' });
    } else {
      setItems(data || []);
    }
    setLoading(false);
  };

  const fetchGames = async () => {
    const { data } = await supabase
      .from('games')
      .select('id, title')
      .order('title');
    if (data) setGames(data);
  };

  useEffect(() => {
    fetchItems();
    fetchGames();
  }, []);

  const resetForm = () => {
    setFormData({
      title: '',
      type: 'image',
      url: '',
      thumbnail_url: '',
      game_id: '',
    });
    setEditingItem(null);
  };

  const openEditDialog = (item: GalleryItem) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      type: item.type as 'image' | 'video',
      url: item.url,
      thumbnail_url: item.thumbnail_url || '',
      game_id: item.game_id || '',
    });
    setIsDialogOpen(true);
  };

  const handleFileUpload = async (file: File) => {
    setUploading(true);

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('gallery')
      .upload(fileName, file);

    if (uploadError) {
      toast({ title: 'Erro no upload', description: uploadError.message, variant: 'destructive' });
      setUploading(false);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('gallery')
      .getPublicUrl(fileName);

    setUploading(false);
    return publicUrl;
  };

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = await handleFileUpload(file);
    if (url) {
      const isVideo = file.type.startsWith('video/');
      setFormData(prev => ({
        ...prev,
        url,
        type: isVideo ? 'video' : 'image',
        thumbnail_url: isVideo ? prev.thumbnail_url : url,
      }));
    }
  };

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = await handleFileUpload(file);
    if (url) {
      setFormData(prev => ({ ...prev, thumbnail_url: url }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const itemData = {
      title: formData.title,
      type: formData.type,
      url: formData.url,
      thumbnail_url: formData.thumbnail_url || formData.url,
      game_id: formData.game_id || null,
    };

    if (editingItem) {
      const { error } = await supabase
        .from('gallery')
        .update(itemData)
        .eq('id', editingItem.id);

      if (error) {
        toast({ title: 'Erro ao atualizar', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Item atualizado!' });
        fetchItems();
        setIsDialogOpen(false);
        resetForm();
      }
    } else {
      const { error } = await supabase
        .from('gallery')
        .insert([itemData]);

      if (error) {
        toast({ title: 'Erro ao criar', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Item criado!' });
        fetchItems();
        setIsDialogOpen(false);
        resetForm();
      }
    }

    setSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este item?')) return;

    const { error } = await supabase
      .from('gallery')
      .delete()
      .eq('id', id);

    if (error) {
      toast({ title: 'Erro ao excluir', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Item excluído!' });
      fetchItems();
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
          Galeria ({items.length})
        </h2>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button variant="gaming">
              <Plus className="w-4 h-4 mr-2" />
              Novo Item
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-display">
                {editingItem ? 'Editar Item' : 'Novo Item'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Título *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: 'image' | 'video') => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="image">
                      <div className="flex items-center gap-2">
                        <Image className="w-4 h-4" /> Imagem
                      </div>
                    </SelectItem>
                    <SelectItem value="video">
                      <div className="flex items-center gap-2">
                        <Video className="w-4 h-4" /> Vídeo
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Projeto (opcional)</Label>
                <Select
                  value={formData.game_id}
                  onValueChange={(value) => setFormData({ ...formData, game_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um projeto" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Nenhum projeto</SelectItem>
                    {games.map((game) => (
                      <SelectItem key={game.id} value={game.id}>
                        {game.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Arquivo {formData.type === 'video' ? '(Vídeo)' : '(Imagem)'}</Label>
                <div className="flex items-center gap-4">
                  <Button type="button" variant="outline" className="relative" disabled={uploading}>
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                    Upload
                    <input
                      type="file"
                      accept={formData.type === 'video' ? 'video/*' : 'image/*'}
                      onChange={handleMediaUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </Button>
                  {formData.url && (
                    <div className="flex items-center gap-2">
                      {formData.type === 'image' ? (
                        <img src={formData.url} alt="Preview" className="w-12 h-12 object-cover rounded" />
                      ) : (
                        <div className="w-12 h-12 bg-secondary rounded flex items-center justify-center">
                          <Video className="w-6 h-6 text-muted-foreground" />
                        </div>
                      )}
                      <button type="button" onClick={() => setFormData({ ...formData, url: '' })}>
                        <X className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                      </button>
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Ou cole uma URL diretamente:
                </p>
                <Input
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              {formData.type === 'video' && (
                <div className="space-y-2">
                  <Label>Thumbnail do Vídeo</Label>
                  <div className="flex items-center gap-4">
                    <Button type="button" variant="outline" className="relative" disabled={uploading}>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleThumbnailUpload}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                    </Button>
                    {formData.thumbnail_url && (
                      <div className="flex items-center gap-2">
                        <img src={formData.thumbnail_url} alt="Thumb" className="w-12 h-12 object-cover rounded" />
                        <button type="button" onClick={() => setFormData({ ...formData, thumbnail_url: '' })}>
                          <X className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" variant="gaming" disabled={submitting || !formData.url}>
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : editingItem ? 'Salvar' : 'Criar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="font-body">Nenhum item na galeria ainda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((item) => (
            <div key={item.id} className="group relative bg-card border border-border rounded-lg overflow-hidden">
              <div className="aspect-video relative">
                <img
                  src={item.thumbnail_url || item.url}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 left-2">
                  <span className="px-2 py-1 bg-background/80 rounded text-xs flex items-center gap-1">
                    {item.type === 'video' ? <Video className="w-3 h-3" /> : <Image className="w-3 h-3" />}
                    {item.type === 'video' ? 'Vídeo' : 'Foto'}
                  </span>
                </div>
                <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button variant="outline" size="icon" onClick={() => openEditDialog(item)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => handleDelete(item.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
              <div className="p-2">
                <p className="text-sm font-body truncate">{item.title}</p>
                {item.games && (
                  <p className="text-xs text-primary truncate">{item.games.title}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminGallery;
