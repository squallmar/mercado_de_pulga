// Signed upload helper for Cloudinary
// Requires NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET

export async function uploadToCloudinary(file: File): Promise<{ url: string; public_id: string }>{
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME as string;
  const folder = process.env.NEXT_PUBLIC_CLOUDINARY_FOLDER || 'produtos';

  if (!cloudName) {
    throw new Error('Cloudinary não configurado. Defina NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME.');
  }

  // Get signature from server
  const signRes = await fetch('/api/cloudinary/sign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ folder })
  });

  if (!signRes.ok) {
    const text = await signRes.text();
    throw new Error(`Falha ao obter assinatura Cloudinary: ${text}`);
  }

  const { apiKey, timestamp, signature } = await signRes.json();

  const formData = new FormData();
  formData.append('file', file);
  formData.append('api_key', apiKey);
  formData.append('timestamp', String(timestamp));
  formData.append('signature', signature);
  if (folder) formData.append('folder', folder);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Falha no upload Cloudinary: ${text}`);
  }

  const data = await res.json();
  return { url: data.secure_url as string, public_id: data.public_id as string };
}
