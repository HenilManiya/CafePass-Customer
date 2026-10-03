import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/shared';
import { useAuthStore } from '@/context/AuthContext';
import { LogOut } from '@/components/Icon';
import { MotiView } from 'moti';
import { LinearGradient } from '@/components/LinearGradient';
import { CafePassLogo } from '@/components/CafePassLogo';
import { DigitalCard } from '@/components/cards/DigitalCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { FloatingActionButton } from '@/components/ui/FloatingActionButton';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';

export default function Home() {
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

  const renderCard = ({ item, index }: { item: any; index: number }) => (
    <DigitalCard item={item} index={index} />
  );

  return (
    <View style={styles.container}>
      <LinearGradient 
        colors={[Colors.dark.background, Colors.dark.hex_2e1911]} 
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
              <LogOut size={16} color={Colors.dark.primary} />
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
          ListEmptyComponent={!loading ? <EmptyState /> : null}
        />

        <FloatingActionButton />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
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
    borderBottomColor: Colors.dark.rgba_255_255_255_0_05,
    backgroundColor: Colors.dark.rgba_0_0_0_0_2,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  greetingText: {
    color: Colors.dark.primary,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 2,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: Typography.serif,
    color: Colors.dark.text,
    letterSpacing: -0.5,
  },
  signOutButton: {
    backgroundColor: Colors.dark.primaryLight,
    padding: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.dark.primaryMuted,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 140,
  },
});
