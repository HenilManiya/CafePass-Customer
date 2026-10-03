import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Dimensions, StyleSheet, Platform } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '@/shared';
import { useAuthStore } from '@/store/authStore';
import { QrCode, LogOut, Coffee } from '@/components/Icon';
import { MotiView } from 'moti';
import { LinearGradient } from '@/components/LinearGradient';
import { CafeHeader } from '@/components/CafeHeader';
import { CafePassLogo } from '@/components/CafePassLogo';

const { width } = Dimensions.get('window');

export default function Home() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session, profile, signOut } = useAuthStore();
  const [cards, setCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Time based greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchVisitedCafes();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchVisitedCafes();
  }, [session?.user?.id]);

  const fetchVisitedCafes = async () => {
    if (!session?.user) return;
    
    console.log('[home] Fetching digital cards for user:', session.user.id);

    const { data, error } = await supabase
      .from('digital_cards')
      .select('*, cafes(name, logo_url, image_url, max_punches, branch_name, location)')
      .eq('customer_id', session.user.id)
      .eq('is_completed', false);

    if (error) {
      console.error('[home] Failed to fetch digital cards:', error.message);
    } else {
      console.log('[home] Fetched', data?.length ?? 0, 'digital cards');
      if (data) setCards(data);
    }
    setLoading(false);
  };

  const renderCard = ({ item, index }: { item: any; index: number }) => {
    const punches = item?.punch_count || 0;
    const required = item?.cafes?.max_punches || 10;
    const progress = Math.min(Math.max((punches / required) * 100, 0), 100);
    const rewards = item?.rewards_available || 0;

    return (
      <MotiView
        from={{ opacity: 0, translateY: 30 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ delay: index * 100 }}
        style={styles.cardContainer}
      >
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => router.push(`/cafe/${item.cafe_id}`)}
          style={styles.cardWrapper}
        >
          {/* Cafe Image Background */}
          <Image
            source={{ uri: item.cafes?.image_url || 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=600&q=80' }}
            style={styles.cardImage}
            contentFit="cover"
            cachePolicy="memory-disk"
            transition={150}
          />
          
          <View style={styles.cardOverlay}>
            <View style={styles.cardContent}>
              <View style={styles.cardHeader}>
                <CafeHeader 
                  variant="small" 
                  cafeName={item.cafes?.name} 
                  branchName={item.cafes?.branch_name} 
                  logoUrl={item.cafes?.logo_url || undefined} 
                />

                <View style={styles.punchesBadge}>
                  <Text style={styles.punchesText}>{punches}<Text style={styles.punchesRequired}>/{required}</Text></Text>
                </View>
              </View>

              {rewards > 0 && (
                <View style={styles.rewardsBadge}>
                  <Text style={styles.rewardsText}>🎁 {rewards}</Text>
                </View>
              )}

              {/* Progress Bar Area */}
              <View style={styles.progressContainer}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressLabel}>Rewards Progress</Text>
                  <Text 
                    style={styles.progressStatusText}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {required - punches <= 0 ? 'Free drink ready!' : `${required - punches} more for a free drink`}
                  </Text>
                </View>
                
                <View style={styles.progressBarTrack}>
                  <MotiView
                    style={[styles.progressBarFill, { width: `${progress}%` }]}
                    from={{ translateX: -300 }}
                    animate={{ translateX: 0 }}
                    transition={{ type: 'spring', damping: 14, delay: index * 100 + 300 }}
                  />
                </View>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </MotiView>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient 
        colors={['#000000', '#2E1911']} 
        style={StyleSheet.absoluteFill} 
      />
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <MotiView from={{ opacity: 0, translateX: -20 }} animate={{ opacity: 1, translateX: 0 }} style={styles.headerLeft}>
            <CafePassLogo size={42} />
            <View>
              <Text style={styles.greetingText}>
                {greeting}, {profile?.name || profile?.full_name || profile?.first_name || session?.user?.user_metadata?.name || session?.user?.user_metadata?.full_name || 'Coffee Lover'}
              </Text>
              <Text style={styles.headerTitle}>Your Cards</Text>
            </View>
          </MotiView>
          <MotiView from={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }}>
            <TouchableOpacity onPress={signOut} style={styles.signOutButton}>
              <LogOut size={16} color="#C67C4E" />
            </TouchableOpacity>
          </MotiView>
        </View>

      <FlatList
        data={cards}
        keyExtractor={(item, index) => item?.id?.toString() || index.toString()}
        renderItem={renderCard}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListEmptyComponent={
          !loading ? (
            <MotiView
              from={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              style={styles.emptyStateContainer}
            >
              <View style={styles.emptyStateLogoWrapper}>
                <CafePassLogo size={72} />
              </View>
              <Text style={styles.emptyStateTitle}>No cards yet!</Text>
              <Text style={styles.emptyStateDesc}>
                Visit a participating cafe and scan their QR code to grab your first digital punch card.
              </Text>
            </MotiView>
          ) : null
        }
      />

      {/* Floating Action Button */}
      <View style={[styles.fabContainer, { paddingBottom: Math.max(insets.bottom + 16, 32) }]} pointerEvents="box-none">
        <MotiView
          from={{ translateY: 100, opacity: 0 }}
          animate={{ translateY: 0, opacity: 1 }}
          transition={{ type: 'spring', damping: 15, delay: 400 }}
        >
          <TouchableOpacity
            onPress={() => router.push('/scan')}
            activeOpacity={0.8}
            style={styles.fabWrapper}
          >
            {/* Subtle pulse effect */}
            <MotiView
              from={{ opacity: 0.5, scale: 1 }}
              animate={{ opacity: 0, scale: 1.2 }}
              transition={{ loop: true, type: 'timing', duration: 2000 }}
              style={styles.fabPulse}
            />
            
            {/* Proper High-End FAB */}
            <View style={styles.fabButton}>
              <QrCode color="white" size={20} />
              <Text style={styles.fabText}>Scan QR</Text>
            </View>
          </TouchableOpacity>
        </MotiView>
      </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
    zIndex: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  greetingText: {
    color: '#C67C4E',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 2,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: Platform.select({ ios: 'ui-serif', default: 'serif' }),
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  signOutButton: {
    backgroundColor: 'rgba(198, 124, 78, 0.1)',
    padding: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(198, 124, 78, 0.2)',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 140,
  },
  cardContainer: {
    marginBottom: 24,
  },
  cardWrapper: {
    borderRadius: 32,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#27272a',
    backgroundColor: '#18181b',
  },
  cardImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  cardOverlay: {
    width: '100%',
    backgroundColor: 'rgba(15,8,4,0.72)',
  },
  cardContent: {
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  punchesBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  punchesText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
    fontFamily: Platform.select({ ios: 'ui-serif', default: 'serif' }),
  },
  punchesRequired: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
  },
  rewardsBadge: {
    position: 'absolute',
    top: 20,
    right: 80,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  rewardsText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  progressContainer: {
    marginTop: 4,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontWeight: 'bold',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  progressStatusText: {
    color: '#C67C4E',
    fontWeight: 'bold',
    fontSize: 12,
    fontStyle: 'italic',
    flex: 1,
    textAlign: 'right',
  },
  progressBarTrack: {
    height: 10,
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 999,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.5)',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#C67C4E',
    borderRadius: 999,
  },
  emptyStateContainer: {
    marginTop: 80,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyStateLogoWrapper: {
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontFamily: Platform.select({ ios: 'ui-serif', default: 'serif' }),
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyStateDesc: {
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    fontSize: 15,
    paddingHorizontal: 16,
    lineHeight: 24,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  fabWrapper: {
    position: 'relative',
  },
  fabPulse: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(198, 124, 78, 0.2)',
    borderRadius: 999,
  },
  fabButton: {
    backgroundColor: '#C67C4E',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(198, 124, 78, 0.1)',
    shadowColor: '#C67C4E',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
  },
  fabText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 15,
    letterSpacing: 0.5,
    marginLeft: 12,
  },
});
