import { Platform } from 'react-native';

export const Typography = {
  serif: Platform.select({ ios: 'ui-serif', default: 'serif' }),
  sans: Platform.select({ ios: 'ui-sans-serif', default: 'sans-serif' }),
  mono: Platform.select({ ios: 'ui-monospace', default: 'monospace' }),
};
