import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, Linking, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from '@/components/LinearGradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/context/AuthContext';
import { supabase } from '@/shared';
import { AnimatedView as MotiView } from '@/components/ui/AnimatedView';
import { ChevronLeft, QrCode, MapPin, Camera, Phone } from '@/components/Icon';
import { CafeHeader } from '@/components/CafeHeader';
import { CafePassLogo } from '@/components/CafePassLogo';
import { ConfettiBurst } from '@/components/ui/ConfettiBurst';
import { PunchCard } from '@/components/cards/PunchCard';
import { QRModal } from '@/components/modals/QRModal';
import { ScrollView } from 'react-native';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';


export default function CafeCardScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const { session } = useAuthStore();
  const router = useRouter();

  const [card, setCard] = useState<any>(null);
  const [cafeDetails, setCafeDetails] = useState<any>(null);
  const [rewardsAvailable, setRewardsAvailable] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isQRModalVisible, setIsQRModalVisible] = useState(false);
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
  useEffect(() => {
    cardRef.current = card;
  }, [card]);

  const fetchCardDetails = useCallback(async () => {
    if (!session || !id) return;

    // Perform a single query to fetch cafe details, along with the user's active card and available rewards
    const { data: cafeData } = await supabase
      .from('cafes')
      .select(`
        *,
        digital_cards (*),
        rewards (id)
      `)
      .eq('id', id)
      .eq('digital_cards.customer_id', session.user.id)
      .eq('digital_cards.is_completed', false)
      .eq('rewards.customer_id', session.user.id)
      .eq('rewards.status', 'AVAILABLE')
      .maybeSingle();

    if (cafeData) {
      // Extract nested data
      const activeCard = cafeData.digital_cards?.[0] || null;
      const rewardsCount = cafeData.rewards?.length || 0;

      setCafeDetails(cafeData);

      if (activeCard) {
        // The original code expected the card to have a nested 'cafes' object with max_punches
        activeCard.cafes = { max_punches: cafeData.max_punches };

        setCard((prev: any) => {
          const max = cafeData.max_punches || prev?.cafes?.max_punches || 10;
          if (prev && prev.punch_count >= max && activeCard.punch_count === 0) {
            return prev;
          }
          return activeCard;
        });
      }

      setRewardsAvailable(rewardsCount);
    }
  }, [id, session]);

  useEffect(() => {
    fetchCardDetails();
  }, []);


  const handleOpenQR = () => {
    setIsQRModalVisible(true);
  };

  const userId = session?.user?.id;

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
                setCard((prev: any) => ({
                  ...newRecord,
                  punch_count: currentPunches,
                  cafes: prev?.cafes
                }));
              }
              animatingRef.current = true;

              const targetIndex = newPunches - 1;
              const slotEl = slotRefs.current[targetIndex];
              const containerEl = punchCardContainerRef.current;

              const startAnimation = () => {
                setAnimatingPunch({ active: true, targetPunches: newPunches });
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
              const max = cafeDetails?.max_punches || 10;
              if (cardRef.current?.punch_count >= max && newPunches === 0) {
                // Do nothing
              } else {
                setCard((prev: any) => ({
                  ...newRecord,
                  cafes: prev?.cafes
                }));
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
        (payload: any) => {
          console.log('[realtime] Rewards updated!');
          const { eventType, new: newRec } = payload;
          if (newRec && newRec.cafe_id === id) {
            if (eventType === 'INSERT' && newRec.status === 'AVAILABLE') {
              setRewardsAvailable((prev) => prev + 1);
            } else if (eventType === 'UPDATE' && newRec.status !== 'AVAILABLE') {
              setRewardsAvailable((prev) => Math.max(0, prev - 1));
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('[realtime] Subscription status:', status);
      });

    return () => {
      console.log('[realtime] Unsubscribing channel...');
      supabase.removeChannel(channel);
    };
  }, [id, userId, cafeDetails]);

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
    }
  };

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
          cafeId={id}
          cafeLogo={cafeDetails?.logo_url}
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
