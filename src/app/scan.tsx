import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, QrCode } from '@/components/Icon';
import { MotiView } from 'moti';
import { LinearGradient } from '@/components/LinearGradient';

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const router = useRouter();

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <LinearGradient 
          colors={['#000000', '#2E1911']} 
          style={StyleSheet.absoluteFill} 
        />
        <MotiView 
          from={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          style={styles.permissionCard}
        >
          <View style={styles.iconCircle}>
            <QrCode size={40} color="#C67C4E" />
          </View>
          <Text style={styles.titleText}>Camera Access</Text>
          <Text style={styles.descriptionText}>
            We need your permission to show the camera so you can scan cafe QR codes.
          </Text>
          <TouchableOpacity 
            style={styles.grantButton}
            onPress={requestPermission}
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

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;
    console.log('[scan] QR scanned, raw data:', data);
    setScanned(true);

    try {
      const payload = JSON.parse(data);
      console.log('[scan] Parsed payload:', JSON.stringify(payload));

      if (payload.cafe_id) {
        console.log('[scan] Navigating to cafe:', payload.cafe_id);
        router.push(`/cafe/${payload.cafe_id}`);
      } else {
        console.warn('[scan] QR missing cafe_id');
        alert("Invalid Cafe QR code!");
        setTimeout(() => setScanned(false), 2000);
      }
    } catch (e) {
      console.error('[scan] Failed to parse QR JSON:', e);
      alert("Invalid QR format");
      setTimeout(() => setScanned(false), 2000);
    }
  };

  return (
    <View style={styles.container}>
      <CameraView
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        style={styles.camera}
      />
      
      <SafeAreaView style={styles.safeArea} pointerEvents="box-none">
        <View style={styles.header} pointerEvents="box-none">
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={styles.closeButton}
          >
            <X color="white" size={24} />
          </TouchableOpacity>
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>Scan Cafe QR</Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>
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
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    overflow: 'hidden',
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  permissionCard: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    padding: 32,
    borderRadius: 32,
    alignItems: 'center',
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  iconCircle: {
    backgroundColor: 'rgba(198,124,78,0.1)',
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  titleText: {
    fontSize: 24,
    fontFamily: Platform.select({ ios: 'ui-serif', default: 'serif' }),
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  descriptionText: {
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  grantButton: {
    backgroundColor: '#C67C4E',
    width: '100%',
    paddingVertical: 16,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  grantButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 18,
    letterSpacing: 0.5,
  },
  goBackButton: {
    marginTop: 24,
    paddingVertical: 8,
  },
  goBackText: {
    color: 'rgba(255,255,255,0.7)',
    fontWeight: 'bold',
  },
  camera: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  safeArea: {
    flex: 1,
    zIndex: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    width: '100%',
  },
  closeButton: {
    width: 48,
    height: 48,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  headerBadge: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  headerBadgeText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    letterSpacing: 2,
    fontSize: 12,
    textTransform: 'uppercase',
  },
  headerSpacer: {
    width: 48,
    height: 48,
  },
  scanAreaContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanFrame: {
    width: 288,
    height: 288,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 32,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: '#FFFFFF',
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
    backgroundColor: '#C67C4E',
    shadowColor: '#C67C4E',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  instructionBadge: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 999,
    marginTop: 48,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  instructionText: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
  },
});
