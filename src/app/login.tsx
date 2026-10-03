import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ScrollView, useWindowDimensions, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/shared';
import { Coffee, ArrowRight, AlertCircle, Eye, EyeOff } from '@/components/Icon';
import { MotiView, AnimatePresence } from 'moti';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
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
      className="flex-1 bg-black"
    >
      <LinearGradient 
        colors={['#000000', '#2E1911']} 
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} 
      />
      <ScrollView contentContainerStyle={{ flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: Math.max(insets.bottom, 10), paddingTop: Math.max(insets.top, 10) }}>
        <MotiView 
          from={{ opacity: 0, translateY: -20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ delay: 100 }}
          className="items-center"
          style={{ justifyContent: 'center', marginBottom: 16 }}
        >
          <View style={{ marginBottom: 6, alignItems: 'center', justifyContent: 'center' }}>
            <CafePassLogo size={height * 0.16} />
          </View>
          <Text className="font-serif text-white tracking-tight" style={{ fontSize: height * 0.04 }}>CafePass</Text>
          {!isSmallDevice && <Text className="text-white/70 font-sans tracking-wide" style={{ fontSize: height * 0.02, marginTop: height * 0.005 }}>Your digital coffee companion</Text>}
        </MotiView>

        <MotiView
          from={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 200 }}
          className="bg-black/40 shadow-lg border border-white/10 rounded-[32px]"
          style={{ width: '90%', padding: '6%', paddingVertical: '8%', backdropFilter: 'blur(10px)' }}
        >
          
          <AnimatePresence>
            {serverError ? (
              <MotiView 
                from={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-red-50 p-4 rounded-2xl mb-6 flex-row items-center border border-red-100"
              >
                <AlertCircle size={20} color="#DC2626" />
                <Text className="text-red-700 ml-2 font-sans flex-1">{serverError}</Text>
              </MotiView>
            ) : null}
          </AnimatePresence>

          {!isLogin && (
            <>
              <View style={{ marginBottom: height * 0.015 }}>
                <Text className="text-white/70 font-bold ml-2 uppercase tracking-wider" style={{ fontSize: height * 0.012, marginBottom: height * 0.005 }}>Full Name</Text>
                <TextInput 
                  placeholder="John Doe"
                  placeholderTextColor="rgba(255, 255, 255, 0.3)"
                  value={fullName}
                  onChangeText={(val) => { setFullName(val); if (errors.fullName) setErrors({...errors, fullName: ''}) }}
                  className={`bg-zinc-800/80 px-4 rounded-xl text-white font-sans border ${errors.fullName ? 'border-red-500' : 'border-primary/20'}`}
                  style={{ height: height * 0.06, fontSize: height * 0.018 }}
                />
                {errors.fullName && <Text className="text-red-400 text-xs mt-1 ml-2">{errors.fullName}</Text>}
              </View>

              <View style={{ marginBottom: height * 0.015 }}>
                <Text className="text-white/70 font-bold ml-2 uppercase tracking-wider" style={{ fontSize: height * 0.012, marginBottom: height * 0.005 }}>Phone Number</Text>
                <TextInput 
                  placeholder="+1 234 567 8900"
                  placeholderTextColor="rgba(255, 255, 255, 0.3)"
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={(val) => { setPhone(val); if (errors.phone) setErrors({...errors, phone: ''}) }}
                  className={`bg-zinc-800/80 px-4 rounded-xl text-white font-sans border ${errors.phone ? 'border-red-500' : 'border-primary/20'}`}
                  style={{ height: height * 0.06, fontSize: height * 0.018 }}
                />
                {errors.phone && <Text className="text-red-400 text-xs mt-1 ml-2">{errors.phone}</Text>}
              </View>
            </>
          )}

          <View style={{ marginBottom: height * 0.015 }}>
            <Text className="text-white/70 font-bold ml-2 uppercase tracking-wider" style={{ fontSize: height * 0.012, marginBottom: height * 0.005 }}>Email</Text>
            <TextInput 
              placeholder="hello@coffeelover.com"
              placeholderTextColor="rgba(255, 255, 255, 0.3)"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={(val) => { setEmail(val); if (errors.email) setErrors({...errors, email: ''}) }}
              className={`bg-zinc-800/80 px-4 rounded-xl text-white font-sans border ${errors.email ? 'border-red-500' : 'border-primary/20'}`}
              style={{ height: height * 0.06, fontSize: height * 0.018 }}
            />
            {errors.email && <Text className="text-red-400 text-xs mt-1 ml-2">{errors.email}</Text>}
          </View>

          <View style={{ marginBottom: height * 0.025 }}>
            <Text className="text-white/70 font-bold ml-2 uppercase tracking-wider" style={{ fontSize: height * 0.012, marginBottom: height * 0.005 }}>Password</Text>
            <View className={`bg-zinc-800/80 rounded-xl border ${errors.password ? 'border-red-500' : 'border-primary/20'} flex-row items-center pr-4`} style={{ height: height * 0.06 }}>
              <TextInput 
                placeholder="••••••••"
                placeholderTextColor="rgba(255, 255, 255, 0.3)"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={(val) => { setPassword(val); if (errors.password) setErrors({...errors, password: ''}) }}
                className="flex-1 px-4 text-white font-sans h-full"
                style={{ fontSize: height * 0.018 }}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                {showPassword ? <EyeOff size={height * 0.022} color="#C67C4E" /> : <Eye size={height * 0.022} color="#C67C4E" />}
              </TouchableOpacity>
            </View>
            {errors.password && <Text className="text-red-400 text-xs mt-1 ml-2">{errors.password}</Text>}
          </View>

          <TouchableOpacity 
            disabled={loading}
            className={`bg-primary border border-primary/50 px-6 rounded-xl flex-row items-center justify-center shadow-lg shadow-primary/20 ${loading ? 'opacity-70' : ''}`}
            style={{ height: height * 0.065 }}
            onPress={handleAuth}
          >
            <Text className="text-white font-bold mr-2 tracking-wide" style={{ fontSize: height * 0.02 }}>
              {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
            </Text>
            {!loading && <ArrowRight size={height * 0.025} color="#FFFFFF" />}
          </TouchableOpacity>
        </MotiView>

        <MotiView 
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 300 }}
          className="items-center"
          style={{ height: height * 0.1, justifyContent: 'center' }}
        >
          <TouchableOpacity onPress={resetForm}>
            <Text className="text-white/70 font-sans" style={{ fontSize: height * 0.016 }}>
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <Text className="text-primary font-bold">{isLogin ? "Sign Up" : "Log In"}</Text>
            </Text>
          </TouchableOpacity>
        </MotiView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
