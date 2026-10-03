import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Image } from 'expo-image';
import { MotiView } from 'moti';
import { useRouter } from 'expo-router';
import { CafeHeader } from '@/components/CafeHeader';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';

interface DigitalCardProps {
  item: any;
  index: number;
}

export function DigitalCard({ item, index }: DigitalCardProps) {
  const router = useRouter();
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
}

const styles = StyleSheet.create({
  cardContainer: {
    marginBottom: 24,
  },
  cardWrapper: {
    borderRadius: 32,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
    backgroundColor: Colors.dark.cardBackground,
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
    backgroundColor: Colors.dark.rgba_15_8_4_0_72,
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
    backgroundColor: Colors.dark.badge,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  punchesText: {
    color: Colors.dark.text,
    fontWeight: 'bold',
    fontSize: 16,
    fontFamily: Typography.serif,
  },
  punchesRequired: {
    color: Colors.dark.textSecondary,
    fontSize: 12,
  },
  rewardsBadge: {
    position: 'absolute',
    top: 20,
    right: 80,
    backgroundColor: Colors.dark.badge,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  rewardsText: {
    color: Colors.dark.text,
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
    color: Colors.dark.textSecondary,
    fontWeight: 'bold',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  progressStatusText: {
    color: Colors.dark.primary,
    fontWeight: 'bold',
    fontSize: 12,
    fontStyle: 'italic',
    flex: 1,
    textAlign: 'right',
  },
  progressBarTrack: {
    height: 10,
    width: '100%',
    backgroundColor: Colors.dark.border,
    borderRadius: 999,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.dark.rgba_0_0_0_0_5,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.dark.primary,
    borderRadius: 999,
  },
});
