import React, { useRef } from 'react';
import { View, StyleSheet, ViewProps } from 'react-native';
import Svg, { Defs, LinearGradient as SvgLinearGradient, Stop, Rect } from 'react-native-svg';

export interface LinearGradientPoint {
  x: number;
  y: number;
}

export interface LinearGradientProps extends ViewProps {
  colors: readonly string[] | string[];
  start?: LinearGradientPoint;
  end?: LinearGradientPoint;
  locations?: readonly number[] | number[] | null;
  children?: React.ReactNode;
}

function parseColor(colorStr: string): { color: string; opacity: number } {
  if (!colorStr || colorStr === 'transparent') {
    return { color: '#000000', opacity: 0 };
  }

  const rgbaMatch = colorStr.match(/rgba\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)/i);
  if (rgbaMatch) {
    return {
      color: `rgb(${rgbaMatch[1]}, ${rgbaMatch[2]}, ${rgbaMatch[3]})`,
      opacity: parseFloat(rgbaMatch[4]),
    };
  }

  if (colorStr.startsWith('#') && colorStr.length === 9) {
    const hex = colorStr.substring(1, 7);
    const alphaHex = colorStr.substring(7, 9);
    const opacity = parseInt(alphaHex, 16) / 255;
    return {
      color: `#${hex}`,
      opacity,
    };
  }

  return {
    color: colorStr,
    opacity: 1,
  };
}

export function LinearGradient({
  colors,
  start = { x: 0.5, y: 0 },
  end = { x: 0.5, y: 1 },
  locations,
  style,
  children,
  ...rest
}: LinearGradientProps) {
  const idRef = useRef(`grad_${Math.random().toString(36).substring(2, 9)}`);
  const gradientId = idRef.current;

  return (
    <View style={[styles.container, style]} pointerEvents="none" {...rest}>
      <Svg height="100%" width="100%" style={StyleSheet.absoluteFill} pointerEvents="none">
        <Defs>
          <SvgLinearGradient
            id={gradientId}
            x1={`${start.x * 100}%`}
            y1={`${start.y * 100}%`}
            x2={`${end.x * 100}%`}
            y2={`${end.y * 100}%`}
          >
            {colors.map((color, index) => {
              const offset =
                locations && locations[index] !== undefined && locations[index] !== null
                  ? `${(locations[index] as number) * 100}%`
                  : `${(index / Math.max(colors.length - 1, 1)) * 100}%`;
              const parsed = parseColor(color);
              return (
                <Stop
                  key={index}
                  offset={offset}
                  stopColor={parsed.color}
                  stopOpacity={parsed.opacity}
                />
              );
            })}
          </SvgLinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${gradientId})`} />
      </Svg>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    position: 'relative',
  },
});

export default LinearGradient;
