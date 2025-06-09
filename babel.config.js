module.exports = {
  presets: ['babel-preset-expo'], // Atau '@babel/preset-env', '@babel/preset-react-native', tergantung konfigurasi Anda
  plugins: [
    // Pastikan plugin ini ada, jika tidak, tambahkan
    '@babel/plugin-proposal-optional-chaining',
    // Jika Anda memiliki plugin lain, pertahankan di sini
    // Misalnya: 'react-native-reanimated/plugin', (jika Anda menggunakan Reanimated)
  ],
};