import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  useWindowDimensions,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/shared';
import { Coffee, ArrowRight, AlertCircle } from '@/components/Icon';
import { AnimatedView as MotiView, AnimatePresence } from '@/components/ui/AnimatedView';
import { Input, PasswordInput } from '@/components/ui/Input';

import { CafePassLogo } from '@/components/CafePassLogo';
import { useAuth } from '@/context/AuthContext';
import { LinearGradient } from '@/components/LinearGradient';

import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';

export default function Login() {
  const router = useRouter();
  const { setSession } = useAuth();
  
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const { height, width } = useWindowDimensions();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState('');

  const validate = () => {
    const newErrors: Record<string, string> = {};
    setServerError('');
    
    if (!email.trim()) newErrors.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(email)) newErrors.email = 'Valid email required';
    
    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 6) newErrors.password = 'Min 6 characters';
    
    if (!isLogin) {
      if (!fullName.trim()) newErrors.fullName = 'Full Name is required';
      if (!phone.trim()) newErrors.phone = 'Phone is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAuth = async () => {
    if (!validate()) return;
    setLoading(true);
    console.log(`[cafe-login] handleAuth called â€” action: ${isLogin ? 'login' : 'register'}, email: ${email}`);

    try {
      if (isLogin) {
        console.log('[cafe-login] Invoking auth edge function (login)...');
        const { data: res, error } = await supabase.functions.invoke('auth', {
          body: { action: 'login', email, password, appType: 'customer' }
        });
        console.log('[customer-login] login response:', JSON.stringify({ error, resError: res?.error, hasSession: !!res?.data?.session }));
        if (error) throw error;
        if (res?.error) throw new Error(res.error);
        if (res?.data?.session) {
          console.log('[cafe-login] Session received, setting session...');
          await supabase.auth.setSession({
            access_token: res.data.session.access_token,
            refresh_token: res.data.session.refresh_token
          });
          setSession(res.data.session);
          router.replace('/');
          console.log('[cafe-login] âœ… Login successful');
        }
      } else {
        const registerBody = {
          action: 'register',
          email,
          password,
          metadata: {
            full_name: fullName,
            phone: phone,
          }
        };
        console.log('[customer-login] Invoking auth edge function (register)...', JSON.stringify({ action: 'register', email }));
        const { data: res, error } = await supabase.functions.invoke('auth', {
          body: registerBody
        });
        console.log('[customer-login] register response:', JSON.stringify({ error, resError: res?.error, hasSession: !!res?.data?.session, hasUser: !!res?.data?.user }));
          if (error) throw error;
          if (res?.error) throw new Error(res.error);
          if (res?.data?.session) {
            console.log('[cafe-login] Session received, setting session...');
            await supabase.auth.setSession({
              access_token: res.data.session.access_token,
              refresh_token: res.data.session.refresh_token
            });
            setSession(res.data.session);
            router.replace('/');
            console.log('[cafe-login] âœ… Register + login successful');
          } else if (res?.data?.user) {
            console.log('[cafe-login] No session (email confirmation ON), attempting auto-login...');
            const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({ email, password });
            if (loginError) throw loginError;
            if (loginData?.session) {
              setSession(loginData.session);
              router.replace('/');
            }
            console.log('[cafe-login] âœ… Auto-login successful');
          }
      }
    } catch (error: any) {
      console.error('[cafe-login] âŒ Error:', error.message);
      setServerError(error.message);
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
      keyboardVerticalOffset={Platform.OS === 'android' ? 30 : 0}
      style={styles.keyboardContainer}
    >
      <LinearGradient
        colors={[Colors.dark.background, Colors.dark.hex_2e1911]}
        style={StyleSheet.absoluteFill}
      />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
        <MotiView
          from={{ opacity: 0, translateY: -20 }}
          animate={{ opacity: 1, translateY: 0 }}
          style={styles.headerContainer}
        >
          <View style={styles.logoWrapper}>
            <CafePassLogo size={Math.min(height * 0.1, 74)} />
          </View>
          <Text style={[styles.appName, { fontSize: 26 }]}>
            CafePass
          </Text>
          <Text style={styles.appSubtitle}>
            Your digital coffee companion
          </Text>
        </MotiView>

        <MotiView
          from={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          style={styles.card}
        >
          <AnimatePresence>
            {serverError ? (
              <MotiView
                from={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={styles.errorAlert}
              >
                <AlertCircle size={18} color={Colors.dark.error} />
                <Text style={styles.errorAlertText}>{serverError}</Text>
              </MotiView>
            ) : null}
          </AnimatePresence>

          {!isLogin && (
            <MotiView
              from={{ opacity: 0, translateY: -10 }}
              animate={{ opacity: 1, translateY: 0 }}
              style={styles.fieldGroup}
            >
              <Input
                id="login-fullname"
                label="Full Name"
                placeholder="John Doe"
                value={fullName}
                onChangeText={setFullName}
                error={errors.fullName}
              />
              
              <Input
                id="login-phone"
                label="Phone Number"
                placeholder="+1 234 567 8900"
                value={phone}
                onChangeText={setPhone}
                error={errors.phone}
              />
            </MotiView>
          )}

          <Input
            id="login-email"
            label="Email"
            placeholder="coffee@lover.com"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            error={errors.email}
          />

          <PasswordInput
            id="login-password"
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            error={errors.password}
          />

          <TouchableOpacity 
            disabled={loading}
            style={[
              styles.primaryButton,
              loading && styles.buttonDisabled
            ]}
            onPress={handleAuth}
          >
            <Text style={styles.primaryButtonText}>
              {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
            </Text>
            {!loading && <ArrowRight size={18} color={Colors.dark.dark} />}
          </TouchableOpacity>
        </MotiView>

        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 300 }}
          style={styles.footer}
        >
          <TouchableOpacity onPress={resetForm} style={styles.switchButton}>
            <Text style={styles.switchText}>
              {isLogin ? "Don't have an account? " : "Already registered? "}
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoWrapper: {
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appName: {
    fontFamily: Typography.serif,
    color: Colors.dark.text,
    letterSpacing: -0.5,
    fontWeight: 'bold',
  },
  primaryText: {
    color: Colors.dark.primary,
  },
  appSubtitle: {
    color: Colors.dark.textSecondary,
    letterSpacing: 0.3,
    fontSize: 13,
    marginTop: 4,
  },
  card: {
    backgroundColor: Colors.dark.hex_26140b,
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 22,
    borderWidth: 1,
    borderColor: Colors.dark.borderSubtle,
    width: '100%',
    maxWidth: 400,
    shadowColor: Colors.dark.background,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  errorAlert: {
    backgroundColor: Colors.dark.errorBackground,
    padding: 12,
    borderRadius: 12,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.dark.errorBorder,
  },
  errorAlertText: {
    color: Colors.dark.hex_fecaca,
    marginLeft: 8,
    flex: 1,
    fontSize: 13,
  },
  fieldGroup: {
    marginBottom: 0,
  },
  primaryButton: {
    backgroundColor: Colors.dark.primary,
    minHeight: 48,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: Colors.dark.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: Colors.dark.dark,
    fontWeight: 'bold',
    fontSize: 15,
    marginRight: 8,
  },
  footer: {
    alignItems: 'center',
    marginTop: 18,
  },
  switchButton: {
    padding: 8,
  },
  switchText: {
    color: Colors.dark.muted,
    fontSize: 13,
  },
  switchHighlight: {
    color: Colors.dark.primary,
    fontWeight: 'bold',
  },
});
