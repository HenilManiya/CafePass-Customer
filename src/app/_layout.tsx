import { Stack, useRouter, useSegments } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { useEffect } from 'react';
import '../global.css';

export default function Layout() {
  const { session, initialized, initialize } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    initialize();
  }, []);

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

  if (!initialized) return null; // Or a loading spinner

  return <Stack screenOptions={{ headerShown: false }} />;
}
