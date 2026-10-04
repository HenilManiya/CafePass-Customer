import { Stack, useRouter, useSegments } from 'expo-router';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { useEffect } from 'react';

function RootLayoutNav() {
  const { session, initialized } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!initialized) return;

    const segment = segments[0] as string | undefined;
    const inAuthGroup = segment === 'login' || segment === 'signup';

    if (!session && !inAuthGroup) {
      // Redirect to login if unauthenticated and trying to access app
      router.replace('/login');
    } else if (session && inAuthGroup) {
      // Redirect to home if authenticated and on login screen
      router.replace('/');
    }
  }, [session, initialized, segments]);

  if (!initialized) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false, gestureEnabled: false }} />
      <Stack.Screen name="signup" options={{ headerShown: false, gestureEnabled: false }} />
      <Stack.Screen name="scan" options={{ presentation: 'modal', headerShown: false }} />
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
