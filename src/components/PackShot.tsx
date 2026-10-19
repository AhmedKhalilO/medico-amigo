import React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { PackKind } from '../data/medications';

export const PACK_BG: Record<PackKind, string> = {
  'tablet-blue': '#DBEAFE',
  'tablet-green': '#D1FAE5',
  syrup: '#FEF3C7',
};

const BOX: Record<'tablet-blue' | 'tablet-green', { top: string; front: string; side: string }> = {
  'tablet-blue': { top: '#93C5FD', front: '#2563EB', side: '#1D4ED8' },
  'tablet-green': { top: '#6EE7B7', front: '#059669', side: '#047857' },
};

/** Illustration vectorielle d'emballage (boîte de comprimés ou flacon de sirop). */
export function PackShot({ kind, size = 56 }: { kind: PackKind; size?: number }) {
  if (kind === 'syrup') {
    return (
      <Svg width={size} height={size} viewBox="0 0 64 64" accessibilityElementsHidden>
        <Rect x={24} y={6} width={16} height={10} rx={2.5} fill="#047857" />
        <Path d="M22 16 H42 V24 Q46 28 46 34 V54 Q46 59 41 59 H23 Q18 59 18 54 V34 Q18 28 22 24 Z" fill="#F59E0B" />
        <Rect x={20} y={32} width={24} height={17} rx={3} fill="#FFF8E1" />
        <Path d="M27 40.5 H37 M32 35.5 V45.5" stroke="#047857" strokeWidth={2.4} strokeLinecap="round" />
        <Path d="M23.5 30 V54" stroke="#FFFFFF" strokeOpacity={0.4} strokeWidth={3} strokeLinecap="round" />
      </Svg>
    );
  }
  const c = BOX[kind];
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" accessibilityElementsHidden>
      <Path d="M14 20 L24 12 H54 L44 20 Z" fill={c.top} />
      <Rect x={14} y={20} width={30} height={34} rx={2} fill={c.front} />
      <Path d="M44 20 L54 12 V46 L44 54 Z" fill={c.side} />
      <Rect x={14} y={30} width={30} height={10} fill="#FFFFFF" />
      <Circle cx={29} cy={35} r={3} fill={c.front} />
    </Svg>
  );
}