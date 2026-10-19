export type PackKind = 'tablet-blue' | 'tablet-green' | 'syrup';

export type Medication = {
  id: string;
  name: string;
  subtitle: string;
  kind: PackKind;
  remaining: number;
  total: number;
  unit: 'restantes' | 'ml';
  dosePerTake: number;
  times: string[];
  expiry: string | null;
};

export const remainingLabel = (m: Medication) =>
  m.unit === 'ml' ? `${m.remaining} ml` : `${m.remaining} restantes`;