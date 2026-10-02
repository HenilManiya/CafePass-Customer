import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Dimensions } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, QrCode } from 'lucide-react-native';
import { MotiView } from 'moti';

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const router = useRouter();

  if (!permission) {
    return <View className="flex-1 bg-black" />;
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 bg-[#FAF6F0] justify-center items-center px-8">
        <MotiView 
          from={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white p-8 rounded-[32px] items-center shadow-lg shadow-black/5 w-full"
        >
          <View className="bg-[#EFEBE9] w-20 h-20 rounded-full items-center justify-center mb-6">
            <QrCode size={40} color="#8D6E63" />
          </View>
          <Text className="text-2xl font-serif text-[#3E2723] mb-3 text-center">Camera Access</Text>
          <Text className="text-[#8D6E63] text-center mb-8 font-sans leading-relaxed">
            We need your permission to show the camera so you can scan cafe QR codes.
          </Text>
          <TouchableOpacity 
            className="bg-[#4A3428] w-full py-4 rounded-2xl flex-row justify-center items-center shadow-lg shadow-[#4A3428]/30"
            onPress={requestPermission}
          >
            <Text className="text-white font-bold text-lg tracking-wide">Grant Permission</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            className="mt-6 py-2"
            onPress={() => router.back()}
          >
            <Text className="text-[#8D6E63] font-bold">Go Back</Text>
          </TouchableOpacity>
        </MotiView>
      </View>
    );
  }

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    
    try {
      const payload = JSON.parse(data);
      if (payload.cafe_id) {
        router.push(`/cafe/${payload.cafe_id}`);
      } else {
        alert("Invalid Cafe QR code!");
        setTimeout(() => setScanned(false), 2000);
      }
    } catch (e) {
      alert("Invalid QR format");
      setTimeout(() => setScanned(false), 2000);
    }
  };

  return (
    <View className="flex-1 bg-black overflow-hidden relative">
      <CameraView
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1 }}
      />
      
      <SafeAreaView className="flex-1" style={{ zIndex: 10 }} pointerEvents="box-none">
        <View className="flex-row justify-between items-center px-6 pt-4 w-full" pointerEvents="box-none">
          <TouchableOpacity 
            onPress={() => router.back()} 
            className="w-12 h-12 bg-black/40 rounded-full items-center justify-center border border-white/20"
          >
            <X color="white" size={24} />
          </TouchableOpacity>
          <View className="bg-black/40 px-4 py-2 rounded-full border border-white/20">
            <Text className="text-white font-bold tracking-widest text-xs uppercase">Scan Cafe QR</Text>
          </View>
          <View className="w-12 h-12" />
        </View>
        <View className="flex-1 items-center justify-center" pointerEvents="none">
          <MotiView
            from={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', damping: 15 }}
            className="w-72 h-72 border-2 border-white/20 rounded-[32px] overflow-hidden items-center justify-center relative"
          >
            <View className="absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 border-white rounded-tl-[32px]" />
            <View className="absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 border-white rounded-tr-[32px]" />
            <View className="absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 border-white rounded-bl-[32px]" />
            <View className="absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 border-white rounded-br-[32px]" />
            <MotiView 
              from={{ translateY: -130, opacity: 0 }}
              animate={{ translateY: 130, opacity: [0, 1, 1, 0] }}
              transition={{ loop: true, type: 'timing', duration: 2000 }}
              className="w-full h-[2px] bg-[#4A3428] shadow-md shadow-[#4A3428]/80"
            />
          </MotiView>
          <View className="bg-black/40 px-6 py-3 rounded-full mt-12 border border-white/10">
            <Text className="text-white font-sans text-base text-center">Point camera at the Cafe's QR Code</Text>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}
