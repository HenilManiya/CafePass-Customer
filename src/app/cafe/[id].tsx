import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, Dimensions, ActivityIndicator, ScrollView, Modal, Linking, Animated as RNAnimated } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
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
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none' }}>
      {anims.map((anim, i) => (
        <RNAnimated.View
          key={i}
          style={{
            position: 'absolute',
            transform: [
              { translateX: props[i].x },
              { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [-10, screenHeight + 20] }) },
            ],
            width: 8, height: 8, borderRadius: 4,
            backgroundColor: props[i].color,
            opacity: anim.interpolate({ inputRange: [0, 0.8, 1], outputRange: [1, 1, 0] }),
          }}
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
        (left, top, width, height) => {
          setSlotCoordinates((prev) => ({
            ...prev,
            [index]: { x: left + width / 2, y: top + height / 2 },
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

    // Run active card, cafe details, and rewards count queries in parallel
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
        // If the screen is proudly displaying a completed card, don't overwrite it with a blank one!
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

  // Initial fetch: only load card details, do NOT pre-generate QR
  useEffect(() => {
    fetchCardDetails();
  }, [fetchCardDetails]);

  // Countdown timer: counts down while modal is visible, no continuous generation
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
    fetchQRToken(false); // Only generate QR when user clicks Show QR button
  };

  const userId = session?.user?.id;
  const fetchCardDetailsRef = useRef(fetchCardDetails);
  useEffect(() => {
    fetchCardDetailsRef.current = fetchCardDetails;
  }, [fetchCardDetails]);

  // Listen for real-time punch updates from the Cafe!
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
              setAnimatingPunch({ active: true, targetPunches: newPunches });
              setSecondsLeft(15);
              setIsQRModalVisible(false); // Close modal on successful punch
            } else if (!newRecord.is_completed && !animatingRef.current) {
              const max = cafeRef.current?.max_punches || 10;
              if (cardRef.current?.punch_count >= max && newPunches === 0) {
                // Do nothing, let them admire their fully stamped card!
              } else {
                setCard(newRecord);
                fetchCardDetailsRef.current();
              }
              setIsQRModalVisible(false); // Close modal on any valid update
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

    // If we just stamped the final punch, keep the completed card on screen 
    // so the user can bask in its glory! Just fetch the rewards to update the UI badge.
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
    <View className="flex-1 ">
      {/* Dynamic Aesthetic Background */}
      {cafeDetails?.image_url && (
        <Image
          source={{ uri: cafeDetails.image_url }}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' }}
          contentFit="cover"
          cachePolicy="memory-disk"
          transition={200}
        />
      )}
      <LinearGradient
        colors={['rgba(0, 0, 0, 0.4)', 'rgba(0, 0, 0, 0.7)', '#1C0F0A']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' }}
      />

      <SafeAreaView className="flex-1">
        {/* Header */}
        <View className="px-4 py-4 flex-row items-center relative z-10">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-12 h-12 bg-black/30 rounded-full items-center justify-center border border-white/20 backdrop-blur-md"
          >
            <ChevronLeft size={24} color="white" />
          </TouchableOpacity>
          <View className="absolute inset-x-0 flex-row items-center justify-center pointer-events-none gap-2">
            <CafePassLogo size={24} />
            <Text className="font-sans text-sm text-white/80 uppercase tracking-widest font-bold">CafePass</Text>
          </View>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
        >
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 200 }}
            className="w-full items-center"
            style={{ flexGrow: 1, justifyContent: 'center' }}
          >
            {/* Cafe Info Header above card */}
            {cafeDetails && (
              <View className="mb-6 w-full items-center justify-center">
                <CafeHeader
                  variant="large"
                  cafeName={cafeDetails.name}
                  branchName={cafeDetails.branch_name}
                  logoUrl={cafeDetails.logo_url}
                />
              </View>
            )}

            {/* Digital Punch Card */}
            {(card || cafeDetails) && (
              <View
                ref={punchCardContainerRef}
                className="w-full shadow-lg border border-white/20 mb-8 relative"
                style={{ borderRadius: 32, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.15)' }}
              >
                <View className="p-5 w-full">
                  <View className="items-center mb-3 border-b border-white/20 pb-2">
                    <Text className="text-white font-serif text-2xl tracking-widest shadow-sm">PUNCH CARD</Text>
                    <Text className="text-white/80 text-[10px] uppercase tracking-[0.2em] mt-1 font-bold">Buy {cafeDetails?.max_punches || card?.cafes?.max_punches || 10}, Get 1 Free</Text>
                    {rewardsAvailable > 0 && (
                      <View className="bg-white/20 px-4 py-1.5 rounded-full mt-3 shadow-sm border border-white/10">
                        <Text className="text-white font-bold text-xs uppercase tracking-widest">🎁 {rewardsAvailable} Reward{rewardsAvailable > 1 ? 's' : ''} Available!</Text>
                      </View>
                    )}
                  </View>

                  <View className="flex-row flex-wrap justify-center px-1">
                    {Array.from({ length: cafeDetails?.max_punches || card?.cafes?.max_punches || 10 }).map((_, i) => {
                      const isPunched = i < (card?.punch_count || 0);
                      // Fixed pseudo-random rotations to make the stamps feel hand-pressed
                      const stampRotations = ['-12deg', '8deg', '-5deg', '15deg', '-8deg', '10deg', '-3deg', '14deg', '-15deg', '6deg'];
                      const rotation = stampRotations[i % stampRotations.length];

                      return (
                        <View
                          key={i}
                          className="w-[20%] items-center mb-4"
                        >
                          <View
                            ref={(el) => { slotRefs.current[i] = el; }}
                            onLayout={() => measureSlot(i)}
                            className="rounded-full items-center justify-center border-2 border-dashed border-white/30 bg-white/10 relative"
                            style={{ width: '80%', aspectRatio: 1 }}
                          >
                            {isPunched && (
                              <MotiView
                                from={{ scale: 1.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ type: 'spring', damping: 14, delay: i * 150 }}
                                style={{ transform: [{ rotate: rotation }] }}
                                className="absolute inset-0 items-center justify-center"
                              >
                                {/* The "Ink Stamp" */}
                                <View className="w-[110%] h-[110%] rounded-full border-[3px] border-primary items-center justify-center bg-transparent overflow-hidden">
                                  <Coffee size={28} color="#C67C4E" strokeWidth={2.5} />
                                  <View className="absolute inset-0 bg-primary opacity-[0.15]" />
                                </View>
                              </MotiView>
                            )}

                            {!isPunched && (
                              <Text className="text-white/50 font-serif text-lg">{i + 1}</Text>
                            )}
                          </View>
                        </View>
                      );
                    })}
                  </View>

                  <Text className="text-white/80 text-center text-xs font-serif mt-2 italic">
                    {(cafeDetails?.max_punches || card?.cafes?.max_punches || 10) - (card?.punch_count || 0)} more for a free drink!
                  </Text>
                </View>

                {/* The Animated Barista Character overlay (Now positioned inside the card!) */}
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
              className="mt-6 rounded-full shadow-sm border border-white/20 overflow-hidden relative bg-white/20"
            >
              <View className="py-2 px-5 flex-row items-center justify-center">
                <QrCode size={18} color="white" />
                <Text className="text-white font-sans font-semibold text-sm ml-2">Show QR to Scan</Text>
              </View>
            </TouchableOpacity>

            {/* Bottom Action Links */}
            <View className="flex-row flex-wrap justify-center items-center gap-4 mt-10">
              {cafeDetails?.location && (
                <TouchableOpacity
                  onPress={() => Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(cafeDetails.location)}`)}
                  className="w-14 h-14 rounded-full bg-black/40 border-2 border-white/20 shadow-lg items-center justify-center backdrop-blur-md"
                >
                  <MapPin size={24} color="#C67C4E" />
                </TouchableOpacity>
              )}
              {cafeDetails?.instagram_url && (
                <TouchableOpacity
                  onPress={() => Linking.openURL(cafeDetails.instagram_url)}
                  className="w-14 h-14 rounded-full bg-black/40 border-2 border-white/20 shadow-lg items-center justify-center backdrop-blur-md"
                >
                  <Camera size={24} color="#E1306C" />
                </TouchableOpacity>
              )}
              {cafeDetails?.mobile_number && (
                <TouchableOpacity
                  onPress={() => Linking.openURL(`tel:${cafeDetails.mobile_number}`)}
                  className="w-14 h-14 rounded-full bg-black/40 border-2 border-white/20 shadow-lg items-center justify-center backdrop-blur-md"
                >
                  <Phone size={24} color="#34D399" />
                </TouchableOpacity>
              )}
            </View>
          </MotiView>
        </ScrollView>

        {/* QR Code Bottom Sheet */}
        <AnimatePresence>
          {isQRModalVisible && (
            <View
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, elevation: 100 }}
              pointerEvents="box-none"
            >
              {/* Dark backdrop overlay */}
              <MotiView
                from={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60"
              >
                <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setIsQRModalVisible(false)} />
              </MotiView>

              <MotiView
                from={{ translateY: 600 }}
                animate={{ translateY: 0 }}
                exit={{ translateY: 600 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="absolute bottom-0 left-0 right-0 w-full"
                pointerEvents="box-none"
              >
                <View className="w-full shadow-[0_-20px_50px_rgba(0,0,0,0.6)] overflow-hidden rounded-t-[40px] border-t border-white/10" style={{ borderTopLeftRadius: 40, borderTopRightRadius: 40 }}>
                  <View className="w-full" style={{ backgroundColor: 'rgba(20,10,5,0.85)' }}>
                    <View className="w-full px-8 pt-8 pb-12 items-center">

                      <View className="w-full flex-row justify-between items-center mb-6">
                        <Text className="font-serif text-white text-2xl tracking-wide font-bold">CafePass QR</Text>
                        <TouchableOpacity onPress={() => setIsQRModalVisible(false)} className="p-2.5 bg-white/10 rounded-full">
                          <X size={20} color="white" />
                        </TouchableOpacity>
                      </View>

                      <Text
                        className="font-sans text-white/70 text-center mb-8 text-sm"
                        numberOfLines={1}
                        adjustsFontSizeToFit
                      >
                        Show this code to the barista for a punch or reward.
                      </Text>

                      {/* Scannable White QR Container */}
                      <View className="bg-white p-6 rounded-[28px] items-center justify-center mb-8 shadow-lg self-center border-[6px] border-white/10">
                        {loading ? (
                          <View className="items-center justify-center w-48 h-48">
                            <ActivityIndicator size="large" color="#000000" />
                            <Text className="text-black/60 mt-4 font-sans text-sm">Generating...</Text>
                          </View>
                        ) : error ? (
                          <View className="items-center justify-center px-4 w-48 h-48">
                            <Text className="text-red-500 text-center font-sans text-sm mb-4">{error}</Text>
                            <TouchableOpacity
                              onPress={() => fetchQRToken(true)}
                              className="bg-black px-6 py-3.5 rounded-[20px] flex-row items-center"
                            >
                              <RefreshCw size={16} color="white" />
                              <Text className="text-white font-bold ml-2">Retry</Text>
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

                      {/* Timer */}
                      {!loading && !error && qrToken && (
                        <View className="flex-col items-center gap-3">
                          <View className="flex-row items-center bg-white/10 px-5 py-3 rounded-full shadow-sm self-center">
                            <Clock size={16} color={isExpired ? '#EF4444' : isExpiringSoon ? '#F59E0B' : 'white'} />
                            <Text style={{ color: isExpired ? '#EF4444' : isExpiringSoon ? '#F59E0B' : 'white' }} className="font-bold ml-2.5 font-sans text-[15px]">
                              {isExpired ? 'QR Expired' : `Expires in ${minutes}:${seconds.toString().padStart(2, '0')}`}
                            </Text>
                          </View>
                          {isExpired && (
                            <TouchableOpacity
                              onPress={() => fetchQRToken(true)}
                              className="bg-primary px-5 py-2.5 rounded-full flex-row items-center shadow-md"
                            >
                              <RefreshCw size={14} color="white" />
                              <Text className="text-white font-sans font-bold text-xs ml-2">Generate New QR</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      )}

                    </View>
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
