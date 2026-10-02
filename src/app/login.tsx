import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/shared';
import { Coffee, ArrowRight, AlertCircle } from 'lucide-react-native';
import { MotiView, AnimatePresence } from 'moti';

export default function Login() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);

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

    try {
      if (isLogin) {
        // Server-side authentication
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) {
          // Map specific Supabase server errors to user-friendly messages
          if (error.message.includes('Invalid login credentials')) {
            setServerError('Incorrect email or password. Please try again.');
          } else {
            setServerError(error.message);
          }
          return;
        }
        
        setSession(data.session);
        router.replace('/');
      } else {
        // Server-side registration
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              phone: phone,
            }
          }
        });
        
        if (error) {
          // Handle Supabase sign up errors (e.g. email already exists)
          if (error.message.includes('already registered')) {
            setServerError('An account with this email already exists.');
          } else {
            setServerError(error.message);
          }
          return;
        }
        
        setSession(data.session);
        router.replace('/');
      }
    } catch (error: any) {
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
      className="flex-1 bg-[#FAF6F0]"
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 32 }}>
        <MotiView 
          from={{ opacity: 0, translateY: -20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ delay: 100 }}
          className="items-center mb-10 mt-10"
        >
          <View className="bg-[#4A3428] w-24 h-24 rounded-[32px] items-center justify-center mb-6 shadow-xl shadow-[#4A3428]/30">
            <Coffee size={48} color="#FFF" />
          </View>
          <Text className="text-5xl font-serif text-[#3E2723] tracking-tight">CafePass</Text>
          <Text className="text-[#8D6E63] text-lg mt-2 font-sans tracking-wide">Your digital coffee companion</Text>
        </MotiView>

        <MotiView
          from={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 200 }}
          className="bg-white p-6 rounded-[32px] shadow-sm border border-[#EFEBE9]"
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
              <View className="mb-5">
                <Text className="text-[#5D4037] text-sm font-bold ml-2 mb-1 uppercase tracking-wider">Full Name</Text>
                <TextInput 
                  placeholder="John Doe"
                  placeholderTextColor="#BCAAA4"
                  value={fullName}
                  onChangeText={(val) => { setFullName(val); if (errors.fullName) setErrors({...errors, fullName: ''}) }}
                  className={`bg-[#FAF6F0] px-5 py-4 rounded-2xl text-[#3E2723] font-sans text-base border ${errors.fullName ? 'border-red-400' : 'border-[#EFEBE9]'}`}
                />
                {errors.fullName && <Text className="text-red-500 text-xs mt-1 ml-2">{errors.fullName}</Text>}
              </View>

              <View className="mb-5">
                <Text className="text-[#5D4037] text-sm font-bold ml-2 mb-1 uppercase tracking-wider">Phone Number</Text>
                <TextInput 
                  placeholder="+1 234 567 8900"
                  placeholderTextColor="#BCAAA4"
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={(val) => { setPhone(val); if (errors.phone) setErrors({...errors, phone: ''}) }}
                  className={`bg-[#FAF6F0] px-5 py-4 rounded-2xl text-[#3E2723] font-sans text-base border ${errors.phone ? 'border-red-400' : 'border-[#EFEBE9]'}`}
                />
                {errors.phone && <Text className="text-red-500 text-xs mt-1 ml-2">{errors.phone}</Text>}
              </View>
            </>
          )}

          <View className="mb-5">
            <Text className="text-[#5D4037] text-sm font-bold ml-2 mb-1 uppercase tracking-wider">Email</Text>
            <TextInput 
              placeholder="hello@coffeelover.com"
              placeholderTextColor="#BCAAA4"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={(val) => { setEmail(val); if (errors.email) setErrors({...errors, email: ''}) }}
              className={`bg-[#FAF6F0] px-5 py-4 rounded-2xl text-[#3E2723] font-sans text-base border ${errors.email ? 'border-red-400' : 'border-[#EFEBE9]'}`}
            />
            {errors.email && <Text className="text-red-500 text-xs mt-1 ml-2">{errors.email}</Text>}
          </View>

          <View className="mb-8">
            <Text className="text-[#5D4037] text-sm font-bold ml-2 mb-1 uppercase tracking-wider">Password</Text>
            <TextInput 
              placeholder="••••••••"
              placeholderTextColor="#BCAAA4"
              secureTextEntry
              value={password}
              onChangeText={(val) => { setPassword(val); if (errors.password) setErrors({...errors, password: ''}) }}
              className={`bg-[#FAF6F0] px-5 py-4 rounded-2xl text-[#3E2723] font-sans text-base border ${errors.password ? 'border-red-400' : 'border-[#EFEBE9]'}`}
            />
            {errors.password && <Text className="text-red-500 text-xs mt-1 ml-2">{errors.password}</Text>}
          </View>

          <TouchableOpacity 
            disabled={loading}
            className={`bg-[#4A3428] px-8 py-5 rounded-2xl flex-row items-center justify-center shadow-lg shadow-[#4A3428]/40 ${loading ? 'opacity-70' : ''}`}
            onPress={handleAuth}
          >
            <Text className="text-white font-bold text-lg mr-2">
              {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
            </Text>
            {!loading && <ArrowRight size={20} color="#FFF" />}
          </TouchableOpacity>
        </MotiView>

        <MotiView 
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 300 }}
          className="mt-8 mb-10 items-center"
        >
          <TouchableOpacity onPress={resetForm}>
            <Text className="text-[#8D6E63] font-sans text-base">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <Text className="text-[#4A3428] font-bold">{isLogin ? "Sign Up" : "Log In"}</Text>
            </Text>
          </TouchableOpacity>
        </MotiView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
