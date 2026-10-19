/**
 * Adresse du backend Next.js. Définie dans le fichier `.env` à la racine du projet mobile :
 *   EXPO_PUBLIC_API_URL=http://192.168.1.20:3000
 *
 * - Téléphone réel (Expo Go) : l'adresse IP locale de votre ordinateur (même Wi-Fi).
 * - Émulateur Android        : http://10.0.2.2:3000
 * - Simulateur iOS           : http://localhost:3000
 * - Production               : https://api.votre-domaine.pt (HTTPS obligatoire)
 */
export const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000').replace(/\/$/, '');