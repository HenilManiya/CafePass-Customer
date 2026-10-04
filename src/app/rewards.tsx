import React, { useEffect, useState } from 'react';
import { Image } from 'expo-image';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, Heart, Coffee } from '@/components/Icon';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { LinearGradient } from '@/components/LinearGradient';
import { useAuthStore } from '@/context/AuthContext';
import { supabase } from '@/shared';
import { AnimatedView as MotiView } from '@/components/ui/AnimatedView';
import { QRModal } from '@/components/modals/QRModal';

export default function RewardsScreen() {
  const router = useRouter();
  const { session } = useAuthStore();
  const [rewards, setRewards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isQRModalVisible, setIsQRModalVisible] = useState(false);
  const [activeCafeId, setActiveCafeId] = useState<string | null>(null);
  const [activeCafeLogo, setActiveCafeLogo] = useState<string | undefined>();

  useEffect(() => {
    fetchRewards();
  }, [session?.user?.id]);

  const fetchRewards = async () => {
    if (!session?.user?.id) return;
    try {
      const { data, error } = await supabase
        .from('rewards')
        .select('*, cafes(name, logo_url)')
        .eq('customer_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) {
        // Fallback if created_at doesn't exist
        const { data: fallbackData } = await supabase
          .from('rewards')
          .select('*, cafes(name, logo_url)')
          .eq('customer_id', session.user.id);
        setRewards(fallbackData || []);
      } else {
        setRewards(data || []);
      }
    } catch (err) {
      console.error('Error fetching rewards', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUseReward = (cafeId: string, cafeLogo?: string) => {
    setActiveCafeId(cafeId);
    setActiveCafeLogo(cafeLogo);
    setIsQRModalVisible(true);
  };

  const renderReward = ({ item, index }: { item: any, index: number }) => {
    const isRedeemed = item.status !== 'AVAILABLE';
    return (
      <MotiView from={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: index * 100 }} style={[styles.rewardCardContainer, isRedeemed && styles.rewardCardRedeemed]}>
        <View style={styles.rewardCardGradientWrapper}>
          <View style={styles.rewardCardContent}>
            <View style={styles.rewardHeader}>
              <View style={styles.cafeInfoRow}>
                {item.cafes?.logo_url ? (
                  <Image source={{ uri: item.cafes.logo_url }} style={styles.cafeLogo} />
                ) : (
                  <View style={[styles.cafeLogo, { alignItems: 'center', justifyContent: 'center' }]}>
                    <Coffee size={20} color={isRedeemed ? Colors.dark.muted : Colors.dark.hex_2e1911} />
                  </View>
                )}
                <View>
                  <Text style={[styles.rewardCafe, isRedeemed && styles.textRedeemed]}>{item.cafes?.name || 'Cafe'}</Text>
                  <Text style={[styles.rewardDate, isRedeemed && styles.textRedeemed]}>{new Date(item.created_at || item.updated_at || Date.now()).toLocaleDateString()}</Text>
                </View>
              </View>
              <View style={[styles.rewardBadge, isRedeemed && styles.rewardBadgeRedeemed]}>
                <Text style={[styles.rewardBadgeText, isRedeemed && styles.rewardBadgeTextRedeemed]}>{isRedeemed ? 'REDEEMED' : 'FREE'}</Text>
              </View>
            </View>
            <Text style={[styles.rewardDesc, isRedeemed && styles.textRedeemed]}>Valid for any regular sized coffee.</Text>
            
            <View style={[styles.dashedLine, isRedeemed && styles.dashedLineRedeemed]} />
            
            <View style={styles.rewardFooter}>
              <View />
              {!isRedeemed ? (
                <TouchableOpacity style={styles.claimBtn} onPress={() => handleUseReward(item.cafe_id, item.cafes?.logo_url)}>
                  <Text style={styles.claimBtnText}>Use Now</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.redeemedBtn}>
                  <Text style={styles.redeemedBtnText}>Used</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </MotiView>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={[Colors.dark.background, Colors.dark.hex_2e1911]} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ChevronLeft size={24} color={Colors.dark.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Rewards</Text>
          <View style={{ width: 24 }} />
        </View>

        {loading ? (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color={Colors.dark.primary} />
          </View>
        ) : rewards.length === 0 ? (
          <View style={styles.centerContent}>
            <Heart size={48} color={Colors.dark.primaryMuted} />
            <Text style={styles.emptyText}>You have no rewards yet.</Text>
            <Text style={styles.emptySubtext}>Complete a punch card to earn rewards!</Text>
          </View>
        ) : (
          <FlatList
            data={rewards}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderReward}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </SafeAreaView>
      <QRModal
        isVisible={isQRModalVisible}
        onClose={() => setIsQRModalVisible(false)}
        cafeId={activeCafeId}
        cafeLogo={activeCafeLogo}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.background },
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20 },
  backBtn: { padding: 8, marginLeft: -8 },
  headerTitle: { fontSize: 20, fontFamily: Typography.serif, color: Colors.dark.text, fontWeight: 'bold' },
  centerContent: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  emptyText: { color: Colors.dark.text, fontSize: 18, marginTop: 16, fontFamily: Typography.serif, fontWeight: 'bold' },
  emptySubtext: { color: Colors.dark.textSecondary, fontSize: 14, marginTop: 8, textAlign: 'center' },
  listContent: { padding: 20 },
  rewardCardContainer: { borderRadius: 12, marginBottom: 12, overflow: 'hidden', elevation: 8, shadowColor: Colors.dark.shadowMedium, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, backgroundColor: Colors.dark.hex_f5d0a9 },
  rewardCardGradientWrapper: { flex: 1, backgroundColor: Colors.dark.hex_f5d0a9 },
  rewardCardContent: { padding: 12 },
  rewardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  rewardBadge: { backgroundColor: Colors.dark.hex_1c0f0a, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  rewardBadgeText: { color: Colors.dark.primary, fontWeight: '900', fontSize: 9, letterSpacing: 1 },
  rewardCafe: { fontSize: 16, fontWeight: '800', color: Colors.dark.hex_1c0f0a, fontFamily: Typography.serif, marginBottom: 2 },
  rewardDesc: { fontSize: 11, color: Colors.dark.hex_2e1911, marginBottom: 10 },
  dashedLine: { height: 1, width: '100%', borderWidth: 1, borderColor: Colors.dark.hex_2e1911, borderStyle: 'dashed', marginBottom: 10 },
  rewardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rewardDate: { fontSize: 11, color: Colors.dark.hex_2e1911, fontWeight: '600' },
  claimBtn: { backgroundColor: Colors.dark.hex_1c0f0a, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 16 },
  claimBtnText: { color: Colors.dark.primary, fontWeight: 'bold', fontSize: 12 },
  rewardCardRedeemed: { opacity: 0.6 },
  rewardBadgeRedeemed: { backgroundColor: 'rgba(0,0,0,0.1)' },
  rewardBadgeTextRedeemed: { color: Colors.dark.hex_2e1911 },
  textRedeemed: { color: Colors.dark.hex_2e1911 },
  dashedLineRedeemed: { borderColor: 'rgba(0,0,0,0.2)' },
  redeemedBtn: { backgroundColor: 'rgba(0,0,0,0.05)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 16 },
  redeemedBtnText: { color: Colors.dark.hex_2e1911, fontWeight: 'bold', fontSize: 12 },
  cafeInfoRow: { flexDirection: 'row', alignItems: 'center' },
  cafeLogo: { width: 40, height: 40, borderRadius: 20, marginRight: 12, backgroundColor: Colors.dark.shadowLight },
});
