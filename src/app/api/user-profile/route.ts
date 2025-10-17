import { NextResponse } from 'next/server';
import { getAdminFirestore } from '../../../utils/firebase-admin';

// ⚠️ SÉCURITÉ: Validation des paramètres
const validateUserId = (userId: string | null): boolean => {
  if (!userId) return false;
  // Vérifier que c'est un UID Firebase valide (alphanumeric, 28 chars)
  return /^[a-zA-Z0-9]{20,30}$/.test(userId);
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    // ⚠️ SÉCURITÉ: Validation stricte de l'userId
    if (!validateUserId(userId)) {
      return NextResponse.json({ 
        error: 'Invalid user ID format' 
      }, { status: 400 });
    }
    
    // Utiliser Firestore Admin côté serveur
    const db = getAdminFirestore();
    const userDoc = await db.collection('utilisateur').doc(userId!).get();
    
    if (!userDoc.exists) {
      return NextResponse.json({ 
        error: 'User profile not found' 
      }, { status: 404 });
    }
    
    const userData = userDoc.data();
    
    // ⚠️ SÉCURITÉ: Ne renvoyer QUE les données publiques
    const profileData = {
      username: userData?.username || 'Anonymous',
      preferredPlatform: userData?.preferredPlatform || null,
      // ❌ NE JAMAIS renvoyer: email, uid, tokens, données sensibles
    };
    
    return NextResponse.json(profileData);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    // ⚠️ SÉCURITÉ: Ne pas exposer les détails de l'erreur
    return NextResponse.json({ 
      error: 'An error occurred while fetching the profile' 
    }, { status: 500 });
  }
}
