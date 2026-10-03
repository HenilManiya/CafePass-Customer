import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MotiView } from 'moti';
import { useRouter } from 'expo-router';
import { QrCode } from '@/components/Icon';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';

export function FloatingActionButton() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.fabContainer, { paddingBottom: Math.max(insets.bottom + 16, 32) }]} pointerEvents="box-none">
      <MotiView
        from={{ translateY: 100, opacity: 0 }}
        animate={{ translateY: 0, opacity: 1 }}
        transition={{ type: 'spring', damping: 15, delay: 400 }}
      >
        <TouchableOpacity
          onPress={() => router.push('/scan')}
          activeOpacity={0.8}
          style={styles.fabWrapper}
        >
          {/* Subtle pulse effect */}
          <MotiView
            from={{ opacity: 0.5, scale: 1 }}
            animate={{ opacity: 0, scale: 1.2 }}
            transition={{ loop: true, type: 'timing', duration: 2000 }}
            style={styles.fabPulse}
          />
          
          <View style={styles.fabButton}>
            <QrCode color="white" size={20} />
            <Text style={styles.fabText}>Scan QR</Text>
          </View>
        </TouchableOpacity>
      </MotiView>
    </View>
  );
}

const styles = StyleSheet.create({
  fabContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  fabWrapper: {
    position: 'relative',
  },
  fabPulse: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.dark.primaryMuted,
    borderRadius: 999,
  },
  fabButton: {
    backgroundColor: Colors.dark.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.dark.primaryLight,
    shadowColor: Colors.dark.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
  },
  fabText: {
    color: Colors.dark.text,
    fontWeight: 'bold',
    fontSize: 15,
    letterSpacing: 0.5,
    marginLeft: 12,
  },
});
