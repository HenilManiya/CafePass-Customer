import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { MotiView } from 'moti';
import { useRouter } from 'expo-router';
import { QrCode } from '@/components/Icon';
import { LinearGradient } from '@/components/LinearGradient';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';

interface CameraPermissionViewProps {
  onRequestPermission: () => void;
}

export function CameraPermissionView({ onRequestPermission }: CameraPermissionViewProps) {
  const router = useRouter();
  
  return (
    <View style={styles.permissionContainer}>
      <LinearGradient 
        colors={[Colors.dark.background, Colors.dark.hex_2e1911]} 
        style={StyleSheet.absoluteFill} 
      />
      <MotiView 
        from={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        style={styles.permissionCard}
      >
        <View style={styles.iconCircle}>
          <QrCode size={40} color={Colors.dark.primary} />
        </View>
        <Text style={styles.titleText}>Camera Access</Text>
        <Text style={styles.descriptionText}>
          We need your permission to show the camera so you can scan cafe QR codes.
        </Text>
        <TouchableOpacity 
          style={styles.grantButton}
          onPress={onRequestPermission}
        >
          <Text style={styles.grantButtonText}>Grant Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.goBackButton}
          onPress={() => router.back()}
        >
          <Text style={styles.goBackText}>Go Back</Text>
        </TouchableOpacity>
      </MotiView>
    </View>
  );
}

const styles = StyleSheet.create({
  permissionContainer: {
    flex: 1,
    backgroundColor: Colors.dark.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  permissionCard: {
    backgroundColor: Colors.dark.overlay,
    padding: 32,
    borderRadius: 32,
    alignItems: 'center',
    width: '100%',
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  iconCircle: {
    backgroundColor: Colors.dark.primaryLight,
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  titleText: {
    fontSize: 24,
    fontFamily: Typography.serif,
    color: Colors.dark.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  descriptionText: {
    color: Colors.dark.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  grantButton: {
    backgroundColor: Colors.dark.primary,
    width: '100%',
    paddingVertical: 16,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  grantButtonText: {
    color: Colors.dark.text,
    fontWeight: 'bold',
    fontSize: 18,
    letterSpacing: 0.5,
  },
  goBackButton: {
    marginTop: 24,
    paddingVertical: 8,
  },
  goBackText: {
    color: Colors.dark.textSecondary,
    fontWeight: 'bold',
  },
});
