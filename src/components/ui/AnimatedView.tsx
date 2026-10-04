import React, { useEffect, useRef } from 'react';
import { Animated, ViewStyle, StyleProp } from 'react-native';

export function AnimatePresence({ children }: { children?: React.ReactNode }) {
  return <>{children}</>;
}

export function useAnimationState() {
  return { current: null, transitionTo: () => {} };
}

interface AnimatedViewProps {
  from?: any;
  animate?: any;
  transition?: any;
  exit?: any;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
  pointerEvents?: 'box-none' | 'none' | 'box-only' | 'auto';
  state?: any;
}

export function AnimatedView({ from, animate, transition, style, children, pointerEvents, state }: AnimatedViewProps) {
  const animatedValues = useRef<{ [key: string]: Animated.Value }>({}).current;

  if (from) {
    Object.keys(from).forEach(key => {
      if (!animatedValues[key]) {
        animatedValues[key] = new Animated.Value(from[key]);
      }
    });
  }

  useEffect(() => {
    const targetAnimate = animate || (state && state.current);
    if (targetAnimate) {
      const animations = Object.keys(targetAnimate).map(key => {
        if (!animatedValues[key]) {
          animatedValues[key] = new Animated.Value(from ? from[key] : targetAnimate[key]);
        }
        
        const delay = transition?.delay || 0;
        const type = transition?.type === 'spring' ? Animated.spring : Animated.timing;
        
        const config: any = {
          toValue: targetAnimate[key],
          useNativeDriver: key !== 'width' && key !== 'height',
          delay
        };

        if (transition?.type === 'spring') {
          config.damping = transition.damping || 10;
          config.stiffness = transition.stiffness || 100;
        } else {
          config.duration = transition?.duration || 300;
        }

        return type(animatedValues[key], config);
      });

      Animated.parallel(animations).start();
    }
  }, [animate, transition, state]);

  const animatedStyle: any = {};
  const transform: any[] = [];

  Object.keys(animatedValues).forEach(key => {
    if (key === 'translateX' || key === 'translateY' || key === 'scale' || key === 'rotate') {
      transform.push({ [key]: animatedValues[key] });
    } else {
      animatedStyle[key] = animatedValues[key];
    }
  });

  if (transform.length > 0) {
    animatedStyle.transform = transform;
  }

  return (
    <Animated.View style={[style, animatedStyle]} pointerEvents={pointerEvents}>
      {children}
    </Animated.View>
  );
}
