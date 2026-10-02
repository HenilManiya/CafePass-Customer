import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '@/shared';
import { useAuthStore } from '@/store/authStore';
import { QrCode, LogOut, MapPin, Coffee } from 'lucide-react-native';
import { MotiView } from 'moti';

const { width } = Dimensions.get('window');

export default function Home() {
  const router = useRouter();
  const { session, signOut } = useAuthStore();
  const [cards, setCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVisitedCafes();
  }, []);

  const fetchVisitedCafes = async () => {
    if (!session?.user) return;
    
    // Fetch user's digital cards along with cafe details
    const { data, error } = await supabase
      .from('digital_cards')
      .select('*, cafes(name, address, image_url)')
      .eq('customer_id', session.user.id);
      
    if (data) setCards(data);
    setLoading(false);
  };

  const renderCard = ({ item, index }: { item: any; index: number }) => {
    const punches = item.punch_count;
    const required = 10;
    const progress = (punches / required) * 100;

    return (
      <MotiView 
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ delay: index * 100 }}
      >
        <TouchableOpacity 
          className="bg-white rounded-[32px] shadow-sm mb-6 border border-[#EFEBE9] overflow-hidden"
          onPress={() => router.push(`/cafe/${item.cafe_id}`)}
          activeOpacity={0.9}
        >
          {/* Cafe Image Placeholder */}
          <View className="h-40 bg-[#D7CCC8] w-full">
            <Image 
              source={{ uri: item.cafes?.image_url || 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=600&q=80' }} 
              className="w-full h-full opacity-90"
              resizeMode="cover"
            />
            <View className="absolute inset-0 bg-black/30" />
            <View className="absolute bottom-4 left-5 right-5 flex-row justify-between items-end">
              <View>
                <Text className="text-2xl font-bold text-white tracking-tight">{item.cafes?.name || 'Unknown Cafe'}</Text>
                <View className="flex-row items-center mt-1">
                  <MapPin size={14} color="#FFF" />
                  <Text className="text-white/90 text-xs ml-1 font-medium">{item.cafes?.address || 'Downtown'}</Text>
                </View>
              </View>
              <View className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-full border border-white/30">
                <Text className="text-white font-bold text-sm">{punches}/{required}</Text>
              </View>
            </View>
          </View>

          {/* Progress Bar Area */}
          <View className="p-5 bg-white">
            <View className="flex-row justify-between mb-3">
              <Text className="text-[#8D6E63] font-bold text-xs uppercase tracking-wider">Punch Progress</Text>
              <Text className="text-[#4A3428] font-bold text-xs">{required - punches} more for a free drink!</Text>
            </View>
            <View className="h-4 w-full bg-[#EFEBE9] rounded-full overflow-hidden border border-[#D7CCC8]">
              <MotiView 
                className="h-full bg-[#4A3428] rounded-full"
                from={{ width: '0%' }}
                animate={{ width: `${progress}%` }}
                transition={{ type: 'timing', duration: 1000 }}
              />
            </View>
          </View>
        </TouchableOpacity>
      </MotiView>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-[#FAF6F0]">
      {/* Header */}
      <View className="flex-row justify-between items-center px-6 pt-6 pb-4">
        <View>
          <Text className="text-[#8D6E63] text-sm uppercase tracking-widest font-bold mb-1">Welcome back</Text>
          <Text className="text-4xl font-serif text-[#3E2723]">My Cards</Text>
        </View>
        <TouchableOpacity onPress={signOut} className="bg-white p-3 rounded-full shadow-sm border border-[#EFEBE9]">
          <LogOut size={22} color="#4A3428" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={cards}
        keyExtractor={(item) => item.id}
        renderItem={renderCard}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          !loading ? (
            <MotiView 
              from={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-20 items-center px-6"
            >
              <View className="bg-[#EFEBE9] w-24 h-24 rounded-full items-center justify-center mb-6">
                <Coffee size={40} color="#8D6E63" />
              </View>
              <Text className="text-[#3E2723] text-2xl font-serif mb-2 text-center">No cards yet!</Text>
              <Text className="text-[#8D6E63] text-center text-base font-sans px-4 leading-relaxed">
                Visit a participating cafe and scan their QR code to grab your first digital punch card.
              </Text>
            </MotiView>
          ) : null
        }
      />

      {/* Floating Action Button */}
      <MotiView 
        from={{ translateY: 100 }}
        animate={{ translateY: 0 }}
        transition={{ type: 'spring', damping: 15 }}
        className="absolute bottom-10 inset-x-0 items-center px-6"
      >
        <TouchableOpacity
          onPress={() => router.push('/scan')}
          activeOpacity={0.8}
          className="w-full bg-[#4A3428] flex-row items-center justify-center py-5 rounded-[24px] shadow-xl shadow-[#4A3428]/40 border border-[#3E2723]"
        >
          <QrCode color="white" size={24} className="mr-3" />
          <Text className="text-white font-bold text-lg tracking-wide">Scan New Cafe QR</Text>
        </TouchableOpacity>
      </MotiView>
    </SafeAreaView>
  );
}
