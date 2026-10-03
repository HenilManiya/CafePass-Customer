import React, { useEffect, useRef } from 'react';
import { View, Animated as RNAnimated, Dimensions, StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors';

const { width } = Dimensions.get('window');

interface ConfettiBurstProps {
  visible: boolean;
}

export function ConfettiBurst({ visible }: ConfettiBurstProps) {
  const anims = useRef(
    Array.from({ length: 30 }, () => new RNAnimated.Value(0))
  ).current;
  const props = useRef(
    Array.from({ length: 30 }, (_, i) => ({
      x: (Math.random() - 0.5) * width * 1.4,
      color: [Colors.dark.primary, Colors.dark.hex_ffd700, Colors.dark.hex_ff6b6b, Colors.dark.hex_4ecdc4, Colors.dark.hex_a29bfe, Colors.dark.hex_fd79a8][i % 6],
      dur: 2200 + Math.random() * 800,
    }))
  ).current;

  useEffect(() => {
    if (!visible) return;
    anims.forEach((a, i) => {
      a.setValue(0);
      RNAnimated.timing(a, { toValue: 1, duration: props[i].dur, useNativeDriver: true }).start();
    });
  }, [visible]);

  if (!visible) return null;
  const screenHeight = Dimensions.get('window').height;
  return (
    <View style={styles.confettiContainer}>
      {anims.map((anim, i) => (
        <RNAnimated.View
          key={i}
          style={[
            styles.confettiParticle,
            {
              transform: [
                { translateX: props[i].x },
                { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [-10, screenHeight + 20] }) },
              ],
              backgroundColor: props[i].color,
              opacity: anim.interpolate({ inputRange: [0, 0.8, 1], outputRange: [1, 1, 0] }),
            }
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  confettiContainer: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    pointerEvents: 'none',
  },
  confettiParticle: {
    position: 'absolute',
    width: 8, height: 8, borderRadius: 4,
  },
});
