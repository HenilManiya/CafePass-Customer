import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { MotiView } from 'moti';
import { CafePassLogo } from '@/components/CafePassLogo';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';

export function EmptyState() {
  return (
    <MotiView
      from={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      style={styles.emptyStateContainer}
    >
      <View style={styles.emptyStateLogoWrapper}>
        <CafePassLogo size={72} />
      </View>
      <Text style={styles.emptyStateTitle}>No cards yet!</Text>
      <Text style={styles.emptyStateDesc}>
        Visit a participating cafe and scan their QR code to grab your first digital punch card.
      </Text>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  emptyStateContainer: {
    marginTop: 80,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyStateLogoWrapper: {
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateTitle: {
    color: Colors.dark.text,
    fontSize: 24,
    fontFamily: Typography.serif,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyStateDesc: {
    color: Colors.dark.textSecondary,
    textAlign: 'center',
    fontSize: 15,
    paddingHorizontal: 16,
    lineHeight: 24,
  },
});
