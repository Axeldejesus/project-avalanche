import { NextResponse } from 'next/server';

// ⚠️ CETTE ROUTE EST DANGEREUSE - Elle expose vos secrets!
// Les credentials IGDB doivent rester côté serveur UNIQUEMENT

export async function GET(): Promise<NextResponse<{ error: string }>> {
  // ❌ NE JAMAIS faire ça:
  // return NextResponse.json({
  //   clientId: CLIENT_ID,
  //   clientSecret: CLIENT_SECRET
  // });
  
  // ✅ À la place, retourner une erreur
  return NextResponse.json({ 
    error: 'This endpoint has been removed for security reasons. IGDB credentials are server-side only.' 
  }, { status: 403 });
}
