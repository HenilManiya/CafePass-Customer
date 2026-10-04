import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/context/AuthContext';
import { supabase } from '@/shared';
import { LinearGradient } from '@/components/LinearGradient';
import { AnimatedView as MotiView } from '@/components/ui/AnimatedView';
import { HomeHeader } from '@/components/ui/HomeHeader';
import { User, ChevronRight, Clock, Info, Heart } from '@/components/Icon';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';

export default function Profile() {
  const router = useRouter();
  const { session, profile, signOut } = useAuthStore();
  const userName = profile?.name || profile?.full_name || profile?.first_name || session?.user?.user_metadata?.name || session?.user?.user_metadata?.full_name || 'Coffee Lover';
  const userEmail = session?.user?.email || 'user@example.com';
  const userPhone = profile?.phone || session?.user?.user_metadata?.phone || null;

  const [stats, setStats] = useState({ coffees: 0, rewards: 0, pending: 0, used: 0 });

  useEffect(() => {
    if (!session?.user?.id) return;
    
    const fetchStats = async () => {
      const [cardsRes, rewardsRes] = await Promise.all([
        supabase.from('digital_cards').select('punch_count').eq('customer_id', session.user.id),
        supabase.from('rewards').select('status').eq('customer_id', session.user.id)
      ]);
      
      let totalPunches = 0;
      cardsRes.data?.forEach(card => {
        totalPunches += (card.punch_count || 0);
      });
      
      const totalRewards = rewardsRes.data?.length || 0;
      const availableRewards = rewardsRes.data?.filter(r => r.status === 'AVAILABLE').length || 0;
      const usedRewards = rewardsRes.data?.filter(r => r.status === 'USED' || r.status === 'REDEEMED').length || 0;
      
      setStats({ coffees: totalPunches, rewards: totalRewards, pending: availableRewards, used: usedRewards });
    };
    
    fetchStats();
  }, [session?.user?.id]);

  const menuItems = [
    { id: 'rewards', icon: Heart, label: 'My Rewards' },
    { id: 'history', icon: Clock, label: 'Punch History' },
    { id: 'about', icon: Info, label: 'Help & Support' },
  ];

  return (
    <View style={styles.container}>
      <LinearGradient colors={[Colors.dark.background, Colors.dark.hex_2e1911]} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={styles.safeArea}>
        <HomeHeader
          title="Profile"
          userName={userName}
          onSignOut={signOut}
        />
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* User Card */}
          <MotiView from={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 100 }} style={styles.userCard}>
            <LinearGradient colors={[Colors.dark.hex_26140b, Colors.dark.hex_1c0f0a]} style={StyleSheet.absoluteFill} />
            <View style={styles.avatarContainer}>
              <User size={32} color={Colors.dark.primary} />
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{userName}</Text>
              <Text style={styles.userEmail}>{userEmail}</Text>
              {userPhone && <Text style={styles.userPhone}>{userPhone}</Text>}
            </View>
          </MotiView>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <MotiView from={{ opacity: 0, translateY: 20 }} animate={{ opacity: 1, translateY: 0 }} transition={{ delay: 200 }} style={styles.statBox}>
              <Text style={styles.statNumber}>{stats.coffees}</Text>
              <Text style={styles.statLabel}>Coffees</Text>
            </MotiView>
            <MotiView from={{ opacity: 0, translateY: 20 }} animate={{ opacity: 1, translateY: 0 }} transition={{ delay: 300 }} style={styles.statBox}>
              <Text style={styles.statNumber}>{stats.rewards}</Text>
              <Text style={styles.statLabel}>Rewards</Text>
            </MotiView>
            <MotiView from={{ opacity: 0, translateY: 20 }} animate={{ opacity: 1, translateY: 0 }} transition={{ delay: 400 }} style={styles.statBox}>
              <Text style={styles.statNumber}>{stats.pending}</Text>
              <Text style={styles.statLabel}>Available</Text>
            </MotiView>
            <MotiView from={{ opacity: 0, translateY: 20 }} animate={{ opacity: 1, translateY: 0 }} transition={{ delay: 500 }} style={styles.statBox}>
              <Text style={styles.statNumber}>{stats.used}</Text>
              <Text style={styles.statLabel}>Used</Text>
            </MotiView>
          </View>

          {/* Menu Items */}
          <View style={styles.menuContainer}>
            {menuItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <MotiView key={item.id} from={{ opacity: 0, translateX: -20 }} animate={{ opacity: 1, translateX: 0 }} transition={{ delay: 300 + index * 100 }}>
                  <TouchableOpacity style={styles.menuItem} activeOpacity={0.7} onPress={() => router.push(`/${item.id}` as any)}>
                    <View style={styles.menuItemLeft}>
                      <View style={styles.menuIconBox}>
                        <Icon size={20} color={Colors.dark.primary} />
                      </View>
                      <Text style={styles.menuItemLabel}>{item.label}</Text>
                    </View>
                    <ChevronRight size={20} color={Colors.dark.textSecondary} />
                  </TouchableOpacity>
                </MotiView>
              );
            })}
          </View>


          
          <View style={styles.bottomPadding} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.background },
  safeArea: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 100 },
  userCard: { 
    flexDirection: 'row', alignItems: 'center', padding: 20, borderRadius: 24,
    marginBottom: 24, overflow: 'hidden', borderWidth: 1, borderColor: Colors.dark.borderSubtle,
    shadowColor: Colors.dark.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 12
  },
  avatarContainer: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.dark.primaryLight,
    alignItems: 'center', justifyContent: 'center', marginRight: 16,
    borderWidth: 1, borderColor: Colors.dark.primaryMuted
  },
  userInfo: { flex: 1 },
  userName: { fontSize: 20, fontWeight: 'bold', color: Colors.dark.text, marginBottom: 4, fontFamily: Typography.serif },
  userEmail: { fontSize: 14, color: Colors.dark.textSecondary },
  userPhone: { fontSize: 13, color: Colors.dark.muted, marginTop: 2 },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 16, marginBottom: 32 },
  statBox: {
    width: '47%', backgroundColor: Colors.dark.cardBackground, padding: 16, borderRadius: 20,
    alignItems: 'center', borderWidth: 1, borderColor: Colors.dark.borderSubtle
  },
  statNumber: { fontSize: 24, fontWeight: 'bold', color: Colors.dark.primary, marginBottom: 4, fontFamily: Typography.serif },
  statLabel: { fontSize: 12, color: Colors.dark.textSecondary, textTransform: 'uppercase', letterSpacing: 1 },
  menuContainer: { marginBottom: 32, backgroundColor: Colors.dark.cardBackground, borderRadius: 24, padding: 8, borderWidth: 1, borderColor: Colors.dark.borderSubtle },
  menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderRadius: 16 },
  menuItemLeft: { flexDirection: 'row', alignItems: 'center' },
  menuIconBox: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.dark.primaryLight, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  menuItemLabel: { fontSize: 16, color: Colors.dark.text, fontWeight: '500' },
  bottomPadding: { height: 40 }
});
