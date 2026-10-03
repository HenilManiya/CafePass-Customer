import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ScrollView, useWindowDimensions, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/shared';
import { Coffee, ArrowRight, AlertCircle, Eye, EyeOff } from '@/components/Icon';
import { MotiView, AnimatePresence } from 'moti';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from '@/components/LinearGradient';
import { CafePassLogo } from '@/components/CafePassLogo';

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
          body: { action: 'login', email, password }
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
        colors={['#000000', '#2E1911']} 
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
            <CafePassLogo size={isLogin ? Math.min(height * 0.12, 84) : Math.min(height * 0.075, 54)} />
          </View>
          <Text style={[styles.appName, { fontSize: isLogin ? 28 : 22 }]}>CafePass</Text>
          <Text style={[styles.appSubtitle, { fontSize: isLogin ? 13 : 11 }]}>
            {isLogin ? 'Your digital coffee companion' : 'Create your digital pass'}
          </Text>
        </MotiView>

        <MotiView
          from={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 200 }}
          style={[styles.card, { paddingVertical: isLogin ? 22 : 14 }]}
        >
          <AnimatePresence>
            {serverError ? (
              <MotiView 
                from={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={styles.errorAlert}
              >
                <AlertCircle size={18} color="#DC2626" />
                <Text style={styles.errorAlertText}>{serverError}</Text>
              </MotiView>
            ) : null}
          </AnimatePresence>

          {!isLogin && (
            <>
              <View style={{ marginBottom: isLogin ? 12 : 8 }}>
                <Text style={styles.inputLabel}>Full Name</Text>
                <TextInput 
                  placeholder="John Doe"
                  placeholderTextColor="rgba(255, 255, 255, 0.3)"
                  value={fullName}
                  onChangeText={(val) => { setFullName(val); if (errors.fullName) setErrors({...errors, fullName: ''}) }}
                  style={[
                    styles.input,
                    { height: isLogin ? 48 : 40, fontSize: isLogin ? 15 : 13 },
                    errors.fullName ? styles.inputErrorBorder : styles.inputNormalBorder
                  ]}
                />
                {errors.fullName && <Text style={styles.errorText}>{errors.fullName}</Text>}
              </View>

              <View style={{ marginBottom: isLogin ? 12 : 8 }}>
                <Text style={styles.inputLabel}>Phone Number</Text>
                <TextInput 
                  placeholder="+1 234 567 8900"
                  placeholderTextColor="rgba(255, 255, 255, 0.3)"
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={(val) => { setPhone(val); if (errors.phone) setErrors({...errors, phone: ''}) }}
                  style={[
                    styles.input,
                    { height: isLogin ? 48 : 40, fontSize: isLogin ? 15 : 13 },
                    errors.phone ? styles.inputErrorBorder : styles.inputNormalBorder
                  ]}
                />
                {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
              </View>
            </>
          )}

          <View style={{ marginBottom: isLogin ? 12 : 8 }}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput 
              placeholder="hello@coffeelover.com"
              placeholderTextColor="rgba(255, 255, 255, 0.3)"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={(val) => { setEmail(val); if (errors.email) setErrors({...errors, email: ''}) }}
              style={[
                styles.input,
                { height: isLogin ? 48 : 40, fontSize: isLogin ? 15 : 13 },
                errors.email ? styles.inputErrorBorder : styles.inputNormalBorder
              ]}
            />
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
          </View>

          <View style={{ marginBottom: isLogin ? 16 : 10 }}>
            <Text style={styles.inputLabel}>Password</Text>
            <View 
              style={[
                styles.passwordContainer,
                { height: isLogin ? 48 : 40 },
                errors.password ? styles.inputErrorBorder : styles.inputNormalBorder
              ]}
            >
              <TextInput 
                placeholder="••••••••"
                placeholderTextColor="rgba(255, 255, 255, 0.3)"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={(val) => { setPassword(val); if (errors.password) setErrors({...errors, password: ''}) }}
                style={[styles.passwordInput, { fontSize: isLogin ? 15 : 13 }]}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                {showPassword ? <EyeOff size={18} color="#C67C4E" /> : <Eye size={18} color="#C67C4E" />}
              </TouchableOpacity>
            </View>
            {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
          </View>

          <TouchableOpacity 
            disabled={loading}
            style={[
              styles.primaryButton,
              { height: isLogin ? 48 : 42, marginTop: 4 },
              loading && styles.buttonDisabled
            ]}
            onPress={handleAuth}
          >
            <Text style={[styles.primaryButtonText, { fontSize: isLogin ? 15 : 14 }]}>
              {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
            </Text>
            {!loading && <ArrowRight size={18} color="#FFFFFF" />}
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
    backgroundColor: '#000000',
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
    fontFamily: Platform.select({ ios: 'ui-serif', default: 'serif' }),
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  appSubtitle: {
    color: 'rgba(255, 255, 255, 0.7)',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  card: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 28,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    width: '92%',
    maxWidth: 400,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  errorAlert: {
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  errorAlertText: {
    color: '#B91C1C',
    marginLeft: 8,
    flex: 1,
    fontSize: 12,
  },
  inputLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: 'bold',
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontSize: 10,
    marginBottom: 2,
  },
  input: {
    backgroundColor: 'rgba(39, 39, 42, 0.8)',
    paddingHorizontal: 14,
    borderRadius: 12,
    color: '#FFFFFF',
    borderWidth: 1,
  },
  inputNormalBorder: {
    borderColor: 'rgba(198, 124, 78, 0.2)',
  },
  inputErrorBorder: {
    borderColor: '#EF4444',
  },
  passwordContainer: {
    backgroundColor: 'rgba(39, 39, 42, 0.8)',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 14,
    borderWidth: 1,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 14,
    color: '#FFFFFF',
    height: '100%',
  },
  errorText: {
    color: '#F87171',
    fontSize: 12,
    marginTop: 2,
    marginLeft: 4,
  },
  primaryButton: {
    backgroundColor: '#C67C4E',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(198, 124, 78, 0.5)',
    shadowColor: '#C67C4E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginRight: 8,
    letterSpacing: 0.5,
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
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
  },
  switchHighlight: {
    color: '#C67C4E',
    fontWeight: 'bold',
  },
});
