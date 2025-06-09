// src/components/DashboardContent.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const DashboardContent = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ringkasan Utama</Text>
      <Text style={styles.subtitle}>Selamat datang kembali di dashboard Anda!</Text>
      <Text style={styles.description}>
        Ini adalah tampilan ringkasan untuk kegiatan Anda. Di sini Anda bisa melihat statistik dan informasi penting secara cepat.
      </Text>
      {/* Tombol export dipindahkan ke DashboardScreen untuk halaman Data Report */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    marginTop: 20, // Sesuaikan ini agar tidak terlalu dekat dengan header
    minHeight: 300, // Minimal tinggi untuk tampilan yang lebih baik
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#777',
    textAlign: 'center',
    lineHeight: 24,
    // marginBottom: 30, // Hapus margin bawah jika tidak ada tombol di sini
  },
});

export default DashboardContent;