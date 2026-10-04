import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, TextInputProps } from 'react-native';
import { Colors } from '@/constants/Colors';
import { Eye, EyeOff } from '@/components/Icon';

interface InputProps extends TextInputProps {
  label: string;
  error?: string;
  isPassword?: boolean;
}

export function Input({ label, error, isPassword = false, style, ...props }: InputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View 
        style={[
          styles.inputContainer,
          error ? styles.inputErrorBorder : styles.inputNormalBorder,
        ]}
      >
        <TextInput 
          placeholderTextColor={Colors.dark.placeholder}
          secureTextEntry={isPassword && !showPassword}
          style={[styles.inputField, style]}
          {...props}
        />
        {isPassword && (
          <TouchableOpacity 
            onPress={() => setShowPassword(!showPassword)} 
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.eyeIcon}
          >
            {showPassword ? <EyeOff size={18} color={Colors.dark.primary} /> : <Eye size={18} color={Colors.dark.primary} />}
          </TouchableOpacity>
        )}
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  inputLabel: {
    color: Colors.dark.textSecondary,
    fontWeight: 'bold',
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontSize: 10,
    marginBottom: 4,
  },
  inputContainer: {
    backgroundColor: Colors.dark.inputBackground,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderWidth: 1,
    overflow: 'hidden',
  },
  inputField: {
    flex: 1,
    paddingHorizontal: 14,
    color: Colors.dark.text,
    fontSize: 15,
    height: '100%',
  },
  eyeIcon: {
    paddingRight: 14,
    justifyContent: 'center',
    alignItems: 'center',
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
    marginTop: 4,
    marginLeft: 4,
  },
});
