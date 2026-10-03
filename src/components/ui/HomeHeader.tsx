import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MotiView } from 'moti';
import { CafePassLogo } from '@/components/CafePassLogo';
import { LogOut } from '@/components/Icon';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';

interface HomeHeaderProps {
  title: string;
  userName: string;
  onSignOut: () => void;
}

export function HomeHeader({ title, userName, onSignOut }: HomeHeaderProps) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <View style={styles.header}>
      <MotiView from={{ opacity: 0, translateX: -20 }} animate={{ opacity: 1, translateX: 0 }} style={styles.headerLeft}>
        <CafePassLogo size={42} />
        <View>
          <Text style={styles.greetingText}>
            {greeting}, {userName}
          </Text>
          <Text style={styles.headerTitle}>{title}</Text>
        </View>
      </MotiView>
      <MotiView from={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }}>
        <TouchableOpacity onPress={onSignOut} style={styles.signOutButton}>
          <LogOut size={16} color={Colors.dark.primary} />
        </TouchableOpacity>
      </MotiView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
    zIndex: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.borderSubtle,
    backgroundColor: Colors.dark.headerBackground,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  greetingText: {
    color: Colors.dark.primary,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 2,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: Typography.serif,
    color: Colors.dark.text,
    letterSpacing: -0.5,
  },
  signOutButton: {
    backgroundColor: Colors.dark.primaryLight,
    padding: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.dark.primaryMuted,
  },
});
