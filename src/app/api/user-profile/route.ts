import { NextResponse } from 'next/server';
import { getAdminFirestore } from '../../../utils/firebase-admin';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    
    // Utiliser Firestore Admin côté serveur
    const db = getAdminFirestore();
    const userDoc = await db.collection('utilisateur').doc(userId).get();
    
    if (!userDoc.exists) {
      return NextResponse.json({ 
        error: 'User profile not found' 
      }, { status: 404 });
    }
    
    const userData = userDoc.data();
    
    // Vérifier que data existe et a les propriétés attendues
    const profileData = {
      username: userData?.username || '',
      preferredPlatform: userData?.preferredPlatform || null
    };
    
    // Ne renvoyer que les données pertinentes pour la sécurité
    return NextResponse.json(profileData);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 });
  }
}
