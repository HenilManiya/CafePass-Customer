import React from 'react';
import { TouchableOpacity, Text, StyleSheet, TouchableOpacityProps } from 'react-native';
import { ArrowRight } from '@/components/Icon';
import { Colors } from '@/constants/Colors';

interface AuthButtonProps extends TouchableOpacityProps {
  title: string;
  loading?: boolean;
  isLogin?: boolean;
}

export function AuthButton({ title, loading = false, isLogin = true, style, ...props }: AuthButtonProps) {
  return (
    <TouchableOpacity 
      disabled={loading}
      style={[
        styles.primaryButton,
        { height: isLogin ? 48 : 42, marginTop: 4 },
        loading && styles.buttonDisabled,
        style
      ]}
      {...props}
    >
      <Text style={[styles.primaryButtonText, { fontSize: isLogin ? 15 : 14 }]}>
        {title}
      </Text>
      {!loading && <ArrowRight size={18} color={Colors.dark.text} />}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  primaryButton: {
    backgroundColor: Colors.dark.primary,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.dark.primaryBorder,
    shadowColor: Colors.dark.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: Colors.dark.text,
    fontWeight: 'bold',
    marginRight: 8,
    letterSpacing: 0.5,
  },
});
