'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { isValidImageUrl } from '@/lib/utils';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { Product } from '@/types';

export default function EditProductPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [location, setLocation] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/login');
      return;
    }

    const load = async () => {
      try {
        const res = await fetch(`/api/products?id=${id}`);
        if (!res.ok) throw new Error('Produto não encontrado');
        const data = await res.json();
        setProduct(data);
        setTitle(data.title);
        setDescription(data.description);
        setPrice(String(data.price));
        setLocation(data.location || '');
        let imgs: string[] = [];
        if (Array.isArray(data.images)) {
          imgs = data.images as string[];
        } else if (typeof data.images === 'string') {
          try {
            const parsed = JSON.parse(data.images);
            if (Array.isArray(parsed)) imgs = parsed as string[];
          } catch {}
        }
        setImages(imgs);
      } catch (e) {
        console.error(e);
        alert('Não foi possível carregar o produto.');
        router.push('/my-products');
      } finally {
        setLoading(false);
      }
    };

    if (id) load();
  }, [id, session, status, router]);

  const onFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setNewFiles(prev => [...prev, ...files].slice(0, 5));
  };

  const onRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const uploaded: string[] = [];
      for (const f of newFiles) {
        const { url } = await uploadToCloudinary(f);
        uploaded.push(url);
      }

      const payload = {
        title,
        description,
        price: parseFloat(price),
        location,
        images: [...images, ...uploaded].filter(img => img.startsWith('http')),
      };

      const res = await fetch(`/api/products?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Falha ao atualizar');
      alert('Produto atualizado com sucesso!');
      router.push('/my-products');
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Erro ao atualizar produto';
      alert(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-[#8B6F47] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!product) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F5F1E8] to-[#E8DCC6] p-4">
      <div className="container mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="font-vintage-title text-3xl" style={{ color: '#3C3C3C' }}>Editar Produto</h1>
          <Link href="/my-products" className="vintage-button px-4 py-2">Voltar</Link>
        </div>

        <form onSubmit={onSubmit} className="vintage-card p-6 space-y-4">
          <div>
            <label className="block font-vintage-subtitle text-[#6B4C57] mb-1">Título</label>
            <input className="vintage-input w-full" value={title} onChange={e=>setTitle(e.target.value)} />
          </div>
          <div>
            <label className="block font-vintage-subtitle text-[#6B4C57] mb-1">Descrição</label>
            <textarea className="vintage-input w-full h-28" value={description} onChange={e=>setDescription(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-vintage-subtitle text-[#6B4C57] mb-1">Preço (R$)</label>
              <input type="number" step="0.01" className="vintage-input w-full" value={price} onChange={e=>setPrice(e.target.value)} />
            </div>
            <div>
              <label className="block font-vintage-subtitle text-[#6B4C57] mb-1">Localização</label>
              <input className="vintage-input w-full" value={location} onChange={e=>setLocation(e.target.value)} />
            </div>
          </div>

          <div>
            <label className="block font-vintage-subtitle text-[#6B4C57] mb-2">Imagens</label>
            {images.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                {images.map((src, idx) => (
                  <div key={idx} className="relative">
                    <Image 
                      src={isValidImageUrl(src) ? src : `data:image/svg+xml;charset=UTF-8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160"><rect width="100%" height="100%" fill="#E8DCC6"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#6B4C57" font-size="14" font-family="Arial">Imagem</text></svg>')}`} 
                      alt={`img-${idx}`} 
                      width={160} 
                      height={160} 
                      className="w-full h-32 object-contain rounded" 
                    />
                    <button type="button" onClick={()=>onRemoveImage(idx)} className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center">×</button>
                  </div>
                ))}
              </div>
            )}
            <input type="file" accept="image/*" multiple onChange={onFiles} className="vintage-input w-full" />
          </div>

          <div className="flex justify-end">
            <button type="submit" className="vintage-button px-6 py-3" disabled={submitting}>
              {submitting ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
