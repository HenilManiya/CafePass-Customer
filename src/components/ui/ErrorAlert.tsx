import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { MotiView, AnimatePresence } from 'moti';
import { AlertCircle } from '@/components/Icon';
import { Colors } from '@/constants/Colors';

interface ErrorAlertProps {
  error: string;
}

export function ErrorAlert({ error }: ErrorAlertProps) {
  return (
    <AnimatePresence>
      {error ? (
        <MotiView 
          from={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          style={styles.errorAlert}
        >
          <AlertCircle size={18} color={Colors.dark.error} />
          <Text style={styles.errorAlertText}>{error}</Text>
        </MotiView>
      ) : null}
    </AnimatePresence>
  );
}

const styles = StyleSheet.create({
  errorAlert: {
    backgroundColor: Colors.dark.errorBackground,
    padding: 12,
    borderRadius: 12,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.dark.errorBorder,
  },
  errorAlertText: {
    color: Colors.dark.hex_fecaca,
    marginLeft: 8,
    flex: 1,
    fontSize: 13,
  },
});
