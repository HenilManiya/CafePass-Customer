import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, Dimensions, ActivityIndicator, ScrollView, Modal, Linking, Animated as RNAnimated, StyleSheet, Platform } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from '@/components/LinearGradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/shared';
import QRCode from 'react-native-qrcode-svg';
import { MotiView, AnimatePresence } from 'moti';
import { ChevronLeft, RefreshCw, Clock, Coffee, QrCode, X, Heart, MapPin, Camera, Phone } from '@/components/Icon';
import { AnimatedBarista } from '@/components/AnimatedBarista';
import { CafeHeader } from '@/components/CafeHeader';
import { CafePassLogo } from '@/components/CafePassLogo';

const { width } = Dimensions.get('window');
const QR_TTL_SECONDS = 2 * 60; // 2 minutes (matches edge function)

// Custom lightweight confetti — no extra package needed
function ConfettiBurst({ visible }: { visible: boolean }) {
  const anims = useRef(
    Array.from({ length: 30 }, () => new RNAnimated.Value(0))
  ).current;
  const props = useRef(
    Array.from({ length: 30 }, (_, i) => ({
      x: (Math.random() - 0.5) * width * 1.4,
      color: ['#C67C4E', '#FFD700', '#FF6B6B', '#4ECDC4', '#A29BFE', '#FD79A8'][i % 6],
      dur: 2200 + Math.random() * 800,
    }))
  ).current;

  useEffect(() => {
    if (!visible) return;
    anims.forEach((a, i) => {
      a.setValue(0);
      RNAnimated.timing(a, { toValue: 1, duration: props[i].dur, useNativeDriver: true }).start();
    });
  }, [visible]);

  if (!visible) return null;
  const screenHeight = Dimensions.get('window').height;
  return (
    <View style={styles.confettiContainer}>
      {anims.map((anim, i) => (
        <RNAnimated.View
          key={i}
          style={[
            styles.confettiParticle,
            {
              transform: [
                { translateX: props[i].x },
                { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [-10, screenHeight + 20] }) },
              ],
              backgroundColor: props[i].color,
              opacity: anim.interpolate({ inputRange: [0, 0.8, 1], outputRange: [1, 1, 0] }),
            }
          ]}
        />
      ))}
    </View>
  );
}

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
        colors={['rgba(0, 0, 0, 0.4)', 'rgba(0, 0, 0, 0.7)', '#1C0F0A']}
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
              <View
                ref={punchCardContainerRef}
                style={styles.punchCardContainer}
              >
                <View style={styles.punchCardPadding}>
                  <View style={styles.punchCardHeader}>
                    <Text style={styles.punchCardTitle}>PUNCH CARD</Text>
                    <Text style={styles.punchCardSubtitle}>Buy {cafeDetails?.max_punches || card?.cafes?.max_punches || 10}, Get 1 Free</Text>
                    {rewardsAvailable > 0 && (
                      <View style={styles.rewardsAvailableBadge}>
                        <Text style={styles.rewardsAvailableText}>🎁 {rewardsAvailable} Reward{rewardsAvailable > 1 ? 's' : ''} Available!</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.slotsGrid}>
                    {Array.from({ length: cafeDetails?.max_punches || card?.cafes?.max_punches || 10 }).map((_, i) => {
                      const isPunched = i < (card?.punch_count || 0);
                      const stampRotations = ['-12deg', '8deg', '-5deg', '15deg', '-8deg', '10deg', '-3deg', '14deg', '-15deg', '6deg'];
                      const rotation = stampRotations[i % stampRotations.length];

                      return (
                        <View key={i} style={styles.slotWrapper}>
                          <View
                            ref={(el) => { slotRefs.current[i] = el; }}
                            onLayout={() => measureSlot(i)}
                            style={styles.slotCircle}
                          >
                            {isPunched && (
                              <MotiView
                                from={{ scale: 1.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ type: 'spring', damping: 14, delay: i * 150 }}
                                style={[styles.stampAnimContainer, { transform: [{ rotate: rotation }] }]}
                              >
                                <View style={styles.stampCircle}>
                                  <Coffee size={28} color="#C67C4E" strokeWidth={2.5} />
                                  <View style={styles.stampBg} />
                                </View>
                              </MotiView>
                            )}

                            {!isPunched && (
                              <Text style={styles.slotNumber}>{i + 1}</Text>
                            )}
                          </View>
                        </View>
                      );
                    })}
                  </View>

                  <Text style={styles.moreForFreeText}>
                    {(cafeDetails?.max_punches || card?.cafes?.max_punches || 10) - (card?.punch_count || 0)} more for a free drink!
                  </Text>
                </View>

                {animatingPunch?.active && (
                  <AnimatedBarista
                    targetSlotIndex={animatingPunch.targetPunches - 1}
                    targetSlotPosition={slotCoordinates[animatingPunch.targetPunches - 1]}
                    onStamp={handleStampHit}
                    onComplete={handleAnimationComplete}
                  />
                )}
              </View>
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
                  <MapPin size={24} color="#C67C4E" />
                </TouchableOpacity>
              )}
              {cafeDetails?.instagram_url && (
                <TouchableOpacity
                  onPress={() => Linking.openURL(cafeDetails.instagram_url)}
                  style={styles.actionLinkBtn}
                >
                  <Camera size={24} color="#E1306C" />
                </TouchableOpacity>
              )}
              {cafeDetails?.mobile_number && (
                <TouchableOpacity
                  onPress={() => Linking.openURL(`tel:${cafeDetails.mobile_number}`)}
                  style={styles.actionLinkBtn}
                >
                  <Phone size={24} color="#34D399" />
                </TouchableOpacity>
              )}
            </View>
          </MotiView>
        </ScrollView>

        <AnimatePresence>
          {isQRModalVisible && (
            <View style={styles.modalOverlay} pointerEvents="box-none">
              <MotiView
                from={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={styles.modalBackdrop}
              >
                <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setIsQRModalVisible(false)} />
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
                      <TouchableOpacity onPress={() => setIsQRModalVisible(false)} style={styles.modalCloseBtn}>
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
                          <ActivityIndicator size="large" color="#000000" />
                          <Text style={styles.qrLoadingText}>Generating...</Text>
                        </View>
                      ) : error ? (
                        <View style={styles.qrError}>
                          <Text style={styles.qrErrorText}>{error}</Text>
                          <TouchableOpacity
                            onPress={() => fetchQRToken(true)}
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
                              color="#000000"
                              backgroundColor="white"
                            />
                          </MotiView>
                        </AnimatePresence>
                      ) : null}
                    </View>

                    {!loading && !error && qrToken && (
                      <View style={styles.timerContainer}>
                        <View style={styles.timerRow}>
                          <Clock size={16} color={isExpired ? '#EF4444' : isExpiringSoon ? '#F59E0B' : 'white'} />
                          <Text style={[styles.timerText, { color: isExpired ? '#EF4444' : isExpiringSoon ? '#F59E0B' : 'white' }]}>
                            {isExpired ? 'QR Expired' : `Expires in ${minutes}:${seconds.toString().padStart(2, '0')}`}
                          </Text>
                        </View>
                        {isExpired && (
                          <TouchableOpacity
                            onPress={() => fetchQRToken(true)}
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
          )}
        </AnimatePresence>
        <ConfettiBurst visible={showConfetti} />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  confettiContainer: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    pointerEvents: 'none',
  },
  confettiParticle: {
    position: 'absolute',
    width: 8, height: 8, borderRadius: 4,
  },
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
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
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
    fontFamily: Platform.select({ ios: 'ui-sans-serif', default: 'sans-serif' }),
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
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
  punchCardContainer: {
    width: '100%',
    borderRadius: 32,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    marginBottom: 32,
  },
  punchCardPadding: {
    padding: 20,
    width: '100%',
  },
  punchCardHeader: {
    alignItems: 'center',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.2)',
    paddingBottom: 8,
  },
  punchCardTitle: {
    color: '#FFFFFF',
    fontFamily: Platform.select({ ios: 'ui-serif', default: 'serif' }),
    fontSize: 24,
    letterSpacing: 2,
  },
  punchCardSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginTop: 4,
    fontWeight: 'bold',
  },
  rewardsAvailableBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 999,
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  rewardsAvailableText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  slotWrapper: {
    width: '20%',
    alignItems: 'center',
    marginBottom: 16,
  },
  slotCircle: {
    width: '80%',
    aspectRatio: 1,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.3)',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  stampAnimContainer: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stampCircle: {
    width: '110%',
    height: '110%',
    borderRadius: 999,
    borderWidth: 3,
    borderColor: '#C67C4E',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  stampBg: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: '#C67C4E',
    opacity: 0.15,
  },
  slotNumber: {
    color: 'rgba(255,255,255,0.5)',
    fontFamily: Platform.select({ ios: 'ui-serif', default: 'serif' }),
    fontSize: 18,
  },
  moreForFreeText: {
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    fontSize: 12,
    fontFamily: Platform.select({ ios: 'ui-serif', default: 'serif' }),
    marginTop: 8,
    fontStyle: 'italic',
  },
  showQRButton: {
    marginTop: 24,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  showQRInner: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  showQRText: {
    color: '#FFFFFF',
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
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 100,
    elevation: 100,
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
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
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  modalContent: {
    width: '100%',
    backgroundColor: 'rgba(20,10,5,0.85)',
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
    fontFamily: Platform.select({ ios: 'ui-serif', default: 'serif' }),
    color: '#FFFFFF',
    fontSize: 24,
    letterSpacing: 1,
    fontWeight: 'bold',
  },
  modalCloseBtn: {
    padding: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 999,
  },
  modalDesc: {
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginBottom: 32,
    fontSize: 14,
  },
  qrContainer: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    borderWidth: 6,
    borderColor: 'rgba(255,255,255,0.1)',
    alignSelf: 'center',
  },
  qrLoading: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 192,
    height: 192,
  },
  qrLoadingText: {
    color: 'rgba(0,0,0,0.6)',
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
    color: '#EF4444',
    textAlign: 'center',
    fontSize: 14,
    marginBottom: 16,
  },
  qrRetryBtn: {
    backgroundColor: '#000000',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  qrRetryText: {
    color: '#FFFFFF',
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
    backgroundColor: 'rgba(255,255,255,0.1)',
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
    backgroundColor: '#C67C4E',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  generateNewText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12,
    marginLeft: 8,
  },
});
