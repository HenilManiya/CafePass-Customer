import { Stack, useRouter, useSegments } from 'expo-router';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { useEffect } from 'react';
import '../global.css';

function RootLayoutNav() {
  const { session, initialized } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!initialized) return;

    const inAuthGroup = segments[0] === 'login';

    if (!session && !inAuthGroup) {
      // Redirect to login if unauthenticated and trying to access app
      router.replace('/login');
    } else if (session && inAuthGroup) {
      // Redirect to home if authenticated and on login screen
      router.replace('/');
    }
  }, [session, initialized, segments]);

  if (!initialized) return null;

  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function Layout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
