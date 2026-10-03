import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MotiView } from 'moti';
import { Colors } from '@/constants/Colors';

export function ScanFrame() {
  return (
    <View style={styles.scanAreaContainer} pointerEvents="none">
      <MotiView
        from={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', damping: 15 }}
        style={styles.scanFrame}
      >
        <View style={[styles.corner, styles.cornerTL]} />
        <View style={[styles.corner, styles.cornerTR]} />
        <View style={[styles.corner, styles.cornerBL]} />
        <View style={[styles.corner, styles.cornerBR]} />
        <MotiView 
          from={{ translateY: -130, opacity: 0 }}
          animate={{ translateY: 130, opacity: [0, 1, 1, 0] }}
          transition={{ loop: true, type: 'timing', duration: 2000 }}
          style={styles.scanLine}
        />
      </MotiView>
      <View style={styles.instructionBadge}>
        <Text style={styles.instructionText}>Point camera at the Cafe's QR Code</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scanAreaContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanFrame: {
    width: 288,
    height: 288,
    borderWidth: 2,
    borderColor: Colors.dark.badge,
    borderRadius: 32,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: Colors.dark.text,
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 32,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 32,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 32,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 32,
  },
  scanLine: {
    width: '100%',
    height: 2,
    backgroundColor: Colors.dark.primary,
    shadowColor: Colors.dark.primary,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  instructionBadge: {
    backgroundColor: Colors.dark.overlay,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 999,
    marginTop: 48,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  instructionText: {
    color: Colors.dark.text,
    fontSize: 16,
    textAlign: 'center',
  },
});
