import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { Eye, EyeOff } from '@/components/Icon';
import { Colors } from '@/constants/Colors';

// ─────────────────────────────────────────────
// Shared types
// ─────────────────────────────────────────────

interface BaseFieldProps {
  /** Label shown above the input */
  label: string;
  /** Optional right-side label node (e.g. "(Optional)" badge) */
  labelSuffix?: React.ReactNode;
  /** Optional icon placed left of the label text */
  labelIcon?: React.ReactNode;
  /** Inline validation error message */
  error?: string;
  /** Extra style for the outer wrapper View */
  containerStyle?: ViewStyle;
}

// ─────────────────────────────────────────────
// Input  (plain text input)
// ─────────────────────────────────────────────

export interface InputProps extends BaseFieldProps, TextInputProps {}

export function Input({
  label,
  labelSuffix,
  labelIcon,
  error,
  containerStyle,
  ...inputProps
}: InputProps) {
  return (
    <View style={[styles.wrapper, containerStyle]}>
      <FieldLabel
        label={label}
        labelSuffix={labelSuffix}
        labelIcon={labelIcon}
      />
      <TextInput
        placeholderTextColor={Colors.dark.placeholder}
        {...inputProps}
        style={[
          styles.input,
          error ? styles.errorBorder : styles.normalBorder,
          inputProps.style,
        ]}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

// ─────────────────────────────────────────────
// PasswordInput  (auto-managed visibility toggle)
// ─────────────────────────────────────────────

export interface PasswordInputProps extends BaseFieldProps, Omit<TextInputProps, 'secureTextEntry'> {}

export function PasswordInput({
  label,
  labelSuffix,
  labelIcon,
  error,
  containerStyle,
  ...inputProps
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <View style={[styles.wrapper, containerStyle]}>
      <FieldLabel
        label={label}
        labelSuffix={labelSuffix}
        labelIcon={labelIcon}
      />
      <View style={[styles.passwordRow, error ? styles.errorBorder : styles.normalBorder]}>
        <TextInput
          placeholderTextColor={Colors.dark.placeholder}
          {...inputProps}
          secureTextEntry={!visible}
          style={[styles.passwordInput, inputProps.style]}
        />
        <TouchableOpacity
          onPress={() => setVisible(v => !v)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={styles.eyeButton}
        >
          {visible
            ? <EyeOff size={18} color={Colors.dark.muted} />
            : <Eye size={18} color={Colors.dark.muted} />}
        </TouchableOpacity>
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

// ─────────────────────────────────────────────
// Internal: shared label row
// ─────────────────────────────────────────────

function FieldLabel({
  label,
  labelSuffix,
  labelIcon,
}: {
  label: string;
  labelSuffix?: React.ReactNode;
  labelIcon?: React.ReactNode;
}) {
  const hasExtras = labelIcon || labelSuffix;
  if (!hasExtras) {
    return <Text style={styles.label}>{label}</Text>;
  }
  return (
    <View style={styles.labelRow}>
      {labelIcon}
      <Text style={styles.label}>
        {label}
        {labelSuffix ? <Text style={styles.labelSuffix}> {labelSuffix}</Text> : null}
      </Text>
    </View>
  );
}

// ─────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 14,
  },

  // Label
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 6,
  },
  label: {
    color: Colors.dark.muted,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontSize: 11,
    marginBottom: 6,
  },
  labelSuffix: {
    color: Colors.dark.placeholder,
    fontWeight: '400',
    textTransform: 'none',
    letterSpacing: 0,
    fontSize: 11,
  },

  // Text input
  input: {
    backgroundColor: Colors.dark.dark || Colors.dark.inputBackground,
    paddingHorizontal: 14,
    borderRadius: 14,
    color: Colors.dark.text,
    height: 48,
    fontSize: 14,
    borderWidth: 1,
  },

  // Password row
  passwordRow: {
    backgroundColor: Colors.dark.dark || Colors.dark.inputBackground,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderWidth: 1,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 14,
    color: Colors.dark.text,
    height: '100%',
    fontSize: 14,
  },
  eyeButton: {
    paddingHorizontal: 14,
  },

  // Borders
  normalBorder: {
    borderColor: Colors.dark.borderSubtle || Colors.dark.primaryMuted,
  },
  errorBorder: {
    borderColor: Colors.dark.errorBorderStrong || Colors.dark.hex_ef4444,
  },

  // Error
  errorText: {
    color: Colors.dark.error,
    fontSize: 11,
    marginTop: 5,
    marginLeft: 2,
  },
});
