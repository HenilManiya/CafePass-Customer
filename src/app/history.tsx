import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, Clock, MapPin } from '@/components/Icon';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { LinearGradient } from '@/components/LinearGradient';
import { useAuthStore } from '@/context/AuthContext';
import { supabase } from '@/shared';
import { AnimatedView as MotiView } from '@/components/ui/AnimatedView';

export default function HistoryScreen() {
  const router = useRouter();
  const { session } = useAuthStore();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, [session?.user?.id]);

  const fetchHistory = async () => {
    if (!session?.user?.id) return;
    try {
      const [cardsRes, rewardsRes] = await Promise.all([
        supabase.from('digital_cards').select('*, cafes(name, branch_name, location)').eq('customer_id', session.user.id),
        supabase.from('rewards').select('*, cafes(name, branch_name, location)').eq('customer_id', session.user.id)
      ]);

      let generatedHistory: any[] = [];

      // Generate history items for each punch
      cardsRes.data?.forEach((card: any) => {
          const punchCount = card.punch_count || 0;
          const baseDate = new Date(card.updated_at || Date.now());
          
          for (let i = 0; i < punchCount; i++) {
              // Space out the punches by just 1 second so they sort correctly, but don't invent dates in the past!
              const punchDate = new Date(baseDate.getTime() - (i * 1000));
              generatedHistory.push({
                 id: `punch_${card.id}_${i}`,
                 cafeId: card.cafe_id,
                 cafeName: card.cafes?.name || 'Cafe',
                 branchName: card.cafes?.branch_name || 'Main Branch',
                 location: card.cafes?.location,
                 date: punchDate,
                 type: 'Scanned for Punch',
                 amount: '+1 Punch',
                 isReward: false
              });
          }
      });

      // Generate history items for rewards
      rewardsRes.data?.forEach((reward: any) => {
          const createdDate = new Date(reward.created_at || reward.updated_at || Date.now());
          generatedHistory.push({
             id: `reward_earned_${reward.id}`,
             cafeId: reward.cafe_id,
             cafeName: reward.cafes?.name || 'Cafe',
             branchName: reward.cafes?.branch_name || 'Main Branch',
             location: reward.cafes?.location,
             date: createdDate,
             type: 'Earned Free Beverage',
             amount: 'Reward',
             isReward: true
          });

          if (reward.status !== 'AVAILABLE') {
              const updatedDate = new Date(reward.updated_at || Date.now());
              generatedHistory.push({
                 id: `reward_used_${reward.id}`,
                 cafeId: reward.cafe_id,
                 cafeName: reward.cafes?.name || 'Cafe',
                 branchName: reward.cafes?.branch_name || 'Main Branch',
                 location: reward.cafes?.location,
                 date: updatedDate,
                 type: 'Redeemed Free Beverage',
                 amount: 'Used',
                 isReward: true
              });
          }
      });
      
      // Sort history descending by date
      generatedHistory.sort((a, b) => b.date.getTime() - a.date.getTime());
      setHistory(generatedHistory);
    } catch (err) {
      console.error('Error fetching history', err);
    } finally {
      setLoading(false);
    }
  };

  const renderHistoryItem = ({ item, index }: { item: any, index: number }) => (
    <MotiView from={{ opacity: 0, translateX: -20 }} animate={{ opacity: 1, translateX: 0 }} transition={{ delay: index * 50 }} style={styles.historyRow}>
      <View style={styles.dateCol}>
        <Text style={styles.dateDay}>{item.date.getDate()}</Text>
        <Text style={styles.dateMonth}>{item.date.toLocaleString('default', { month: 'short' })}</Text>
      </View>
      
      <View style={styles.timelineTrack}>
         <View style={[styles.dot, item.isReward && styles.dotReward]} />
         {index !== history.length - 1 && <View style={styles.line} />}
      </View>

      <View style={styles.historyContent}>
        <View style={styles.historyTitleRow}>
          <TouchableOpacity onPress={() => item.cafeId && router.push(`/cafe/${item.cafeId}`)}>
            <Text style={styles.historyTitle}>{item.cafeName}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.locationRow}>
           <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 }}>
              <MapPin size={12} color={Colors.dark.muted} />
              <Text style={styles.historyLocation} numberOfLines={1}>{item.branchName}</Text>
           </View>
           {item.location && (
             <TouchableOpacity 
               onPress={() => Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(item.location)}`)}
               style={styles.historyMapBtn}
             >
               <MapPin size={12} color={Colors.dark.primary} />
               <Text style={styles.historyMapBtnText}>Map</Text>
             </TouchableOpacity>
           )}
        </View>
        <View style={styles.historyFooter}>
           <Text style={styles.historyType}>{item.type}</Text>
           <Text style={[styles.historyAmount, item.isReward && styles.historyAmountReward]}>{item.amount}</Text>
        </View>
      </View>
    </MotiView>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={[Colors.dark.background, Colors.dark.hex_1c0f0a]} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ChevronLeft size={24} color={Colors.dark.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Punch History</Text>
          <View style={{ width: 24 }} />
        </View>

        {loading ? (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color={Colors.dark.primary} />
          </View>
        ) : history.length === 0 ? (
          <View style={styles.centerContent}>
            <Clock size={48} color={Colors.dark.primaryMuted} />
            <Text style={styles.emptyText}>No activity found.</Text>
            <Text style={styles.emptySubtext}>Your recent visits and punch activity will appear here.</Text>
          </View>
        ) : (
          <FlatList
            data={history}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderHistoryItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </SafeAreaView>
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
  historyRow: { flexDirection: 'row', minHeight: 90 },
  dateCol: { width: 50, alignItems: 'center', paddingTop: 4 },
  dateDay: { color: Colors.dark.text, fontSize: 22, fontWeight: 'bold', fontFamily: Typography.serif },
  dateMonth: { color: Colors.dark.primary, fontSize: 12, textTransform: 'uppercase', fontWeight: 'bold' },
  timelineTrack: { width: 30, alignItems: 'center' },
  dot: { width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.dark.border, marginTop: 10, borderWidth: 2, borderColor: Colors.dark.background, zIndex: 2 },
  dotReward: { backgroundColor: Colors.dark.primary },
  line: { width: 2, flex: 1, backgroundColor: Colors.dark.borderSubtle, marginTop: -2, zIndex: 1 },
  historyContent: { flex: 1, backgroundColor: Colors.dark.cardBackground, padding: 16, borderRadius: 16, marginBottom: 16, borderWidth: 1, borderColor: Colors.dark.borderSubtle },
  historyTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  historyTitle: { color: Colors.dark.text, fontSize: 16, fontWeight: 'bold' },
  locationRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  historyMapBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, backgroundColor: Colors.dark.hex_1c0f0a, borderRadius: 12, gap: 4 },
  historyMapBtnText: { color: Colors.dark.primary, fontSize: 10, fontWeight: 'bold' },
  historyLocation: { color: Colors.dark.muted, fontSize: 12 },
  historyFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: Colors.dark.borderSubtle, paddingTop: 12 },
  historyType: { color: Colors.dark.textSecondary, fontSize: 12, fontWeight: '500' },
  historyAmount: { color: Colors.dark.text, fontSize: 12, fontWeight: 'bold' },
  historyAmountReward: { color: Colors.dark.primary },
});
