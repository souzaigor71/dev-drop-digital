import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Loader2, FileText, ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

interface Post {
  id: string;
  title: string;
  content: string;
  thumbnail_url: string | null;
  created_at: string;
  updated_at: string;
}

const AdminPosts = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    thumbnail_url: '',
  });

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Erro ao carregar publicações');
      console.error(error);
    } else {
      setPosts(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const resetForm = () => {
    setFormData({ title: '', content: '', thumbnail_url: '' });
    setEditingPost(null);
  };

  const openEditDialog = (post: Post) => {
    setEditingPost(post);
    setFormData({
      title: post.title,
      content: post.content,
      thumbnail_url: post.thumbnail_url || '',
    });
    setIsDialogOpen(true);
  };

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingThumbnail(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `post-${Date.now()}.${fileExt}`;
    const filePath = `posts/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('gallery')
      .upload(filePath, file);

    if (uploadError) {
      toast.error('Erro ao fazer upload da imagem');
      console.error(uploadError);
      setUploadingThumbnail(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('gallery')
      .getPublicUrl(filePath);

    setFormData(prev => ({ ...prev, thumbnail_url: publicUrl }));
    setUploadingThumbnail(false);
    toast.success('Imagem enviada com sucesso');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const postData = {
      title: formData.title,
      content: formData.content,
      thumbnail_url: formData.thumbnail_url || null,
    };

    if (editingPost) {
      const { error } = await supabase
        .from('posts')
        .update(postData)
        .eq('id', editingPost.id);

      if (error) {
        toast.error('Erro ao atualizar publicação');
        console.error(error);
      } else {
        toast.success('Publicação atualizada');
        setIsDialogOpen(false);
        resetForm();
        fetchPosts();
      }
    } else {
      const { error } = await supabase
        .from('posts')
        .insert([postData]);

      if (error) {
        toast.error('Erro ao criar publicação');
        console.error(error);
      } else {
        toast.success('Publicação criada');
        setIsDialogOpen(false);
        resetForm();
        fetchPosts();
      }
    }
    setSubmitting(false);
  };

  const handleDelete = async (postId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta publicação?')) return;

    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId);

    if (error) {
      toast.error('Erro ao excluir publicação');
      console.error(error);
    } else {
      toast.success('Publicação excluída');
      fetchPosts();
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
      <div className="flex justify-between items-center">
        <h2 className="font-display text-xl font-semibold text-foreground">
          Publicações ({posts.length})
        </h2>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button variant="gaming">
              <Plus className="w-4 h-4 mr-2" />
              Nova Publicação
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-display">
                {editingPost ? 'Editar Publicação' : 'Nova Publicação'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Conteúdo</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  rows={10}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Imagem de Capa (opcional)</Label>
                <div className="flex items-center gap-4">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleThumbnailUpload}
                    disabled={uploadingThumbnail}
                  />
                  {uploadingThumbnail && <Loader2 className="w-4 h-4 animate-spin" />}
                </div>
                {formData.thumbnail_url && (
                  <img
                    src={formData.thumbnail_url}
                    alt="Preview"
                    className="w-full h-32 object-cover rounded-lg mt-2"
                  />
                )}
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    resetForm();
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit" variant="gaming" disabled={submitting}>
                  {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {editingPost ? 'Salvar' : 'Criar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {posts.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="font-body text-muted-foreground">
              Nenhuma publicação encontrada
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {posts.map((post) => (
            <Card key={post.id} className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex gap-4">
                  {post.thumbnail_url ? (
                    <img
                      src={post.thumbnail_url}
                      alt={post.title}
                      className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                    />
                  ) : (
                    <div className="w-24 h-24 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                      <ImageIcon className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display font-semibold text-foreground truncate">
                      {post.title}
                    </h3>
                    <p className="font-body text-sm text-muted-foreground line-clamp-2 mt-1">
                      {post.content}
                    </p>
                    <p className="font-body text-xs text-muted-foreground mt-2">
                      {new Date(post.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => openEditDialog(post)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDelete(post.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminPosts;
