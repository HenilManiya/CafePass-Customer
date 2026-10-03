import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Dimensions, StyleSheet, Platform } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { MotiView, AnimatePresence } from 'moti';
import { X, RefreshCw, Clock } from '@/components/Icon';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';

const { width } = Dimensions.get('window');

interface QRModalProps {
  isVisible: boolean;
  onClose: () => void;
  loading: boolean;
  error: string | null;
  qrToken: string | null;
  onRetry: () => void;
  isExpired: boolean;
  isExpiringSoon: boolean;
  minutes: number;
  seconds: number;
}

export function QRModal({
  isVisible,
  onClose,
  loading,
  error,
  qrToken,
  onRetry,
  isExpired,
  isExpiringSoon,
  minutes,
  seconds
}: QRModalProps) {
  if (!isVisible) return null;

  return (
    <View style={styles.modalOverlay} pointerEvents="box-none">
      <MotiView
        from={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={styles.modalBackdrop}
      >
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />
      </MotiView>

      <MotiView
        from={{ translateY: 600 }}
        animate={{ translateY: 0 }}
        exit={{ translateY: 600 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        style={styles.modalSheet}
        pointerEvents="box-none"
      >
        <View style={styles.modalInner}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>CafePass QR</Text>
              <TouchableOpacity onPress={onClose} style={styles.modalCloseBtn}>
                <X size={20} color="white" />
              </TouchableOpacity>
            </View>

            <Text
              style={styles.modalDesc}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              Show this code to the barista for a punch or reward.
            </Text>

            <View style={styles.qrContainer}>
              {loading ? (
                <View style={styles.qrLoading}>
                  <ActivityIndicator size="large" color={Colors.dark.background} />
                  <Text style={styles.qrLoadingText}>Generating...</Text>
                </View>
              ) : error ? (
                <View style={styles.qrError}>
                  <Text style={styles.qrErrorText}>{error}</Text>
                  <TouchableOpacity
                    onPress={onRetry}
                    style={styles.qrRetryBtn}
                  >
                    <RefreshCw size={16} color="white" />
                    <Text style={styles.qrRetryText}>Retry</Text>
                  </TouchableOpacity>
                </View>
              ) : qrToken ? (
                <AnimatePresence exitBeforeEnter>
                  <MotiView
                    key={qrToken}
                    from={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <QRCode
                      value={qrToken}
                      size={width * 0.45}
                      color={Colors.dark.background}
                      backgroundColor="white"
                    />
                  </MotiView>
                </AnimatePresence>
              ) : null}
            </View>

            {!loading && !error && qrToken && (
              <View style={styles.timerContainer}>
                <View style={styles.timerRow}>
                  <Clock size={16} color={isExpired ? Colors.dark.hex_ef4444 : isExpiringSoon ? Colors.dark.hex_f59e0b : 'white'} />
                  <Text style={[styles.timerText, { color: isExpired ? Colors.dark.hex_ef4444 : isExpiringSoon ? Colors.dark.hex_f59e0b : 'white' }]}>
                    {isExpired ? 'QR Expired' : `Expires in ${minutes}:${seconds.toString().padStart(2, '0')}`}
                  </Text>
                </View>
                {isExpired && (
                  <TouchableOpacity
                    onPress={onRetry}
                    style={styles.generateNewBtn}
                  >
                    <RefreshCw size={14} color="white" />
                    <Text style={styles.generateNewText}>Generate New QR</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </View>
      </MotiView>
    </View>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 100,
    elevation: 100,
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: Colors.dark.transparentDark,
  },
  modalSheet: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    width: '100%',
  },
  modalInner: {
    width: '100%',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    borderTopWidth: 1,
    borderColor: Colors.dark.border,
    overflow: 'hidden',
  },
  modalContent: {
    width: '100%',
    backgroundColor: Colors.dark.modalBackground,
    paddingHorizontal: 32,
    paddingTop: 32,
    paddingBottom: 48,
    alignItems: 'center',
  },
  modalHeaderRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontFamily: Typography.serif,
    color: Colors.dark.text,
    fontSize: 24,
    letterSpacing: 1,
    fontWeight: 'bold',
  },
  modalCloseBtn: {
    padding: 10,
    backgroundColor: Colors.dark.border,
    borderRadius: 999,
  },
  modalDesc: {
    color: Colors.dark.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    fontSize: 14,
  },
  qrContainer: {
    backgroundColor: Colors.dark.text,
    padding: 24,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    borderWidth: 6,
    borderColor: Colors.dark.border,
    alignSelf: 'center',
  },
  qrLoading: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 192,
    height: 192,
  },
  qrLoadingText: {
    color: Colors.dark.transparentDark,
    marginTop: 16,
    fontSize: 14,
  },
  qrError: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    width: 192,
    height: 192,
  },
  qrErrorText: {
    color: Colors.dark.hex_ef4444,
    textAlign: 'center',
    fontSize: 14,
    marginBottom: 16,
  },
  qrRetryBtn: {
    backgroundColor: Colors.dark.background,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  qrRetryText: {
    color: Colors.dark.text,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  timerContainer: {
    alignItems: 'center',
    gap: 12,
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.border,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 999,
  },
  timerText: {
    fontWeight: 'bold',
    marginLeft: 10,
    fontSize: 15,
  },
  generateNewBtn: {
    backgroundColor: Colors.dark.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  generateNewText: {
    color: Colors.dark.text,
    fontWeight: 'bold',
    fontSize: 12,
    marginLeft: 8,
  },
});
