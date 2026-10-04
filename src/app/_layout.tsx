import { Stack, Redirect, useRouter, useSegments } from 'expo-router';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { useEffect } from 'react';

function RootLayoutNav() {
  const { session, initialized } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  if (!initialized) return null;

  const segment = segments[0] as string | undefined;
  const inAuthGroup = segment === 'login' || segment === 'signup';

  if (!session && !inAuthGroup) {
    return <Redirect href="/login" />;
  }

  if (session && inAuthGroup) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <Stack 
      screenOptions={{ headerShown: false }}
      initialRouteName={session ? '(tabs)' : 'login'}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false, gestureEnabled: false }} />
      <Stack.Screen name="signup" options={{ headerShown: false, gestureEnabled: false }} />
      <Stack.Screen name="cafe/[id]" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function Layout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
