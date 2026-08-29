import { NextRequest, NextResponse } from 'next/server';
import { cloudinaryService } from '@/lib/services/cloudinary';
import { getAuthenticatedAdmin } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const admin = await getAuthenticatedAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized', message: 'Admin authentication required.' }, { status: 401 });
  }

  try {
    const { dataUrl, filename, folder } = await req.json();
    if (!dataUrl || !dataUrl.includes(',')) {
      return NextResponse.json({ error: 'InvalidDataUrl', message: 'Image base64 data required.' }, { status: 400 });
    }

    const result = await cloudinaryService.uploadBase64(
      dataUrl,
      filename || 'upload',
      folder || 'the-abstract-take/uploads'
    );

    return NextResponse.json({
      success: true,
      url: result.url,
      publicId: result.publicId,
      filename: result.filename,
      provider: result.provider,
    });
  } catch (err: any) {
    console.error('Upload route error:', err);
    return NextResponse.json({ error: 'UploadFailed', message: err.message }, { status: 500 });
  }
}
