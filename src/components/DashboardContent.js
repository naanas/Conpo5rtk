import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, ActivityIndicator, Alert, Animated } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DashboardContent = ({ userToken, navigation }) => {
  const screenWidth = Dimensions.get('window').width;

  const [dailyReportChartData, setDailyReportChartData] = useState(null);
  const [loadingChartData, setLoadingChartData] = useState(true);
  const [errorChartData, setErrorChartData] = useState(null);

  const chartFadeAnim = useRef(new Animated.Value(0)).current;
  const chartSlideAnim = useRef(new Animated.Value(20)).current;

  const convertToJakartaTime = useCallback((utcTimestamp, format = 'full') => {
    if (!utcTimestamp) return 'N/A';
    try {
      const date = new Date(utcTimestamp);
      if (format === 'dateOnly') {
        return new Intl.DateTimeFormat('id-ID', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          timeZone: 'Asia/Jakarta',
        }).format(date);
      }
      return new Intl.DateTimeFormat('id-ID', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZone: 'Asia/Jakarta',
        hour12: false
      }).format(date);
    } catch (e) {
      console.error("Error converting date:", e);
      return utcTimestamp;
    }
  }, []);

  const fetchDashboardData = useCallback(async (signal) => {
    console.log('--- [DashboardContent] Starting data fetch for chart...');
    setLoadingChartData(true);
    setErrorChartData(null);
    setDailyReportChartData(null);

    chartFadeAnim.setValue(0);
    chartSlideAnim.setValue(20);

    try {
      if (!userToken) {
        console.warn('[DashboardContent] No user token found, cannot fetch chart data. Redirecting to Login.');
        setErrorChartData('Tidak ada sesi yang aktif. Silakan login.');
        setLoadingChartData(false);
        if (navigation) {
          await AsyncStorage.removeItem('userToken');
          navigation.replace('Login');
        }
        return;
      }

      const category = 'cleanliness';
      const status = 'todo';
      const endpoint = `https://ptm-tracker-service.onrender.com/api/v1/report/list?limit=100000&category=${category}&status=${status}`;

      console.log('[DashboardContent] API Endpoint for chart:', endpoint);

      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`,
      };

      const response = await fetch(endpoint, {
        method: 'GET',
        headers: headers,
        signal: signal,
      });

      if (signal?.aborted) {
        console.log('[DashboardContent] Chart fetch aborted.');
        return;
      }

      if (response.status === 401) {
        console.error('[DashboardContent] 401 Unauthorized. Session expired. Redirecting to Login.');
        setErrorChartData('Sesi habis atau tidak sah. Silakan login kembali.');
        if (navigation) {
          await AsyncStorage.removeItem('userToken');
          navigation.replace('Login');
        }
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        console.error(`[DashboardContent] HTTP Error: ${response.status} - ${errorData.message || response.statusText}`);
        throw new Error(`HTTP error! status: ${response.status} - ${errorData.message || response.statusText}`);
      }
      const data = await response.json();

      const fullReportList = data?.data?.listData || [];
      console.log(`[DashboardContent] Fetched ${fullReportList.length} reports for chart.`);

      const dailyCounts = {};
      fullReportList.forEach(report => {
        if (report.createdAt) {
          const dateKey = convertToJakartaTime(report.createdAt, 'dateOnly');
          dailyCounts[dateKey] = (dailyCounts[dateKey] || 0) + 1;
        }
      });
      console.log('[DashboardContent] Daily Counts:', JSON.stringify(dailyCounts));

      const chartLabels = [];
      const chartValues = [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const dateKeyForChart = convertToJakartaTime(d.toISOString(), 'dateOnly');
        const label = new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: '2-digit', timeZone: 'Asia/Jakarta' }).format(d);
        chartLabels.push(label);
        chartValues.push(dailyCounts[dateKeyForChart] || 0);
      }

      console.log('[DashboardContent] Final chartLabels:', chartLabels);
      console.log('[DashboardContent] Final chartValues:', chartValues);

      setDailyReportChartData({
        labels: chartLabels,
        datasets: [
          {
            data: chartValues,
            color: (opacity = 1) => `rgba(0, 115, 254, ${opacity})`,
            strokeWidth: 2
          }
        ],
        legend: ['Jumlah Laporan Harian']
      });

      Animated.parallel([
        Animated.timing(chartFadeAnim, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(chartSlideAnim, {
          toValue: 0,
          duration: 700,
          useNativeDriver: true,
        }),
      ]).start();

    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('[DashboardContent] Chart fetch request was aborted intentionally.');
      } else {
        console.error("[DashboardContent] Error fetching chart reports:", error);
        setErrorChartData(error.message);
        Alert.alert('Gagal Memuat Grafik', `Terjadi kesalahan saat memuat data grafik: ${error.message}`);
        chartFadeAnim.setValue(0);
        chartSlideAnim.setValue(20);
      }
    } finally {
      if (!signal?.aborted) {
        setLoadingChartData(false);
        console.log('--- [DashboardContent] Chart data fetch finished.');
      }
    }
  }, [userToken, navigation, convertToJakartaTime, chartFadeAnim, chartSlideAnim]);

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    if (userToken) {
      fetchDashboardData(signal);
    } else {
      setLoadingChartData(false);
      setDailyReportChartData(null);
      setErrorChartData('Tidak ada token pengguna. Tidak dapat memuat grafik.');
      chartFadeAnim.setValue(0);
      chartSlideAnim.setValue(20);
    }

    return () => {
      console.log('[DashboardContent cleanup] Aborting ongoing chart fetch...');
      controller.abort();
    };
  }, [userToken, fetchDashboardData, chartFadeAnim, chartSlideAnim]);

  // --- UPDATED CHART CONFIG ---
  const chartConfig = {
    backgroundColor: '#ffffff', // Solid white background
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(0, 115, 254, ${opacity})`, // Main line color (strong blue)
    labelColor: (opacity = 1) => `rgba(85, 85, 85, ${opacity})`, // Darker grey for labels (#555555)
    strokeWidth: 3, // Thicker line for emphasis
    propsForDots: {
      r: '5', // Slightly smaller dots
      strokeWidth: '1', // Thinner stroke for dots
      stroke: '#0073fe', // Blue stroke for dots
      fill: '#0073fe' // Solid blue fill for dots
    },
    propsForBackgroundLines: {
      strokeDasharray: '', // Solid background lines
      stroke: '#dcdcdc', // Slightly darker grey for grid lines
    },
    fillShadowGradientFrom: '#0073fe', // Start of the fill gradient (strong blue)
    fillShadowGradientTo: 'rgba(0, 115, 254, 0.1)', // End of the fill gradient (very transparent blue)
  };
  // ----------------------------

  return (
    <View style={styles.container}>
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Jumlah Laporan Harian (7 Hari Terakhir)</Text>
        {loadingChartData ? (
          <View style={styles.chartLoading}>
            <ActivityIndicator size="large" color="#0073fe" />
            <Text style={styles.messageText}>Memuat data grafik...</Text>
          </View>
        ) : errorChartData ? (
          <View style={styles.chartError}>
            <Text style={styles.errorText}>Error: {errorChartData}</Text>
            <Text style={styles.messageText}>Gagal memuat data grafik. Silakan coba lagi.</Text>
          </View>
        ) : dailyReportChartData && dailyReportChartData.labels.length > 0 ? (
          <Animated.View style={{ opacity: chartFadeAnim, transform: [{ translateY: chartSlideAnim }] }}>
            <LineChart
              data={dailyReportChartData}
              width={screenWidth - 300} // Further adjusted width for more margin
              height={240}
              chartConfig={chartConfig}
              bezier
              style={styles.chartStyle}
            />
          </Animated.View>
        ) : (
          <View style={styles.chartNoData}>
            <Text style={styles.messageText}>Tidak ada data laporan untuk ditampilkan dalam grafik.</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    marginTop: 20,
    minHeight: 300,
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
    marginBottom: 30,
  },

  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#444',
    marginBottom: 15,
    textAlign: 'center',
  },
  chartStyle: {
    marginVertical: 8,
    borderRadius: 16,
    alignSelf: 'center', // Ensures it's centered, distributing the width difference as margin
  },
  chartLoading: {
    justifyContent: 'center',
    alignItems: 'center',
    height: 200,
  },
  chartError: {
    justifyContent: 'center',
    alignItems: 'center',
    height: 200,
    paddingHorizontal: 20,
  },
  chartNoData: {
    justifyContent: 'center',
    alignItems: 'center',
    height: 200,
    paddingHorizontal: 20,
  },
  messageText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 18,
    color: 'red',
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
});

export default DashboardContent;