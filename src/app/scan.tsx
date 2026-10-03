import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X } from '@/components/Icon';
import { CameraPermissionView } from '@/components/scanner/CameraPermissionView';
import { ScanFrame } from '@/components/scanner/ScanFrame';
import { Colors } from '@/constants/Colors';
import { DialogModal, DialogState, defaultDialogState } from '@/components/modals/DialogModal';

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const router = useRouter();
  const [dialog, setDialog] = useState<DialogState>(defaultDialogState);

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return <CameraPermissionView onRequestPermission={requestPermission} />;
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
        setDialog({ visible: true, type: 'error', title: 'Invalid QR', message: 'Invalid Cafe QR code!', buttons: [{ text: 'OK', onPress: () => setTimeout(() => setScanned(false), 2000) }] });
      }
    } catch (e) {
      console.error('[scan] Failed to parse QR JSON:', e);
      setDialog({ visible: true, type: 'error', title: 'Error', message: 'Invalid QR format', buttons: [{ text: 'OK', onPress: () => setTimeout(() => setScanned(false), 2000) }] });
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
        <ScanFrame />
      </SafeAreaView>
      <DialogModal dialog={dialog} setDialog={setDialog} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
    overflow: 'hidden',
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
    backgroundColor: Colors.dark.overlay,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.dark.badge,
  },
  headerBadge: {
    backgroundColor: Colors.dark.overlay,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.dark.badge,
  },
  headerBadgeText: {
    color: Colors.dark.text,
    fontWeight: 'bold',
    letterSpacing: 2,
    fontSize: 12,
    textTransform: 'uppercase',
  },
  headerSpacer: {
    width: 48,
    height: 48,
  },
});
