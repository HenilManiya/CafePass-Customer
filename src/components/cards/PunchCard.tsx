import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { AnimatedView as MotiView } from '@/components/ui/AnimatedView';
import { Coffee } from '@/components/Icon';
import { AnimatedBarista } from '@/components/AnimatedBarista';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';

interface PunchCardProps {
  punchCardContainerRef: any;
  cafeDetails: any;
  card: any;
  rewardsAvailable: number;
  slotRefs: any;
  measureSlot: (index: number) => void;
  animatingPunch: { active: boolean; targetPunches: number } | null;
  slotCoordinates: Record<number, { x: number; y: number }>;
  handleStampHit: () => void;
  handleAnimationComplete: () => void;
}

export function PunchCard({
  punchCardContainerRef,
  cafeDetails,
  card,
  rewardsAvailable,
  slotRefs,
  measureSlot,
  animatingPunch,
  slotCoordinates,
  handleStampHit,
  handleAnimationComplete
}: PunchCardProps) {
  const maxPunches = cafeDetails?.max_punches || card?.cafes?.max_punches || 10;
  const currentPunches = card?.punch_count || 0;

  return (
    <View ref={punchCardContainerRef} style={styles.punchCardContainer}>
      <View style={styles.punchCardPadding}>
        <View style={styles.punchCardHeader}>
          <Text style={styles.punchCardTitle}>PUNCH CARD</Text>
          <Text style={styles.punchCardSubtitle}>Buy {maxPunches}, Get 1 Free</Text>
          {rewardsAvailable > 0 && (
            <View style={styles.rewardsAvailableBadge}>
              <Text style={styles.rewardsAvailableText}>
                🎁 {rewardsAvailable} Reward{rewardsAvailable > 1 ? 's' : ''} Available!
              </Text>
            </View>
          )}
        </View>

        <View style={styles.slotsGrid}>
          {Array.from({ length: maxPunches }).map((_, i) => {
            const isPunched = i < currentPunches;
            const stampRotations = ['-12deg', '8deg', '-5deg', '15deg', '-8deg', '10deg', '-3deg', '14deg', '-15deg', '6deg'];
            const rotation = stampRotations[i % stampRotations.length];

            return (
              <View key={i} style={styles.slotWrapper}>
                <View
                  ref={(el) => { slotRefs.current[i] = el; }}
                  onLayout={() => measureSlot(i)}
                  style={styles.slotCircle}
                >
                  {isPunched && (
                    <MotiView
                      from={{ scale: 1.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', damping: 14, delay: i * 150 }}
                      style={[styles.stampAnimContainer, { transform: [{ rotate: rotation }] }]}
                    >
                      <View style={styles.stampCircle}>
                        <Coffee size={28} color={Colors.dark.primary} strokeWidth={2.5} />
                        <View style={styles.stampBg} />
                      </View>
                    </MotiView>
                  )}

                  {!isPunched && (
                    <Text style={styles.slotNumber}>{i + 1}</Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        <Text style={styles.moreForFreeText}>
          {maxPunches - currentPunches} more for a free drink!
        </Text>
      </View>

      {animatingPunch?.active && (
        <AnimatedBarista
          targetSlotIndex={animatingPunch.targetPunches - 1}
          targetSlotPosition={slotCoordinates[animatingPunch.targetPunches - 1]}
          onStamp={handleStampHit}
          onComplete={handleAnimationComplete}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  punchCardContainer: {
    width: '100%',
    borderRadius: 32,
    overflow: 'hidden',
    backgroundColor: Colors.dark.punchSlot,
    borderWidth: 1,
    borderColor: Colors.dark.badge,
    marginBottom: 32,
  },
  punchCardPadding: {
    padding: 20,
    width: '100%',
  },
  punchCardHeader: {
    alignItems: 'center',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.badge,
    paddingBottom: 8,
  },
  punchCardTitle: {
    color: Colors.dark.text,
    fontFamily: Typography.serif,
    fontSize: 24,
    letterSpacing: 2,
  },
  punchCardSubtitle: {
    color: Colors.dark.textPrimary,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginTop: 4,
    fontWeight: 'bold',
  },
  rewardsAvailableBadge: {
    backgroundColor: Colors.dark.badge,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 999,
    marginTop: 12,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  rewardsAvailableText: {
    color: Colors.dark.text,
    fontWeight: 'bold',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  slotWrapper: {
    width: '20%',
    alignItems: 'center',
    marginBottom: 16,
  },
  slotCircle: {
    width: '80%',
    aspectRatio: 1,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: Colors.dark.placeholder,
    backgroundColor: Colors.dark.border,
  },
  stampAnimContainer: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stampCircle: {
    width: '110%',
    height: '110%',
    borderRadius: 999,
    borderWidth: 3,
    borderColor: Colors.dark.primary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  stampBg: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: Colors.dark.primary,
    opacity: 0.15,
  },
  slotNumber: {
    color: Colors.dark.muted,
    fontFamily: Typography.serif,
    fontSize: 18,
  },
  moreForFreeText: {
    color: Colors.dark.textPrimary,
    textAlign: 'center',
    fontSize: 12,
    fontFamily: Typography.serif,
    marginTop: 8,
    fontStyle: 'italic',
  },
});
