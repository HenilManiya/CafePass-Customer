import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, TextInputProps } from 'react-native';
import { Eye, EyeOff } from '@/components/Icon';
import { Colors } from '@/constants/Colors';

interface AuthPasswordInputProps extends TextInputProps {
  label: string;
  error?: string;
  isLogin?: boolean;
}

export function AuthPasswordInput({ label, error, isLogin = true, style, ...props }: AuthPasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={{ marginBottom: isLogin ? 16 : 10 }}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View 
        style={[
          styles.passwordContainer,
          { height: isLogin ? 48 : 40 },
          error ? styles.inputErrorBorder : styles.inputNormalBorder,
        ]}
      >
        <TextInput 
          placeholderTextColor={Colors.dark.placeholder}
          secureTextEntry={!showPassword}
          style={[styles.passwordInput, { fontSize: isLogin ? 15 : 13 }, style]}
          {...props}
        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          {showPassword ? <EyeOff size={18} color={Colors.dark.primary} /> : <Eye size={18} color={Colors.dark.primary} />}
        </TouchableOpacity>
      </View>
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
  passwordContainer: {
    backgroundColor: Colors.dark.rgba_39_39_42_0_8,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 14,
    borderWidth: 1,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 14,
    color: Colors.dark.text,
    height: '100%',
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
