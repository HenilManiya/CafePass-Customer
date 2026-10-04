import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/shared';
import { useAuthStore } from '@/context/AuthContext';
import { LogOut } from '@/components/Icon';
import { AnimatedView as MotiView } from '@/components/ui/AnimatedView';
import { LinearGradient } from '@/components/LinearGradient';
import { HomeHeader } from '@/components/ui/HomeHeader';
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
        <HomeHeader
          title="Your Cards"
          userName={profile?.name || profile?.full_name || profile?.first_name || session?.user?.user_metadata?.name || session?.user?.user_metadata?.full_name || 'Coffee Lover'}
          onSignOut={signOut}
        />

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
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 140,
  },
});
