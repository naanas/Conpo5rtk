// MainHeader.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Platform } from 'react-native';

// Import gambar lokal dari path yang ditentukan
const appLogo = require('../../assets/PertaminaLogo.png'); // <<< Make sure this path is correct for your logo file!

// Menambahkan prop onLogout
const MainHeader = ({ subtitle, onLogout }) => {
  return (
    <View style={styles.mainHeaderContainer}>
      <View style={styles.mainHeaderContent}>
        <View style={styles.logoAndSubtitleWrapper}>
          <Image
            source={appLogo}
            style={styles.appLogo}
            resizeMode="contain"
          />
          <Text style={styles.mainHeaderSubtitle}>{subtitle}</Text>
        </View>
        {/* --- TOMBOL LOGOUT BARU DI SINI --- */}
        {onLogout && ( // Render hanya jika prop onLogout disediakan
          <TouchableOpacity style={styles.logoutButtonHeader} onPress={onLogout}>
            <Text style={styles.logoutButtonHeaderText}>Logout</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  mainHeaderContainer: {
    backgroundColor: '#014CC1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
    borderRadius: 0,
  },
  mainHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between', // Untuk menempatkan logo di kiri dan logout di kanan
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    paddingTop: Platform.OS === 'ios' ? 20 : 10,
    paddingBottom: 10,
  },
  logoAndSubtitleWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appLogo: {
    width: 120,
    height: 40,
    marginRight: 10,
  },
  mainHeaderSubtitle: {
    fontSize: 14,
    color: '#CCC',
  },
  // --- STYLE UNTUK TOMBOL LOGOUT DI HEADER ---
  logoutButtonHeader: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
    backgroundColor: '#fd0017', // Warna yang sama dengan tombol Logout sebelumnya
  },
  logoutButtonHeaderText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default MainHeader;