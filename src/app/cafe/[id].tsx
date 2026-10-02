
import React from 'react';
import { View, Text, TouchableOpacity, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/authStore';
import QRCode from 'react-native-qrcode-svg';
import { MotiView } from 'moti';
import { ChevronLeft } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function CafeCardScreen() {
  const { id } = useLocalSearchParams();
  const { session } = useAuthStore();
  const router = useRouter();

  const qrPayload = JSON.stringify({
    customer_id: session?.user?.id,
    cafe_id: id,
    action: "PUNCH"
  });

  return (
    <SafeAreaView className="flex-1 bg-coffee-50">
      <View className="px-4 py-4 flex-row items-center relative">
        <TouchableOpacity 
          onPress={() => router.back()}
          className="w-12 h-12 bg-white rounded-full items-center justify-center shadow-sm border border-coffee-100 z-10"
        >
          <ChevronLeft size={24} color="#3E2723" />
        </TouchableOpacity>
        <View className="absolute inset-x-0 items-center justify-center pointer-events-none">
          <Text className="font-serif text-2xl text-coffee-900">Cafe Card</Text>
        </View>
      </View>

      <View className="flex-1 px-6 pt-4 pb-12 justify-between">
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ delay: 200 }}
          className="items-center mt-8"
        >
          <Text className="font-sans text-coffee-500 text-center mb-6 px-4">
            Show this QR code to the barista to get a punch or redeem a free coffee.
          </Text>
          <View className="bg-white p-6 rounded-[32px] shadow-sm border border-coffee-100">
            <QRCode
              value={qrPayload}
              size={width * 0.55}
              color="#3E2723"
              backgroundColor="white"
            />
          </View>
        </MotiView>
      </View>
    </SafeAreaView>
  );
}
