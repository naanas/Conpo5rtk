// src/LoginScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Image,
  Alert,
  ActivityIndicator,
  Animated,
  Easing,
  StatusBar,
  Platform
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import Icon from 'react-native-vector-icons/FontAwesome';
import { useNavigation } from '@react-navigation/native';
import MainHeader from './components/MainHeader';

const welcomeSectionLogo = require('../assets/logo.png');

const LoginScreen = () => {
  const [userCode, setUserCode] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();

  const contentOpacity = useRef(new Animated.Value(0)).current;
  const welcomeSlideAnim = useRef(new Animated.Value(-300)).current;
  const formSlideAnim = useRef(new Animated.Value(300)).current;
  const abstractRotation = useRef(new Animated.Value(0)).current;

  const dynamicHeaderHeight = Platform.select({
    ios: 100,
    android: 80,
    default: 80,
  });

  useEffect(() => {
    Animated.parallel([
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 1000,
        easing: Easing.ease,
        useNativeDriver: true,
      }),
      Animated.timing(welcomeSlideAnim, {
        toValue: 0,
        duration: 800,
        easing: Easing.out(Easing.ease),
        delay: 200,
        useNativeDriver: true,
      }),
      Animated.timing(formSlideAnim, {
        toValue: 0,
        duration: 800,
        easing: Easing.out(Easing.ease),
        delay: 400,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.timing(abstractRotation, {
        toValue: 1,
        duration: 20000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const handleSubmit = async () => {
    if (!userCode.trim() || !password.trim()) {
      Alert.alert('Input Tidak Lengkap', 'Mohon masukkan User Name dan Password Anda.');
      return;
    }

    if (loading) {
      return;
    }

    setLoading(true);
    const endpointUrl = 'https://ptm-tracker-service.onrender.com/api/v1/auth/login';

    console.log('Mencoba masuk dengan payload:', { userCode, password });

    try {
      const response = await fetch(endpointUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userCode: userCode,
          password: password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert('Login Berhasil!', data.message || 'Anda berhasil masuk.');
        console.log('Respons dari server:', data);
        // --- PERBAIKAN DI SINI: Akses token melalui data.data.token ---
        if (data.data && data.data.token) { // Pastikan data.data ada, lalu akses token
          await AsyncStorage.setItem('userToken', data.data.token);
          console.log('Token disimpan:', data.data.token);
        } else {
          // Peringatan ini sekarang akan muncul hanya jika 'data.data' atau 'data.data.token' tidak ada
          console.warn('Login berhasil, tetapi token tidak ditemukan di respons (data.data.token).');
        }
        navigation.replace('Dashboard');
      } else {
        const errorMessage = data.message || 'Kredensial tidak valid atau terjadi kesalahan server. Silakan coba lagi.';
        Alert.alert('Login Gagal!', errorMessage);
        console.error('Kesalahan respons server:', data);
      }
    } catch (error) {
      Alert.alert(
        'Kesalahan Koneksi',
        'Tidak dapat terhubung ke server. Periksa koneksi internet Anda atau coba lagi nanti.'
      );
      console.error('Kesalahan jaringan atau fetch:', error);
    } finally {
      setLoading(false);
    }
  };

  const rotateData = abstractRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <SafeAreaView style={styles.container}>
      <MainHeader subtitle="Welcome back to your dashboard!" />

      <View style={styles.backgroundSolid}>
        <Animated.View style={[styles.abstractShape1, { transform: [{ rotate: rotateData }, { translateY: abstractRotation.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 10, 0] }) }] }]} />
        <Animated.View style={[styles.abstractShape2, { transform: [{ rotate: rotateData }, { translateX: abstractRotation.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, -15, 0] }) }] }]} />

        <Animated.View style={[styles.contentWrapper, { opacity: contentOpacity, marginTop: dynamicHeaderHeight }]}>
          <Animated.View style={[styles.welcomeSection, { transform: [{ translateX: welcomeSlideAnim }] }]}>
            <Image
              source={welcomeSectionLogo}
              style={styles.welcomeLogo}
              resizeMode="contain"
            />
            <Text style={styles.welcomeText}>Welcome!</Text>
            <View style={styles.welcomeUnderline} />
            <Text style={styles.welcomeDescription}>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
              eiusmod tempor incididunt ut labore et dolore magna aliqua.
            </Text>
            <TouchableOpacity style={styles.learnMoreButton}>
              <Text style={styles.learnMoreButtonText}>Learn More</Text>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View style={[styles.signInFormContainer, { transform: [{ translateX: formSlideAnim }] }]}>
            <Text style={styles.signInTitle}>
              Sign in <Text style={styles.signInUnderline}></Text>
            </Text>

            <Text style={styles.label}>User ID</Text>
            <TextInput
              style={styles.input}
              placeholder="Masukan User ID"
              placeholderTextColor="#999"
              value={userCode}
              onChangeText={setUserCode}
              autoCapitalize="none"
              editable={!loading}
              id="userCodeInput"
            />

            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Masukan Password"
              placeholderTextColor="#999"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              editable={!loading}
              id="passwordInput"
            />

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit}
              disabled={loading}
            >
              <View
                style={styles.submitButtonSolid}>
                {loading ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.submitButtonText}>Submit</Text>
                )}
              </View>
            </TouchableOpacity>

            <View style={styles.socialIconsContainer}>
              <Icon name="facebook" size={30} color="#FFF" style={styles.socialIconMargin} />
              <Icon name="google" size={30} color="#FFF" style={styles.socialIconMargin} />
              <Icon name="pinterest" size={30} color="#FFF" style={styles.socialIconMargin} />
            </View>
          </Animated.View>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundSolid: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    backgroundColor: '#0073fe',
  },
  abstractShape1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.05)',
    top: 50,
    left: -50,
  },
  abstractShape2: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(255,255,255,0.03)',
    bottom: -100,
    right: -100,
  },
  contentWrapper: {
    flexDirection: 'row',
    flex: 1,
    width: '90%',
    maxWidth: 1200,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  welcomeSection: {
    flex: 1,
    paddingRight: 40,
    alignItems: 'flex-start',
  },
  welcomeLogo: {
    width: 150,
    height: 150,
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 50,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 10,
  },
  welcomeUnderline: {
    width: 60,
    height: 4,
    backgroundColor: '#FFF',
    marginBottom: 20,
  },
  welcomeDescription: {
    fontSize: 16,
    color: '#E0BBE4',
    marginBottom: 30,
    lineHeight: 24,
  },
  learnMoreButton: {
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 25,
    backgroundColor: '#FF6A00',
  },
  learnMoreButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  signInFormContainer: {
    width: 400,
    padding: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0, 50, 150, 0.6)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 15,
  },
  signInTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 30,
    alignSelf: 'center',
  },
  signInUnderline: {
    height: 3,
    width: 80,
    backgroundColor: '#FFF',
    position: 'absolute',
    bottom: -5,
    alignSelf: 'center',
  },
  label: {
    fontSize: 16,
    color: '#FFF',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    color: '#FFF',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginBottom: 20,
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  submitButton: {
    width: '100%',
    borderRadius: 8,
    marginTop: 10,
    marginBottom: 30,
  },
  submitButtonSolid: {
    paddingVertical: 15,
    alignItems: 'center',
    backgroundColor: '#FF6A00',
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  socialIconsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  socialIconMargin: {
    marginHorizontal: 15,
  }
});

export default LoginScreen;