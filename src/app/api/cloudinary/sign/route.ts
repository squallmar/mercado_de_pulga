import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const { folder } = await req.json().catch(() => ({}));
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      return NextResponse.json({ error: 'Cloudinary não configurado' }, { status: 500 });
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const params = new URLSearchParams();
    if (folder) params.append('folder', folder);
    params.append('timestamp', String(timestamp));

    // signature = sha1(sorted_params + api_secret)
    const toSign = Array.from(params.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join('&');

    const signature = crypto.createHash('sha1').update(toSign + apiSecret).digest('hex');

    return NextResponse.json({
      cloudName,
      apiKey,
      timestamp,
      folder,
      signature,
    });
  } catch (err) {
    console.error('Cloudinary sign error:', err);
    return NextResponse.json({ error: 'Erro ao gerar assinatura' }, { status: 500 });
  }
}
