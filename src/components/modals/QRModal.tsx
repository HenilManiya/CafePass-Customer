import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Dimensions, StyleSheet, Animated } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { X, RefreshCw } from '@/components/Icon';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';

import { supabase } from '@/shared';

const { width } = Dimensions.get('window');

interface QRModalProps {
  isVisible: boolean;
  onClose: () => void;
  cafeId: string | null;
  cafeLogo?: string;
}

export function QRModal({
  isVisible,
  onClose,
  cafeId,
  cafeLogo
}: QRModalProps) {
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(600)).current;
  const qrOpacity = useRef(new Animated.Value(0)).current;
  const qrScale = useRef(new Animated.Value(0.95)).current;
  const [render, setRender] = useState(isVisible);

  const fetchQRToken = async (id: string, isManual = false) => {
    if (!isManual) setLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('refresh-qr', {
        body: { cafe_id: id },
      });

      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);

      setQrToken(data.token);
    } catch (e: any) {
      setError(e.message || 'Failed to generate QR. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isVisible && cafeId) {
      fetchQRToken(cafeId, false);
    } else if (!isVisible) {
      setQrToken(null);
    }
  }, [isVisible, cafeId]);

  const onRetry = () => {
    if (cafeId) fetchQRToken(cafeId, true);
  };

  useEffect(() => {
    if (isVisible) {
      setRender(true);
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          damping: 25,
          stiffness: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 600,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start(() => setRender(false));
    }
  }, [isVisible, opacity, translateY]);

  useEffect(() => {
    if (qrToken && isVisible) {
      qrOpacity.setValue(0);
      qrScale.setValue(0.95);
      Animated.parallel([
        Animated.timing(qrOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(qrScale, {
          toValue: 1,
          friction: 5,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [qrToken, isVisible, qrOpacity, qrScale]);

  if (!render) return null;

  return (
    <View style={styles.modalOverlay} pointerEvents="box-none">
      <Animated.View style={[styles.modalBackdrop, { opacity }]}>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />
      </Animated.View>

      <Animated.View
        style={[styles.modalSheet, { transform: [{ translateY }] }]}
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
                <Animated.View
                  key={qrToken}
                  style={{ opacity: qrOpacity, transform: [{ scale: qrScale }] }}
                >
                  <QRCode
                    value={qrToken}
                    size={width * 0.45}
                    color={Colors.dark.background}
                    backgroundColor="white"
                    logo={cafeLogo ? { uri: cafeLogo } : undefined}
                    logoSize={width * 0.12}
                    logoBorderRadius={8}
                    logoBackgroundColor="transparent"
                    logoMargin={0}
                  />
                </Animated.View>
              ) : null}
            </View>
          </View>
        </View>
      </Animated.View>
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
    padding: 12,
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

});
