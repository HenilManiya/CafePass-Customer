import React from 'react';import { Colors } from '@/constants/Colors';

import Svg, {
  Path,
  Rect,
  Circle,
  Ellipse,
  Defs,
  LinearGradient,
  Stop,
  G,
} from 'react-native-svg';

interface CafePassLogoProps {
  size?: number;
  width?: number;
  height?: number;
  style?: object;
}

export const CafePassLogo: React.FC<CafePassLogoProps> = ({
  size = 120,
  width,
  height,
  style,
}) => {
  const w = width ?? size;
  const h = height ?? size;

  return (
    <Svg
      width={w}
      height={h}
      viewBox="0 0 500 500"
      fill="none"
      style={style}
    >
      <Defs>
        {/* Cup & Handle Caramel Gradient */}
        <LinearGradient id="cupGrad" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%" stopColor={Colors.dark.hex_f2b482} />
          <Stop offset="100%" stopColor={Colors.dark.hex_b96937} />
        </LinearGradient>

        {/* Center Steam Luminous Gradient */}
        <LinearGradient id="steamCenter" x1="0" y1="1" x2="0" y2="0">
          <Stop offset="0%" stopColor={Colors.dark.hex_e09c68} />
          <Stop offset="60%" stopColor={Colors.dark.hex_fff0d0} />
          <Stop offset="100%" stopColor={Colors.dark.text} />
        </LinearGradient>

        {/* Outer Steam Gradient */}
        <LinearGradient id="steamOuter" x1="0" y1="1" x2="0" y2="0">
          <Stop offset="0%" stopColor={Colors.dark.primary} stopOpacity="0.8" />
          <Stop offset="100%" stopColor={Colors.dark.hex_f5d0a9} stopOpacity="0.95" />
        </LinearGradient>

        {/* Golden Bean Gradient */}
        <LinearGradient id="beanGrad" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%" stopColor={Colors.dark.hex_fff2d6} />
          <Stop offset="100%" stopColor={Colors.dark.hex_d58e52} />
        </LinearGradient>
      </Defs>

      <G id="CafePassMark">
        {/* 1. Rising Steam Ribbons */}
        {/* Center Steam (Taller & Radiant) */}
        <Path
          d="M 235 185 C 260 115, 210 75, 240 20"
          stroke="url(#steamCenter)"
          strokeWidth="17"
          strokeLinecap="round"
        />

        {/* Left Steam */}
        <Path
          d="M 175 190 C 198 130, 150 90, 180 35"
          stroke="url(#steamOuter)"
          strokeWidth="14"
          strokeLinecap="round"
        />

        {/* Right Steam */}
        <Path
          d="M 295 190 C 318 130, 270 90, 300 35"
          stroke="url(#steamOuter)"
          strokeWidth="14"
          strokeLinecap="round"
        />

        {/* 2. Cup Handle (Graceful ear on the right) */}
        <Path
          d="M 370 240 C 445 240, 445 330, 370 330"
          stroke="url(#cupGrad)"
          strokeWidth="24"
          strokeLinecap="round"
        />

        {/* 3. Coffee Cup Body (Smooth ceramic U-shape) */}
        <Path
          d="M 100 210 L 380 210 L 380 310 A 85 85 0 0 1 295 395 L 185 395 A 85 85 0 0 1 100 310 Z"
          fill="url(#cupGrad)"
        />

        {/* 4. The Loyalty Pass Ticket Card Embossed on the Cup */}
        <Rect
          x="145"
          y="255"
          width="190"
          height="105"
          rx="18"
          fill={Colors.dark.hex_140a05}
          stroke={Colors.dark.hex_f2d2a0}
          strokeWidth="3.5"
        />

        {/* Golden Coffee Bean */}
        <Ellipse
          cx="240"
          cy="307"
          rx="26"
          ry="36"
          fill="url(#beanGrad)"
        />

        {/* Bean S-Curve Crease */}
        <Path
          d="M 240 276 C 232 297, 248 317, 240 338"
          stroke={Colors.dark.hex_140a05}
          strokeWidth="4.5"
          strokeLinecap="round"
        />

        {/* 4 Loyalty Stamp Punch Dots */}
        <Circle cx="172" cy="292" r="5.5" fill={Colors.dark.hex_f2d2a0} />
        <Circle cx="172" cy="322" r="5.5" fill={Colors.dark.hex_f2d2a0} />
        <Circle cx="308" cy="292" r="5.5" fill={Colors.dark.hex_f2d2a0} />
        <Circle cx="308" cy="322" r="5.5" fill={Colors.dark.hex_f2d2a0} />

        {/* 5. Minimalist Saucer Base */}
        <Rect
          x="80"
          y="410"
          width="320"
          height="18"
          rx="9"
          fill="url(#cupGrad)"
        />
      </G>
    </Svg>
  );
};

export default CafePassLogo;
