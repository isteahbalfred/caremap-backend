/**
 * google.strategy.ts
 * Gère le flux OAuth2 Google manuellement (sans Passport).
 * Utilisé par auth.routes et auth.service.
 */
import axios from 'axios';

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo';

export interface GoogleUser {
  googleId: string;
  email: string;
  firstName: string;
  lastName: string;
  picture?: string;
}

/**
 * Échange le code OAuth contre un access_token Google,
 * puis récupère le profil de l'utilisateur.
 */
export async function getGoogleUser(code: string): Promise<GoogleUser> {
  // 1. Échange du code contre les tokens Google
  const tokenRes = await axios.post<{
    access_token: string;
    id_token: string;
  }>(GOOGLE_TOKEN_URL, {
    code,
    client_id: process.env.GOOGLE_CLIENT_ID,
    client_secret: process.env.GOOGLE_CLIENT_SECRET,
    redirect_uri: process.env.GOOGLE_CALLBACK_URL,
    grant_type: 'authorization_code',
  });

  const { access_token } = tokenRes.data;

  // 2. Récupération du profil Google
  const profileRes = await axios.get<{
    id: string;
    email: string;
    given_name: string;
    family_name: string;
    picture: string;
  }>(GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${access_token}` },
  });

  const p = profileRes.data;

  return {
    googleId: p.id,
    email: p.email,
    firstName: p.given_name || '',
    lastName: p.family_name || '',
    picture: p.picture,
  };
}

/**
 * Construit l'URL de redirection Google OAuth.
 */
export function buildGoogleAuthUrl(): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: process.env.GOOGLE_CALLBACK_URL!,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'select_account',
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}