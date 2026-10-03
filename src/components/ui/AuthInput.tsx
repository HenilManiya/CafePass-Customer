import React from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps } from 'react-native';
import { Colors } from '@/constants/Colors';

interface AuthInputProps extends TextInputProps {
  label: string;
  error?: string;
  isLogin?: boolean;
}

export function AuthInput({ label, error, isLogin = true, style, ...props }: AuthInputProps) {
  return (
    <View style={{ marginBottom: isLogin ? 12 : 8 }}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        placeholderTextColor={Colors.dark.placeholder}
        style={[
          styles.input,
          { height: isLogin ? 48 : 40, fontSize: isLogin ? 15 : 13 },
          error ? styles.inputErrorBorder : styles.inputNormalBorder,
          style
        ]}
        {...props}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  inputLabel: {
    color: Colors.dark.textSecondary,
    fontWeight: 'bold',
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontSize: 10,
    marginBottom: 2,
  },
  input: {
    backgroundColor: Colors.dark.inputBackground,
    paddingHorizontal: 14,
    borderRadius: 12,
    color: Colors.dark.text,
    borderWidth: 1,
  },
  inputNormalBorder: {
    borderColor: Colors.dark.primaryMuted,
  },
  inputErrorBorder: {
    borderColor: Colors.dark.hex_ef4444,
  },
  errorText: {
    color: Colors.dark.error,
    fontSize: 12,
    marginTop: 2,
    marginLeft: 4,
  },
});
