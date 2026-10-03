import React from 'react';
import { View, Text, Dimensions, StyleSheet, Platform } from 'react-native';
import { Image } from 'expo-image';
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
    <View style={[
      styles.container, 
      isLarge ? styles.containerLarge : styles.containerSmall
    ]}>
      {logoUrl && (
        <View style={isLarge ? styles.imageContainerLarge : styles.imageContainerSmall}>
          <Image
            source={{ uri: logoUrl }}
            style={[
              styles.image, 
              isLarge ? styles.imageLarge : styles.imageSmall
            ]}
            contentFit="cover"
            cachePolicy="memory-disk"
            transition={150}
          />
        </View>
      )}

      <View style={styles.textContainer}>
        <Text
          style={[
            styles.titleText,
            isLarge ? styles.titleTextLarge : styles.titleTextSmall
          ]}
          numberOfLines={1}
          adjustsFontSizeToFit={isLarge}
        >
          {cafeName}
        </Text>

        {branchName && (
          <View style={styles.branchContainer}>
            <MapPin size={isLarge ? 14 : 12} color="rgba(255,255,255,0.7)" />
            <Text 
              style={[
                styles.branchText,
                isLarge ? styles.branchTextLarge : styles.branchTextSmall
              ]}
              numberOfLines={1}
            >
              {branchName.toLowerCase().includes('branch') ? branchName : `${branchName} Branch`}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  containerLarge: {
    width: '100%',
    paddingHorizontal: 8,
    marginTop: 8,
  },
  containerSmall: {
    paddingRight: 12,
  },
  imageContainerLarge: {
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  imageContainerSmall: {
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  image: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  imageLarge: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  imageSmall: {
    width: width * 0.12,
    height: width * 0.12,
    borderRadius: (width * 0.12) / 2,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  titleText: {
    color: '#FFFFFF',
    fontFamily: Platform.select({ ios: 'ui-serif', default: 'serif' }),
    letterSpacing: -0.5,
  },
  titleTextLarge: {
    fontSize: 30,
    fontWeight: 'bold',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  titleTextSmall: {
    fontSize: 24,
  },
  branchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  branchText: {
    color: 'rgba(255,255,255,0.7)',
    marginLeft: 6,
    flex: 1,
    textTransform: 'uppercase',
  },
  branchTextLarge: {
    fontSize: 12,
    letterSpacing: 2,
    fontWeight: 'bold',
  },
  branchTextSmall: {
    fontSize: 10,
    letterSpacing: 1,
  },
});
