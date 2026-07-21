import { Svg, Path } from 'react-native-svg';
import { colors } from '@/theme/colors';

interface JGlyphProps {
  size?: number;
  color?: string;
  stroke?: boolean;
}

export function JGlyph({ size = 44, color, stroke = true }: JGlyphProps) {
  const fill = stroke ? 'none' : color ?? colors.t1;
  const strokeColor = stroke ? color ?? '#fff' : 'none';

  return (
    <Svg width={size} height={size * 1.25} viewBox="0 0 32 40" fill={fill} stroke={strokeColor} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M10 4H22V24C22 30.627 16.627 36 10 36L5 30" />
    </Svg>
  );
}
