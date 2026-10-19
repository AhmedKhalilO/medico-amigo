/** Lignes de texte simulées, utilisées tant que ML Kit n'est pas branché. */
const DEMO_LINES = ['Ibuprofeno', '400 mg', 'comprimidos revestidos', '20 comprimidos'];

/**
 * Reconnaissance de texte sur la photo de l'emballage : renvoie les lignes lues.
 * L'analyse (nom, dosage, forme, quantité, validité) est faite par le backend : POST /api/scan/parse.
 *
 * Version simulée pour Expo Go. Pour du vrai OCR :
 *   npx expo install @react-native-ml-kit/text-recognition   (nécessite un development build)
 * puis remplacez le corps par :
 *   import TextRecognition from '@react-native-ml-kit/text-recognition';
 *   const res = await TextRecognition.recognize(uri);
 *   return res.blocks.flatMap((b) => b.lines.map((l) => l.text));
 */
export async function recognizeLines(_uri: string): Promise<string[]> {
  await new Promise((r) => setTimeout(r, 900)); // simule le temps de traitement
  return DEMO_LINES;
}