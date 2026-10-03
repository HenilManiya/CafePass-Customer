import React from 'react';
import { View, Text, Image, Dimensions } from 'react-native';
import { MapPin } from '@/components/Icon';

const { width } = Dimensions.get('window');

interface CafeHeaderProps {
  cafeName?: string;
  branchName?: string;
  logoUrl?: string;
  variant?: 'small' | 'large';
}

export function CafeHeader({
  cafeName,
  branchName,
  logoUrl,
  variant = 'large'
}: CafeHeaderProps) {
  const isLarge = variant === 'large';

  return (
    <View className={`flex-row items-center flex-1 ${isLarge ? 'w-full px-2 mt-2' : 'pr-3'}`}>
      {logoUrl && (
        <View className={isLarge ? 'mr-4 shadow-lg' : 'mr-3 shadow-sm'}>
          <Image
            source={{ uri: logoUrl }}
            className="rounded-full bg-white/10 border-[1.5px] border-white/20"
            style={isLarge ? { width: 64, height: 64 } : { width: width * 0.12, height: width * 0.12 }}
          />
        </View>
      )}

      <View className="flex-1 justify-center">
        <Text
          className={`text-white font-serif tracking-tight ${isLarge ? 'text-3xl font-bold shadow-md' : 'text-2xl'}`}
          numberOfLines={1}
          adjustsFontSizeToFit={isLarge}
        >
          {cafeName}
        </Text>

        {branchName && (
          <View className="flex-row items-center mt-1">
            <MapPin size={isLarge ? 14 : 12} color="rgba(255,255,255,0.7)" />
            <Text className={`text-white/70 ml-1.5 font-sans uppercase ${isLarge ? 'text-xs tracking-widest font-bold' : 'text-[10px] tracking-wider'}`}>
              {branchName} Branch
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}
