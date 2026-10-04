import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ScrollView, useWindowDimensions, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/context/AuthContext';
import { supabase } from '@/shared';
import { Coffee } from '@/components/Icon';
import { AnimatedView as MotiView } from '@/components/ui/AnimatedView';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from '@/components/LinearGradient';
import { CafePassLogo } from '@/components/CafePassLogo';
import { AuthInput } from '@/components/ui/AuthInput';
import { AuthPasswordInput } from '@/components/ui/AuthPasswordInput';
import { AuthButton } from '@/components/ui/AuthButton';
import { ErrorAlert } from '@/components/ui/ErrorAlert';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';

export default function Login() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const isSmallDevice = height < 750;
  const setSession = useAuthStore((s) => s.setSession);
  
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState('');

  const validate = () => {
    const newErrors: Record<string, string> = {};
    setServerError('');
    
    // Client-side Validation Rules
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (!isLogin) {
      if (!fullName.trim()) {
        newErrors.fullName = 'Full name is required';
      }
      if (!phone.trim()) {
        newErrors.phone = 'Phone number is required';
      } else if (!/^\+?[\d\s-]{8,}$/.test(phone)) {
        newErrors.phone = 'Please enter a valid phone number';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAuth = async () => {
    if (!validate()) return;
    setLoading(true);
    console.log(`[customer-login] handleAuth called — action: ${isLogin ? 'login' : 'register'}, email: ${email}`);

    try {
      if (isLogin) {
        // Server-side authentication via Edge Function
        console.log('[customer-login] Invoking auth edge function (login)...');
        const { data: res, error } = await supabase.functions.invoke('auth', {
          body: { action: 'login', email, password, appType: 'customer' }
        });
        console.log('[customer-login] login response:', JSON.stringify({ error, resError: res?.error, hasSession: !!res?.data?.session }));

        if (error || res?.error) {
          const errMsg = error?.message || res?.error || '';
          console.error('[customer-login] ❌ Login error:', errMsg);
          if (errMsg.includes('Invalid login credentials')) {
            setServerError('Incorrect email or password. Please try again.');
          } else {
            setServerError(errMsg);
          }
          return;
        }

        if (res?.data?.session) {
          console.log('[customer-login] Session received, setting session...');
          await supabase.auth.setSession({
            access_token: res.data.session.access_token,
            refresh_token: res.data.session.refresh_token
          });
          setSession(res.data.session);
          console.log('[customer-login] ✅ Login successful');
        }
        router.replace('/');
      } else {
        // Server-side registration via Edge Function
        console.log('[customer-login] Invoking auth edge function (register)...', { fullName, phone });
        const { data: res, error } = await supabase.functions.invoke('auth', {
          body: {
            action: 'register',
            email,
            password,
            metadata: {
              full_name: fullName,
              phone: phone,
            }
          }
        });
        console.log('[customer-login] register response:', JSON.stringify({ error, resError: res?.error, hasSession: !!res?.data?.session, hasUser: !!res?.data?.user }));

        if (error || res?.error) {
          const errMsg = error?.message || res?.error || '';
          console.error('[customer-login] ❌ Register error:', errMsg);
          if (errMsg.includes('already registered')) {
            setServerError('An account with this email already exists.');
          } else {
            setServerError(errMsg);
          }
          return;
        }

        if (res?.data?.session) {
          console.log('[customer-login] Session received, setting session...');
          await supabase.auth.setSession({
            access_token: res.data.session.access_token,
            refresh_token: res.data.session.refresh_token
          });
          setSession(res.data.session);
          console.log('[customer-login] ✅ Register + login successful');
        }
        router.replace('/');
      }
    } catch (error: any) {
      console.error('[customer-login] ❌ Unhandled error:', error.message);
      setServerError('An unexpected network error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setIsLogin(!isLogin);
    setErrors({});
    setServerError('');
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={styles.keyboardContainer}
    >
      <LinearGradient 
        colors={[Colors.dark.background, Colors.dark.hex_2e1911]} 
        style={StyleSheet.absoluteFill} 
      />
      <ScrollView 
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom: Math.max(insets.bottom, 12), 
            paddingTop: Math.max(insets.top, 12),
          }
        ]}
        showsVerticalScrollIndicator={false}
        bounces={false}
        keyboardShouldPersistTaps="handled"
      >
        <MotiView 
          from={{ opacity: 0, translateY: -20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ delay: 100 }}
          style={[styles.headerContainer, { marginBottom: isLogin ? 16 : 8 }]}
        >
          <View style={styles.logoWrapper}>
            <CafePassLogo size={Math.min(height * 0.1, 74)} />
          </View>
          <Text style={[styles.appName, { fontSize: 26 }]}>CafePass</Text>
          <Text style={[styles.appSubtitle, { fontSize: 13 }]}>
            {isLogin ? 'Your digital coffee companion' : 'Create your digital pass'}
          </Text>
        </MotiView>

        <MotiView
          from={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 200 }}
          style={[styles.card, { paddingVertical: isLogin ? 22 : 14 }]}
        >
          <ErrorAlert error={serverError} />

          {!isLogin && (
            <>
              <AuthInput
                label="Full Name"
                placeholder="John Doe"
                value={fullName}
                onChangeText={(val) => { setFullName(val); if (errors.fullName) setErrors({...errors, fullName: ''}) }}
                error={errors.fullName}
                isLogin={isLogin}
              />

              <AuthInput
                label="Phone Number"
                placeholder="+1 234 567 8900"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={(val) => { setPhone(val); if (errors.phone) setErrors({...errors, phone: ''}) }}
                error={errors.phone}
                isLogin={isLogin}
              />
            </>
          )}

          <AuthInput
            label="Email"
            placeholder="hello@coffeelover.com"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={(val) => { setEmail(val); if (errors.email) setErrors({...errors, email: ''}) }}
            error={errors.email}
            isLogin={isLogin}
          />

          <AuthPasswordInput
            label="Password"
            placeholder="••••••••"
            value={password}
            onChangeText={(val) => { setPassword(val); if (errors.password) setErrors({...errors, password: ''}) }}
            error={errors.password}
            isLogin={isLogin}
          />

          <AuthButton
            title={loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
            loading={loading}
            isLogin={isLogin}
            onPress={handleAuth}
          />
        </MotiView>

        <MotiView 
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 300 }}
          style={styles.footer}
        >
          <TouchableOpacity onPress={resetForm} style={styles.switchButton}>
            <Text style={styles.switchText}>
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <Text style={styles.switchHighlight}>{isLogin ? "Sign Up" : "Log In"}</Text>
            </Text>
          </TouchableOpacity>
        </MotiView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  headerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoWrapper: {
    marginBottom: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appName: {
    fontFamily: Typography.serif,
    color: Colors.dark.text,
    letterSpacing: -0.5,
  },
  appSubtitle: {
    color: Colors.dark.textSecondary,
    letterSpacing: 0.5,
    marginTop: 2,
  },
  card: {
    backgroundColor: Colors.dark.overlay,
    borderRadius: 28,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    width: '92%',
    maxWidth: 400,
    shadowColor: Colors.dark.background,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  switchButton: {
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  switchText: {
    color: Colors.dark.textSecondary,
    fontSize: 12,
  },
  switchHighlight: {
    color: Colors.dark.primary,
    fontWeight: 'bold',
  },
});
