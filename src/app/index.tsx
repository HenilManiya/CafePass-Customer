import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, Dimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '@/shared';
import { useAuthStore } from '@/store/authStore';
import { QrCode, LogOut, Coffee } from '@/components/Icon';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
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
  }, []);

  const fetchVisitedCafes = async () => {
    if (!session?.user) {
      console.warn('[home] fetchVisitedCafes: no session, skipping');
      return;
    }
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
        className="mb-6 shadow-2xl"
      >
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => router.push(`/cafe/${item.cafe_id}`)}
          className="rounded-[32px] overflow-hidden border border-zinc-800 bg-zinc-900 relative shadow-lg"
        >
          {/* Cafe Image Background */}
          <Image
            source={{ uri: item.cafes?.image_url ? `${item.cafes.image_url}?t=${new Date().getTime()}` : 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=600&q=80' }}
            className="absolute inset-0 w-full h-full"
            resizeMode="cover"
          />
          
          <View className="w-full" style={{ backgroundColor: 'rgba(15,8,4,0.72)' }}>
            <View className="p-6">
              <View className="flex-row justify-between items-start mb-6">
                <CafeHeader 
                  variant="small" 
                  cafeName={item.cafes?.name} 
                  branchName={item.cafes?.branch_name} 
                  logoUrl={item.cafes?.logo_url ? `${item.cafes.logo_url}?t=${new Date().getTime()}` : undefined} 
                />

                <View className="bg-white/20 px-3.5 py-1.5 rounded-full border border-white/10 items-center justify-center">
                  <Text className="text-white font-bold text-base font-serif">{punches}<Text className="text-white/70 text-xs">/{required}</Text></Text>
                </View>
              </View>

              {rewards > 0 && (
                <View className="absolute top-6 right-20 bg-white/20 px-3 py-1 rounded-full shadow-lg border border-white/10">
                  <Text className="text-white font-bold text-xs">🎁 {rewards}</Text>
                </View>
              )}

              {/* Progress Bar Area */}
              <View className="mt-2">
                <View className="flex-row justify-between mb-3 items-end">
                  <Text className="text-white/70 font-bold text-[10px] uppercase tracking-[0.1em]">Rewards Progress</Text>
                  <Text className="text-primary font-bold text-xs italic">{required - punches} more for a free drink!</Text>
                </View>
                
                <View className="h-3 w-full bg-white/10 rounded-full overflow-hidden border border-black/50">
                  <MotiView
                    className="h-full bg-primary rounded-full shadow-lg shadow-primary/40"
                    style={{ width: `${progress}%` }}
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
    <View className="flex-1 bg-black">
      <LinearGradient 
        colors={['#000000', '#2E1911']} 
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} 
      />
      <SafeAreaView className="flex-1">
        {/* Header */}
        <View className="flex-row justify-between items-end px-6 pt-8 pb-6 z-10 shadow-sm border-b border-white/5 bg-black/20">
          <MotiView from={{ opacity: 0, translateX: -20 }} animate={{ opacity: 1, translateX: 0 }} className="flex-row items-center gap-3">
            <CafePassLogo size={42} />
            <View>
              <Text className="text-primary text-[10px] uppercase tracking-[0.2em] font-bold mb-0.5">
                {greeting}, {profile?.name || profile?.full_name || profile?.first_name || session?.user?.user_metadata?.name || session?.user?.user_metadata?.full_name || 'Coffee Lover'}
              </Text>
              <Text className="text-2xl font-serif text-white tracking-tight">Your Cards</Text>
            </View>
          </MotiView>
          <MotiView from={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }}>
            <TouchableOpacity onPress={signOut} className="bg-primary/10 p-3 rounded-full shadow-md border border-primary/20">
              <LogOut size={16} color="#C67C4E" />
            </TouchableOpacity>
          </MotiView>
        </View>

      <FlatList
        data={cards}
        keyExtractor={(item, index) => item?.id?.toString() || index.toString()}
        renderItem={renderCard}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListEmptyComponent={
          !loading ? (
            <MotiView
              from={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-20 items-center px-6"
            >
              <View className="mb-4 items-center justify-center">
                <CafePassLogo size={72} />
              </View>
              <Text className="text-white text-2xl font-serif mb-3 text-center">No cards yet!</Text>
              <Text className="text-white/70 text-center text-[15px] font-sans px-4 leading-relaxed">
                Visit a participating cafe and scan their QR code to grab your first digital punch card.
              </Text>
            </MotiView>
          ) : null
        }
      />

      {/* Floating Action Button */}
      <View className="absolute bottom-0 left-0 right-0 items-center pointer-events-box-none" style={{ paddingBottom: Math.max(insets.bottom + 16, 32) }} pointerEvents="box-none">
        <MotiView
          from={{ translateY: 100, opacity: 0 }}
          animate={{ translateY: 0, opacity: 1 }}
          transition={{ type: 'spring', damping: 15, delay: 400 }}
        >
          <TouchableOpacity
            onPress={() => router.push('/scan')}
            activeOpacity={0.8}
            className="relative"
          >
            {/* Subtle pulse effect */}
            <MotiView
              from={{ opacity: 0.5, scale: 1 }}
              animate={{ opacity: 0, scale: 1.2 }}
              transition={{ loop: true, type: 'timing', duration: 2000 }}
              className="absolute inset-0 bg-primary/20 rounded-full"
            />
            
            {/* Proper High-End FAB */}
            <View className="bg-primary flex-row items-center justify-center px-6 py-4 rounded-full shadow-xl shadow-primary/30 border border-primary/10">
              <QrCode color="white" size={20} />
              <Text className="text-white font-sans font-bold text-[15px] tracking-wide ml-3">Scan QR</Text>
            </View>
          </TouchableOpacity>
        </MotiView>
      </View>
      </SafeAreaView>
    </View>
  );
}
