/**
 * Icon.tsx — Custom SVG icon library.
 * Replaces lucide-react-native with zero external dependencies.
 * All paths sourced from the Lucide icon set (ISC license).
 */
import React from 'react';
import Svg, { Path, Circle, Line, Polyline, Rect, Polygon } from 'react-native-svg';
import { Colors } from '@/constants/Colors';

interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
  style?: object;
}

const defaults = { size: 24, color: Colors.dark.hex_000, strokeWidth: 2 };

const icon = (content: (props: Required<Omit<IconProps, 'style'>>) => React.ReactNode) =>
  ({ size = defaults.size, color = defaults.color, strokeWidth = defaults.strokeWidth, style }: IconProps) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
      {content({ size, color, strokeWidth })}
    </Svg>
  );

export const QrCode = icon(() => (
  <>
    <Rect x="3" y="3" width="7" height="7" rx="1" />
    <Rect x="14" y="3" width="7" height="7" rx="1" />
    <Rect x="3" y="14" width="7" height="7" rx="1" />
    <Path d="M14 14h.01M14 17h.01M17 14h.01M17 17h.01M20 14h.01M20 17h.01M17 20h.01M20 20h.01" />
  </>
));

export const LogOut = icon(() => (
  <>
    <Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <Polyline points="16 17 21 12 16 7" />
    <Line x1="21" y1="12" x2="9" y2="12" />
  </>
));

export const MapPin = icon(() => (
  <>
    <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <Circle cx="12" cy="10" r="3" />
  </>
));

export const Coffee = icon(() => (
  <>
    <Path d="M18 8h1a4 4 0 0 1 0 8h-1" />
    <Path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
    <Line x1="6" y1="1" x2="6" y2="4" />
    <Line x1="10" y1="1" x2="10" y2="4" />
    <Line x1="14" y1="1" x2="14" y2="4" />
  </>
));

export const ChevronLeft = icon(() => (
  <Polyline points="15 18 9 12 15 6" />
));

export const ChevronRight = icon(() => (
  <Polyline points="9 18 15 12 9 6" />
));

export const RefreshCw = icon(() => (
  <>
    <Polyline points="23 4 23 10 17 10" />
    <Polyline points="1 20 1 14 7 14" />
    <Path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </>
));

export const Clock = icon(() => (
  <>
    <Circle cx="12" cy="12" r="10" />
    <Polyline points="12 6 12 12 16 14" />
  </>
));

export const X = icon(() => (
  <>
    <Line x1="18" y1="6" x2="6" y2="18" />
    <Line x1="6" y1="6" x2="18" y2="18" />
  </>
));

export const Heart = icon(() => (
  <Path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
));

export const Camera = icon(() => (
  <>
    <Path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <Circle cx="12" cy="13" r="4" />
  </>
));

export const Phone = icon(() => (
  <Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
));

export const ArrowRight = icon(() => (
  <>
    <Line x1="5" y1="12" x2="19" y2="12" />
    <Polyline points="12 5 19 12 12 19" />
  </>
));

export const AlertCircle = icon(() => (
  <>
    <Circle cx="12" cy="12" r="10" />
    <Line x1="12" y1="8" x2="12" y2="12" />
    <Line x1="12" y1="16" x2="12.01" y2="16" />
  </>
));

export const Eye = icon(() => (
  <>
    <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <Circle cx="12" cy="12" r="3" />
  </>
));

export const EyeOff = icon(() => (
  <>
    <Path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
    <Path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
    <Line x1="1" y1="1" x2="23" y2="23" />
  </>
));

export const ExternalLink = icon(() => (
  <>
    <Path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <Polyline points="15 3 21 3 21 9" />
    <Line x1="10" y1="14" x2="21" y2="3" />
  </>
));

export const CheckCircle2 = icon(() => (
  <>
    <Circle cx="12" cy="12" r="10" />
    <Path d="m9 12 2 2 4-4" />
  </>
));

export const Info = icon(() => (
  <>
    <Circle cx="12" cy="12" r="10" />
    <Line x1="12" y1="16" x2="12" y2="12" />
    <Line x1="12" y1="8" x2="12.01" y2="8" />
  </>
));
