import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { fileTypeFromBuffer } from 'file-type';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const image = formData.get('image') as File;
    const userId = formData.get('userId') as string;
    const filePath = formData.get('path') as string;
    
    if (!image || !userId || !filePath) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate image type by reading the file buffer
    const buffer = Buffer.from(await image.arrayBuffer());
    const fileType = await fileTypeFromBuffer(buffer);
    
    if (!fileType || !fileType.mime.startsWith('image/')) {
      return NextResponse.json(
        { success: false, message: 'Invalid file type. Only images are allowed.' },
        { status: 400 }
      );
    }

    // Create directory if it doesn't exist
    const publicDir = path.join(process.cwd(), 'public');
    const targetDir = path.join(publicDir, 'images', 'profile-pictures');
    
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // Write the file to disk
    const targetPath = path.join(publicDir, filePath);
    fs.writeFileSync(targetPath, buffer);

    return NextResponse.json({ 
      success: true, 
      message: 'Image uploaded successfully',
      path: filePath 
    });
  } catch (error: any) {
    console.error('Error uploading image:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'An error occurred while uploading the image' },
      { status: 500 }
    );
  }
}
