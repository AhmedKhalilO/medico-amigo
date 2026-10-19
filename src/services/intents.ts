import { Alert, Linking, Platform } from 'react-native';
import * as Location from 'expo-location';

/**
 * Numéros publics (valeurs par défaut). Ils sont remplacés au démarrage par ceux du backend
 * (GET /api/config), voir App.tsx.
 */
let numbers = { emergency: '112', sns24: '808242424' };

export const setNumbers = (n: Partial<typeof numbers>) => {
  numbers = { ...numbers, ...n };
};

async function open(url: string, fallbackUrl?: string) {
  try {
    await Linking.openURL(url);
    return;
  } catch {
    if (fallbackUrl) {
      try {
        await Linking.openURL(fallbackUrl);
        return;
      } catch {
        // on tombe sur l'alerte ci-dessous
      }
    }
  }
  Alert.alert(
    'Impossible d’ouvrir l’application',
    'Vérifiez qu’une application compatible est installée sur l’appareil.'
  );
}

/** Intent d'appel : ouvre le composeur avec le numéro prérempli (l'utilisateur valide l'appel). */
export const dial = (number: string) => open(`tel:${number.replace(/\s/g, '')}`);

export const callEmergency = () => dial(numbers.emergency);
export const callSns24 = () => dial(numbers.sns24);

/** Le numéro du médecin vient du profil de l'utilisateur (GET /api/me). */
export function callDoctor(phone?: string | null) {
  if (!phone) {
    Alert.alert('Número do médico em falta', 'Defina o número do seu médico no separador Perfil.');
    return;
  }
  return dial(phone);
}

/** Intent carte : recherche « farmácia » autour de la position de l'utilisateur (si autorisée). */
export async function openPharmaciesMap() {
  let ll: string | null = null;
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') {
      const pos =
        (await Location.getLastKnownPositionAsync()) ??
        (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
      ll = `${pos.coords.latitude},${pos.coords.longitude}`;
    }
  } catch {
    // sans position, la recherche se fait quand même, sans centrage
  }

  const q = encodeURIComponent('farmácia');
  const native = Platform.select({
    android: `geo:${ll ?? '0,0'}?q=${q}`,
    ios: `http://maps.apple.com/?q=${q}${ll ? `&sll=${ll}` : ''}`,
    default: `https://www.google.com/maps/search/${q}`,
  }) as string;
  const web = `https://www.google.com/maps/search/${q}${ll ? `/@${ll},15z` : ''}`;

  await open(native, web);
}