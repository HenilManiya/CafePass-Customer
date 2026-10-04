import React from 'react';
import { Tabs, useRouter } from 'expo-router';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Coffee, Scan, User } from '@/components/Icon';
import { Colors } from '@/constants/Colors';

function CustomTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const currentRoute = state.routes[state.index].name;

  return (
    <View style={[styles.bottomNav, { paddingBottom: Math.max(insets.bottom, 16), height: 72 + Math.max(insets.bottom, 0) }]}>
      <TouchableOpacity onPress={() => navigation.navigate('index')} style={[styles.tabButton, { opacity: currentRoute === 'index' ? 1 : 0.4 }]}>
        <Coffee size={24} color={currentRoute === 'index' ? Colors.dark.primary : 'white'} />
        <Text style={[styles.tabText, { color: currentRoute === 'index' ? Colors.dark.primary : 'white' }]}>Cards</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push('/scan')} style={styles.centerScannerButton}>
        <View style={styles.scannerCircle}>
          <Scan size={26} color={Colors.dark.dark} />
        </View>
        <Text style={styles.scannerLabel}>Scan QR</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('profile')} style={[styles.tabButton, { opacity: currentRoute === 'profile' ? 1 : 0.4 }]}>
        <User size={24} color={currentRoute === 'profile' ? Colors.dark.primary : 'white'} />
        <Text style={[styles.tabText, { color: currentRoute === 'profile' ? Colors.dark.primary : 'white' }]}>Profile</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs tabBar={(props) => <CustomTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bottomNav: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
    paddingHorizontal: 24, borderTopWidth: 1, borderTopColor: Colors.dark.border,
    borderTopLeftRadius: 32, borderTopRightRadius: 32, backgroundColor: Colors.dark.dark,
    position: 'absolute', bottom: 0, width: '100%',
  },
  tabButton: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', paddingVertical: 4 },
  tabText: { fontSize: 12, marginTop: 4, fontWeight: 'bold' },
  centerScannerButton: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', paddingVertical: 4, marginTop: -32 },
  scannerCircle: {
    backgroundColor: Colors.dark.primary, width: 56, height: 56, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: Colors.dark.dark,
    shadowColor: Colors.dark.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 10, elevation: 6
  },
  scannerLabel: { color: Colors.dark.textSecondary, fontSize: 12, marginTop: 4, fontWeight: 'bold' },
});
