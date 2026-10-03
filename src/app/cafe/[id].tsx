import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, Linking, StyleSheet, Platform } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from '@/components/LinearGradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/context/AuthContext';
import { supabase } from '@/shared';
import { MotiView } from 'moti';
import { ChevronLeft, QrCode, MapPin, Camera, Phone } from '@/components/Icon';
import { CafeHeader } from '@/components/CafeHeader';
import { CafePassLogo } from '@/components/CafePassLogo';
import { ConfettiBurst } from '@/components/ui/ConfettiBurst';
import { PunchCard } from '@/components/cards/PunchCard';
import { QRModal } from '@/components/modals/QRModal';
import { ScrollView } from 'react-native';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';

const QR_TTL_SECONDS = 2 * 60;

export default function CafeCardScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const { session } = useAuthStore();
  const router = useRouter();

  const [qrToken, setQrToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(QR_TTL_SECONDS);
  const [refreshing, setRefreshing] = useState(false);
  const [card, setCard] = useState<any>(null);
  const [cafeDetails, setCafeDetails] = useState<any>(null);
  const [rewardsAvailable, setRewardsAvailable] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isQRModalVisible, setIsQRModalVisible] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [animatingPunch, setAnimatingPunch] = useState<{ active: boolean, targetPunches: number } | null>(null);

  const animatingRef = useRef(false);

  const punchCardContainerRef = useRef<View>(null);
  const slotRefs = useRef<Record<number, View | null>>({});
  const [slotCoordinates, setSlotCoordinates] = useState<Record<number, { x: number; y: number }>>({});

  const measureSlot = (index: number) => {
    const slotEl = slotRefs.current[index];
    const containerEl = punchCardContainerRef.current;
    if (slotEl && containerEl) {
      slotEl.measureLayout(
        containerEl,
        (left, top, slotWidth, height) => {
          setSlotCoordinates((prev) => ({
            ...prev,
            [index]: { x: left + slotWidth / 2, y: top + height / 2 },
          }));
        },
        () => { }
      );
    }
  };

  const cardRef = useRef<any>(null);
  const cafeRef = useRef<any>(null);
  useEffect(() => {
    cardRef.current = card;
  }, [card]);
  useEffect(() => {
    cafeRef.current = cafeDetails;
  }, [cafeDetails]);

  const fetchCardDetails = useCallback(async () => {
    if (!session || !id) return;

    const [cardRes, cafeRes, rewardsRes] = await Promise.all([
      supabase
        .from('digital_cards')
        .select('*, cafes(max_punches)')
        .eq('customer_id', session.user.id)
        .eq('cafe_id', id)
        .eq('is_completed', false)
        .maybeSingle(),
      supabase
        .from('cafes')
        .select('*')
        .eq('id', id)
        .maybeSingle(),
      supabase
        .from('rewards')
        .select('id')
        .eq('customer_id', session.user.id)
        .eq('cafe_id', id)
        .eq('status', 'AVAILABLE'),
    ]);

    if (cardRes.data) {
      setCard((prev: any) => {
        const max = cafeRef.current?.max_punches || prev?.cafes?.max_punches || 10;
        if (prev && prev.punch_count >= max && cardRes.data.punch_count === 0) {
          return prev;
        }
        return cardRes.data;
      });
    }

    if (cafeRes.data) {
      setCafeDetails(cafeRes.data);
    }

    setRewardsAvailable(rewardsRes.data?.length || 0);
  }, [id, session]);

  const fetchQRToken = useCallback(async (isManual = false) => {
    if (!id || !session) return;
    console.log(`[cafe-card] Fetching QR token for cafe: ${id} (manual: ${isManual})`);

    if (isManual) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('refresh-qr', {
        body: { cafe_id: id },
      });

      if (fnError) {
        console.error('[cafe-card] refresh-qr error:', fnError.message);
        throw fnError;
      }
      if (data?.error) {
        console.error('[cafe-card] refresh-qr returned error:', data.error);
        throw new Error(data.error);
      }

      console.log('[cafe-card] ✅ Got JWT token, sessionId:', data?.sessionId, 'expiresAt:', data?.expiresAt);
      setQrToken(data.token);
      setSecondsLeft(QR_TTL_SECONDS);
    } catch (e: any) {
      setError(e.message || 'Failed to generate QR. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id, session]);

  useEffect(() => {
    fetchCardDetails();
  }, [fetchCardDetails]);

  useEffect(() => {
    if (!qrToken || !isQRModalVisible) return;

    const interval = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(interval);
          return 0;
        }
        return s - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [qrToken, isQRModalVisible]);

  const handleOpenQR = () => {
    setIsQRModalVisible(true);
    fetchQRToken(false);
  };

  const userId = session?.user?.id;
  const fetchCardDetailsRef = useRef(fetchCardDetails);
  useEffect(() => {
    fetchCardDetailsRef.current = fetchCardDetails;
  }, [fetchCardDetails]);

  useEffect(() => {
    if (!userId || !id) return;

    const channelName = `customer_channel_${userId}_${id}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'digital_cards',
          filter: `customer_id=eq.${userId}`,
        },
        (payload) => {
          console.log('[realtime] Card updated via scan!', payload);
          const newRecord = payload.new as any;
          if (newRecord && newRecord.cafe_id === id) {
            const isNewCard = cardRef.current && cardRef.current.id !== newRecord.id;
            const currentPunches = isNewCard ? 0 : (cardRef.current?.punch_count || 0);
            const newPunches = newRecord.punch_count;

            console.log(`[realtime] punches: current=${currentPunches}, new=${newPunches}`);

            if (newPunches > currentPunches) {
              if (!cardRef.current || isNewCard) {
                setCard({ ...newRecord, punch_count: currentPunches });
              }
              animatingRef.current = true;
              
              const targetIndex = newPunches - 1;
              const slotEl = slotRefs.current[targetIndex];
              const containerEl = punchCardContainerRef.current;
              
              const startAnimation = () => {
                setAnimatingPunch({ active: true, targetPunches: newPunches });
                setSecondsLeft(15);
                setIsQRModalVisible(false);
              };

              if (slotEl && containerEl) {
                slotEl.measureLayout(
                  containerEl,
                  (left, top, slotWidth, height) => {
                    setSlotCoordinates((prev) => ({
                      ...prev,
                      [targetIndex]: { x: left + slotWidth / 2, y: top + height / 2 },
                    }));
                    startAnimation();
                  },
                  () => {
                    startAnimation();
                  }
                );
              } else {
                startAnimation();
              }
            } else if (!newRecord.is_completed && !animatingRef.current) {
              const max = cafeRef.current?.max_punches || 10;
              if (cardRef.current?.punch_count >= max && newPunches === 0) {
                // Do nothing
              } else {
                setCard(newRecord);
                fetchCardDetailsRef.current();
              }
              setIsQRModalVisible(false);
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rewards',
          filter: `customer_id=eq.${userId}`,
        },
        (payload) => {
          console.log('[realtime] Rewards updated!');
          fetchCardDetailsRef.current();
        }
      )
      .subscribe((status) => {
        console.log('[realtime] Subscription status:', status);
      });

    return () => {
      console.log('[realtime] Unsubscribing channel...');
      supabase.removeChannel(channel);
    };
  }, [id, userId]);

  const handleStampHit = () => {
    if (animatingPunch) {
      setCard((prev: any) => ({
        ...(prev || {}),
        punch_count: animatingPunch.targetPunches,
      }));
    }
  };

  const handleAnimationComplete = () => {
    animatingRef.current = false;
    const maxPunches = cafeDetails?.max_punches || card?.cafes?.max_punches || 10;
    const isCompleted = animatingPunch?.targetPunches && animatingPunch.targetPunches >= maxPunches;

    setAnimatingPunch(null);

    if (isCompleted) {
      setShowConfetti(true);
      if (session?.user?.id) {
        supabase
          .from('rewards')
          .select('id')
          .eq('customer_id', session.user.id)
          .eq('cafe_id', id)
          .eq('status', 'AVAILABLE')
          .then(({ data }) => setRewardsAvailable(data?.length || 0));
      }
    } else {
      fetchCardDetails();
    }
  };

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const isExpired = secondsLeft <= 0;
  const isExpiringSoon = secondsLeft <= 15 && !isExpired;

  return (
    <View style={styles.container}>
      {cafeDetails?.image_url && (
        <Image
          source={{ uri: cafeDetails.image_url }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          cachePolicy="memory-disk"
          transition={200}
        />
      )}
      <LinearGradient
        colors={[Colors.dark.overlay, Colors.dark.gradientDark, Colors.dark.hex_1c0f0a]}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.topHeader}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <ChevronLeft size={24} color="white" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer} pointerEvents="none">
            <CafePassLogo size={24} />
            <Text style={styles.headerTitleText}>CafePass</Text>
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 200 }}
            style={styles.contentWrapper}
          >
            {cafeDetails && (
              <View style={styles.cafeHeaderWrapper}>
                <CafeHeader
                  variant="large"
                  cafeName={cafeDetails.name}
                  branchName={cafeDetails.branch_name}
                  logoUrl={cafeDetails.logo_url}
                />
              </View>
            )}

            {(card || cafeDetails) && (
              <PunchCard 
                punchCardContainerRef={punchCardContainerRef}
                cafeDetails={cafeDetails}
                card={card}
                rewardsAvailable={rewardsAvailable}
                slotRefs={slotRefs}
                measureSlot={measureSlot}
                animatingPunch={animatingPunch}
                slotCoordinates={slotCoordinates}
                handleStampHit={handleStampHit}
                handleAnimationComplete={handleAnimationComplete}
              />
            )}

            <TouchableOpacity
              onPress={handleOpenQR}
              style={styles.showQRButton}
            >
              <View style={styles.showQRInner}>
                <QrCode size={18} color="white" />
                <Text style={styles.showQRText}>Show QR to Scan</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.actionLinksRow}>
              {cafeDetails?.location && (
                <TouchableOpacity
                  onPress={() => Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(cafeDetails.location)}`)}
                  style={styles.actionLinkBtn}
                >
                  <MapPin size={24} color={Colors.dark.primary} />
                </TouchableOpacity>
              )}
              {cafeDetails?.instagram_url && (
                <TouchableOpacity
                  onPress={() => Linking.openURL(cafeDetails.instagram_url)}
                  style={styles.actionLinkBtn}
                >
                  <Camera size={24} color={Colors.dark.hex_e1306c} />
                </TouchableOpacity>
              )}
              {cafeDetails?.mobile_number && (
                <TouchableOpacity
                  onPress={() => Linking.openURL(`tel:${cafeDetails.mobile_number}`)}
                  style={styles.actionLinkBtn}
                >
                  <Phone size={24} color={Colors.dark.hex_34d399} />
                </TouchableOpacity>
              )}
            </View>
          </MotiView>
        </ScrollView>

        <QRModal 
          isVisible={isQRModalVisible}
          onClose={() => setIsQRModalVisible(false)}
          loading={loading}
          error={error}
          qrToken={qrToken}
          onRetry={() => fetchQRToken(true)}
          isExpired={isExpired}
          isExpiringSoon={isExpiringSoon}
          minutes={minutes}
          seconds={seconds}
        />
        <ConfettiBurst visible={showConfetti} />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  topHeader: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    zIndex: 10,
  },
  backButton: {
    width: 48,
    height: 48,
    backgroundColor: Colors.dark.shadowLight,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.dark.badge,
  },
  headerTitleContainer: {
    position: 'absolute',
    left: 0, right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  headerTitleText: {
    fontFamily: Typography.sans,
    fontSize: 14,
    color: Colors.dark.textPrimary,
    textTransform: 'uppercase',
    letterSpacing: 2,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 32,
  },
  contentWrapper: {
    width: '100%',
    alignItems: 'center',
    flexGrow: 1,
    justifyContent: 'center',
  },
  cafeHeaderWrapper: {
    marginBottom: 24,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },

  showQRButton: {
    marginTop: 24,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.dark.badge,
    overflow: 'hidden',
    backgroundColor: Colors.dark.badge,
  },
  showQRInner: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  showQRText: {
    color: Colors.dark.text,
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 8,
  },
  actionLinksRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    marginTop: 40,
  },
  actionLinkBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.dark.overlay,
    borderWidth: 2,
    borderColor: Colors.dark.badge,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
