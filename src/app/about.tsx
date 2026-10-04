import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, Info, ExternalLink, Phone } from '@/components/Icon';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { LinearGradient } from '@/components/LinearGradient';
import { AnimatedView as MotiView } from '@/components/ui/AnimatedView';

export default function AboutScreen() {
  const router = useRouter();

  const faqs = [
    { q: "How do I earn points?", a: "Scan your unique QR code at any participating cafe to earn a punch for every coffee purchased." },
    { q: "How do I redeem my rewards?", a: "Once your digital punch card is full, present the completed card screen to the barista to redeem your free coffee." },
    { q: "Can I use points at different cafes?", a: "Punches are specific to the cafe chain where you earned them." }
  ];

  return (
    <View style={styles.container}>
      <LinearGradient colors={[Colors.dark.background, Colors.dark.hex_1c0f0a]} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ChevronLeft size={24} color={Colors.dark.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Help & Support</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <MotiView from={{ opacity: 0, translateY: 20 }} animate={{ opacity: 1, translateY: 0 }} style={styles.contactCard}>
            <Info size={32} color={Colors.dark.primary} />
            <Text style={styles.contactTitle}>Need immediate help?</Text>
            <Text style={styles.contactSubtitle}>Our support team is available 24/7 to assist you with any issues.</Text>
            
            <View style={styles.btnRow}>
              <TouchableOpacity style={styles.actionBtn}>
                <Phone size={18} color={Colors.dark.dark} />
                <Text style={styles.actionBtnText}>Call Us</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, styles.actionBtnOutline]}>
                <ExternalLink size={18} color={Colors.dark.primary} />
                <Text style={[styles.actionBtnText, styles.actionBtnTextOutline]}>Email Us</Text>
              </TouchableOpacity>
            </View>
          </MotiView>

          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          
          {faqs.map((faq, index) => (
            <MotiView key={index} from={{ opacity: 0, translateY: 20 }} animate={{ opacity: 1, translateY: 0 }} transition={{ delay: 200 + index * 100 }} style={styles.faqCard}>
              <Text style={styles.faqQuestion}>{faq.q}</Text>
              <Text style={styles.faqAnswer}>{faq.a}</Text>
            </MotiView>
          ))}
          
          <View style={{ height: 40 }} />
        </ScrollView>
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
  content: { padding: 20 },
  contactCard: { backgroundColor: Colors.dark.hex_26140b, padding: 24, borderRadius: 24, alignItems: 'center', marginBottom: 32, borderWidth: 1, borderColor: Colors.dark.borderSubtle },
  contactTitle: { color: Colors.dark.text, fontSize: 18, fontWeight: 'bold', marginTop: 16, marginBottom: 8 },
  contactSubtitle: { color: Colors.dark.textSecondary, fontSize: 14, textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  btnRow: { flexDirection: 'row', gap: 12, width: '100%' },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.dark.primary, paddingVertical: 14, borderRadius: 20 },
  actionBtnText: { color: Colors.dark.dark, fontWeight: 'bold', fontSize: 14 },
  actionBtnOutline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: Colors.dark.primaryMuted },
  actionBtnTextOutline: { color: Colors.dark.primary },
  sectionTitle: { color: Colors.dark.text, fontSize: 18, fontWeight: 'bold', fontFamily: Typography.serif, marginBottom: 16, marginLeft: 4 },
  faqCard: { backgroundColor: Colors.dark.cardBackground, padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: Colors.dark.borderSubtle },
  faqQuestion: { color: Colors.dark.text, fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
  faqAnswer: { color: Colors.dark.textSecondary, fontSize: 14, lineHeight: 20 }
});
