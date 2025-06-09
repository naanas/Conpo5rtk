import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Dimensions,
  Platform,
  Animated,
  ScrollView,
  ActivityIndicator,
  Alert,
  Linking,
  Modal // Import Modal here as well, though it's used in ReportDetailModal
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import MainHeader from '../src/components/MainHeader';
import Sidebar from '../src/components/Sidebar';
import Icon from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import DashboardContent from '../src/components/DashboardContent';
import DropdownPicker from '../src/components/DropdownPicker';
import ReportDetailModal from '../src/components/ReportDetailModals'; // Import the new modal component

const DashboardScreen = () => {
  const navigation = useNavigation();

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isDesktop, setIsDesktop] = useState(false);
  const [activeNavItem, setActiveNavItem] = useState('Dashboard');
  const animatedSidebarWidth = useRef(new Animated.Value(250)).current;

  const [userToken, setUserToken] = useState(null);
  const [appReady, setAppReady] = useState(false);

  // States for Data Report table - THESE WILL NOW FETCH DIRECTLY
  const [reports, setReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(true); // Still true initially for Data Report
  const [errorReports, setErrorReports] = useState(null);

  const [isExporting, setIsExporting] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [selectedLimit, setSelectedLimit] = useState(10);
  const paginationLimitOptions = [
    { label: 'Tampilkan 10 item', value: 10 },
    { label: 'Tampilkan 20 item', value: 20 },
    { label: 'Tampilkan 30 item', value: 30 },
    { label: 'Tampilkan 40 item', value: 40 },
    { label: 'Tampilkan 50 item', value: 50 },
    { label: 'Tampilkan 100 item', value: 100 },
    { label: 'Tampilkan Semua Data', value: 'all' },
  ];

  const contentFadeAnim = useRef(new Animated.Value(1)).current;
  const contentSlideAnim = useRef(new Animated.Value(0)).current;

  const [displayActiveNavItem, setDisplayActiveNavItem] = useState('Dashboard');

  const navItemOrderMap = useRef({
    'Dashboard': 0,
    'Data Report': 1,
  }).current;

  // New states for the Report Detail Modal
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedReportDetail, setSelectedReportDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [errorDetail, setErrorDetail] = useState(null);


  const estimatedHeaderHeight = Platform.select({
    ios: 80,
    android: 70,
    default: 70,
  });

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

  useEffect(() => {
    const onDimensionsChange = ({ window }) => {
      const newIsDesktop = window.width >= 768;
      setIsDesktop(newIsDesktop);
      if (newIsDesktop) {
        setIsSidebarOpen(true);
        Animated.timing(animatedSidebarWidth, {
          toValue: 250,
          duration: 300,
          useNativeDriver: false,
        }).start();
      } else {
        setIsSidebarOpen(false);
        Animated.timing(animatedSidebarWidth, {
          toValue: 0,
          duration: 300,
          useNativeDriver: false,
        }).start();
      }
    };

    onDimensionsChange({ window: Dimensions.get('window') });
    const subscription = Dimensions.addEventListener('change', onDimensionsChange);

    return () => {
      subscription.remove();
    };
  }, [animatedSidebarWidth]);

  useEffect(() => {
    if (!isDesktop) {
      Animated.timing(animatedSidebarWidth, {
        toValue: isSidebarOpen ? 250 : 0,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  }, [isSidebarOpen, isDesktop, animatedSidebarWidth]);

  useEffect(() => {
    let isMounted = true;
    const bootstrapAsync = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('userToken');
        if (isMounted) {
          setUserToken(storedToken);
        }
      } catch (e) {
        console.error("Gagal memuat token saat bootstrapping:", e);
        if (isMounted) {
          setUserToken(null);
        }
      } finally {
        if (isMounted) {
          setAppReady(true);
        }
      }
    };

    bootstrapAsync();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (appReady && activeNavItem !== displayActiveNavItem) {
      const currentOrder = navItemOrderMap[activeNavItem];
      const previousOrder = navItemOrderMap[displayActiveNavItem];

      const direction = currentOrder > previousOrder ? 1 : -1;
      const screenHeight = Dimensions.get('window').height;

      Animated.parallel([
        Animated.timing(contentFadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(contentSlideAnim, {
          toValue: direction * screenHeight * 0.3,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setDisplayActiveNavItem(activeNavItem);
        contentSlideAnim.setValue(-direction * screenHeight * 0.3);
        Animated.parallel([
          Animated.timing(contentFadeAnim, {
            toValue: 1,
            duration: 250,
            useNativeDriver: true,
          }),
          Animated.timing(contentSlideAnim, {
            toValue: 0,
            duration: 250,
            useNativeDriver: true,
          }),
        ]).start();
      });
    } else if (appReady && activeNavItem === displayActiveNavItem && (contentFadeAnim._value !== 1 || contentSlideAnim._value !== 0)) {
      contentFadeAnim.setValue(1);
      contentSlideAnim.setValue(0);
    }
  }, [activeNavItem, appReady, displayActiveNavItem, contentFadeAnim, contentSlideAnim, navItemOrderMap]);


  const fetchReports = useCallback(async (signal, pageToFetch = currentPage, limitToFetch = selectedLimit) => {
    if (!signal?.aborted) {
      if (pageToFetch === 1 || limitToFetch !== selectedLimit) {
        setLoadingReports(true);
        setReports([]); // Clear reports when changing page/limit or first load
      }
      setErrorReports(null);
    }

    try {
      const category = 'cleanliness';
      const status = 'todo';

      let apiLimit = limitToFetch;
      if (limitToFetch === 'all') {
        apiLimit = 100000; // Use a very large number to fetch all data for export or full table
      }

      const effectivePage = (limitToFetch === 'all') ? 1 : pageToFetch;

      const endpoint = `https://ptm-tracker-service.onrender.com/api/v1/report/list?page=${effectivePage}&limit=${apiLimit}&category=${category}&status=${status}`;

      console.log('[fetchReports] Fetching paginated reports from endpoint:', endpoint);

      const headers = {
        'Content-Type': 'application/json',
      };
      if (userToken) {
        headers['Authorization'] = `Bearer ${userToken}`;
      }

      const response = await fetch(endpoint, {
        method: 'GET',
        headers: headers,
        signal: signal,
      });

      if (signal?.aborted) {
        console.log('[fetchReports] Fetch aborted for page:', pageToFetch);
        return;
      }

      if (response.status === 401) {
        setErrorReports('Sesi habis atau tidak sah. Silakan login kembali.');
        await AsyncStorage.removeItem('userToken');
        navigation.replace('Login');
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`HTTP error! status: ${response.status} - ${errorData.message || response.statusText}`);
      }
      const data = await response.json();

      console.log('[fetchReports] API Response Data:', data);

      if (data && data.data && data.data.listData) {
        // When 'all' is selected, always replace previous reports
        setReports(prevReports =>
          (limitToFetch === 'all' || effectivePage === 1) ? data.data.listData : [...prevReports, ...data.data.listData]
        );

        if (data.data.meta) {
          setTotalPages(data.data.meta.totalPages || 1);
          setTotalItems(data.data.meta.total || 0);
        } else {
          setTotalPages(1);
          setTotalItems(data.data.listData.length); // If no meta, total items is just what we fetched
          console.warn("API response meta data not found.");
        }
      } else {
        if (effectivePage === 1) {
          setReports([]);
        }
        setTotalPages(1);
        setTotalItems(0);
        console.warn("API response format unexpected: Expected data.data.listData", data);
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('[fetchReports] Fetch request was aborted intentionally.');
      } else {
        console.error("[fetchReports] Error fetching reports:", error);
        Alert.alert('Gagal Memuat Laporan', `Terjadi kesalahan saat memuat data: ${error.message}`);
      }
    } finally {
      if (!signal?.aborted) {
        setLoadingReports(false);
      }
    }
  }, [currentPage, navigation, userToken, selectedLimit]);


  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    if (appReady) {
      if (userToken) {
        if (displayActiveNavItem === 'Data Report') {
          console.log('[Main useEffect] Triggering fetchReports for Data Report page.');
          fetchReports(signal, currentPage, selectedLimit);
        } else if (displayActiveNavItem === 'Dashboard') {
          console.log('[Main useEffect] Displaying Dashboard content.');
          setReports([]);
          setLoadingReports(false);
          setErrorReports(null);
        }
      } else {
        console.log('[Main useEffect] App ready but no user token found, redirecting to Login.');
        navigation.replace('Login');
        setReports([]);
        setLoadingReports(false);
        setErrorReports('Tidak ada sesi yang aktif. Silakan login.');
      }
    } else {
      console.log('[Main useEffect] App not ready, showing loading screen.');
      setLoadingReports(true);
    }

    return () => {
      console.log('[Main useEffect cleanup] Aborting ongoing fetch for cleanup...');
      controller.abort();
    };
  }, [fetchReports, currentPage, appReady, userToken, navigation, displayActiveNavItem, selectedLimit]);


  const handleExportAllReports = useCallback(async () => {
    setIsExporting(true);
    try {
      if (!userToken) {
        Alert.alert('Autentikasi Diperlukan', 'Silakan login kembali untuk mengekspor data.');
        navigation.replace('Login');
        return;
      }

      const allReportsEndpoint = `https://ptm-tracker-service.onrender.com/api/v1/report/list?category=cleanliness&status=todo&limit=100000`;
      console.log('[handleExportAllReports] Fetching ALL reports for export from endpoint:', allReportsEndpoint);

      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`,
      };

      const response = await fetch(allReportsEndpoint, {
        method: 'GET',
        headers: headers,
      });

      if (response.status === 401) {
        Alert.alert('Sesi Berakhir', 'Sesi Anda telah habis saat mencoba ekspor. Silakan login kembali.');
        await AsyncStorage.removeItem('userToken');
        navigation.replace('Login');
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Gagal mengambil semua data laporan untuk ekspor: ${errorData.message || response.statusText}`);
      }
      const allReportsData = await response.json();
      const fullReportList = allReportsData?.data?.listData || [];

      if (fullReportList.length === 0) {
        Alert.alert('Tidak Ada Data', 'Tidak ada data laporan yang tersedia untuk diekspor.');
        return;
      }

      const csvHeaders = ['Nama Menu', 'Zona', 'Spot', 'Kategori', 'Direport oleh', 'Direport tanggal', 'Status'];

      const escapeCsvValue = (value) => {
        if (value === null || value === undefined) return '';
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n') || stringValue.includes('\r')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      };

      const csvRows = fullReportList.map(report => {
        const reportedDate = convertToJakartaTime(report.createdAt);

        return [
          escapeCsvValue(report.menuName),
          escapeCsvValue(report.zoneName),
          escapeCsvValue(report.spot),
          escapeCsvValue(report.category),
          escapeCsvValue(report.createdBy),
          escapeCsvValue(reportedDate),
          escapeCsvValue(report.status)
        ].join(',');
      });

      const csvString = [
        csvHeaders.join(','),
        ...csvRows
      ].join('\n');

      const encodedCsv = encodeURIComponent(csvString);
      const dataUri = `data:text/csv;charset=utf-8,${encodedCsv}`;

      const supported = await Linking.canOpenURL(dataUri);
      if (supported) {
        await Linking.openURL(dataUri);
        Alert.alert('Ekspor Berhasil', 'File CSV berhasil dibuat. Coba buka dengan aplikasi spreadsheet (misal Excel) untuk melihat kolom terpisah.');
      } else {
        Alert.alert(
          'Gagal Membuka File Otomatis',
          'Perangkat Anda mungkin tidak mendukung pembukaan CSV langsung dari aplikasi. Anda bisa coba salin data CSV dan mempastekannya ke spreadsheet.',
          [{ text: 'OK' }]
        );
      }

    } catch (error) {
      console.error("[handleExportAllReports] Error saat ekspor laporan:", error);
      Alert.alert('Gagal Ekspor', `Terjadi kesalahan saat mengekspor data: ${error.message}`);
    } finally {
      setIsExporting(false);
    }
  }, [userToken, navigation, convertToJakartaTime]);

  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };

  const handleNavItemPress = (itemName) => {
    setActiveNavItem(itemName);
    if (!isDesktop) {
      setIsSidebarOpen(false);
    }
    console.log(`Navigating to: ${itemName}`);
    if (itemName === 'Data Report') {
      setCurrentPage(1);
    }
  };

  const handleLogout = async () => {
    console.log('User logging out...');
    try {
      await AsyncStorage.removeItem('userToken');
      console.log('Token removed from storage.');
      navigation.replace('Login');
    } catch (e) {
      console.error('Failed to remove token from storage', e);
      Alert.alert('Logout Gagal', 'Tidak dapat menghapus sesi. Silakan coba lagi.');
    }
  };

  const handleLimitChange = (newLimit) => {
    setSelectedLimit(newLimit);
    setCurrentPage(1);
  };

  const getInitialsAndColor = (name) => {
    if (!name) return { initials: '?', color: '#ccc' };
    const words = name.split(' ');
    let initials = '';
    if (words.length > 1) {
      initials = words[0][0] + words[words.length - 1][0];
    } else if (words[0]) {
      initials = words[0][0];
    } else {
      initials = '?';
    }
    initials = initials.toUpperCase();

    const colors = [
      '#6200EE', '#03DAC6', '#FF4081', '#3F51B5', '#E91E63',
      '#00BCD4', '#8BC34A', '#FFC107', '#FF9800', '#F4436A',
      '#9C27B0', '#009688', '#CDDC39', '#FFEB3B', '#FF5722'
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colorIndex = Math.abs(hash) % colors.length;
    return { initials, color: colors[colorIndex] };
  };

  const getStatusDotColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'todo':
        return '#FFA500';
      case 'on-progress':
        return '#0073fe';
      case 'done':
        return '#28a745';
      case 'cancelled':
        return '#DC3545';
      default:
        return '#6C757D';
    }
  };

  // Modified fetchReportDetails to return data or throw error
  const fetchReportDetails = useCallback(async (reportId) => {
    if (!userToken) {
      // Return null or throw error if no token, caller will handle redirection
      return null;
    }

    try {
      const endpoint = `https://ptm-tracker-service.onrender.com/api/v1/report/${reportId}`;
      console.log(`[fetchReportDetails] Fetching details for report ID: ${reportId} from ${endpoint}`);

      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`,
      };

      const response = await fetch(endpoint, {
        method: 'GET',
        headers: headers,
      });

      if (response.status === 401) {
        await AsyncStorage.removeItem('userToken');
        navigation.replace('Login');
        throw new Error('Sesi Anda telah habis. Silakan login kembali.');
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Gagal mengambil detail laporan: ${errorData.message || response.statusText}`);
      }

      const data = await response.json();
      console.log('[fetchReportDetails] API Response Data:', data);

      if (data && data.data) {
        return data.data; // Return the report data object
      } else {
        throw new Error('Data detail laporan tidak ditemukan atau format tidak sesuai.');
      }

    } catch (error) {
      console.error("[fetchReportDetails] Error fetching report details:", error);
      throw error; // Re-throw to be caught by handleMoreOptions
    }
  }, [userToken, navigation]);


  // Modified handleMoreOptions to show modal
  const handleMoreOptions = useCallback(async (reportId) => {
    console.log(`[handleMoreOptions] Tombol titik tiga diklik untuk laporan ID: ${reportId}`);

    // Set loading state and reset previous detail/error
    setLoadingDetail(true);
    setSelectedReportDetail(null);
    setErrorDetail(null);
    setShowDetailModal(true); // Show modal immediately with loading state

    try {
      const reportData = await fetchReportDetails(reportId);
      if (reportData) {
        setSelectedReportDetail(reportData);
      } else {
        setErrorDetail('Gagal memuat detail laporan: Data tidak ditemukan.');
      }
    } catch (error) {
      console.error("[handleMoreOptions] Error when fetching report details for modal:", error);
      setErrorDetail(`Gagal memuat detail laporan: ${error.message}`);
    } finally {
      setLoadingDetail(false);
    }
  }, [fetchReportDetails]); // Add fetchReportDetails as a dependency

  const renderMainContentBasedOnDisplay = () => {
    if (!appReady) {
        return (
            <View style={styles.loadingScreen}>
                <ActivityIndicator size="large" color="#0073fe" />
                <Text style={styles.messageText}>Memuat aplikasi...</Text>
            </View>
        );
    }

    if (!userToken) {
        return (
            <View style={styles.centeredMessage}>
                <Text style={styles.messageText}>Anda perlu login untuk melihat konten ini.</Text>
            </View>
        );
    }

    if (displayActiveNavItem === 'Dashboard') {
        return (
          <DashboardContent
            userToken={userToken}
            navigation={navigation}
          />
        );
    } else if (displayActiveNavItem === 'Data Report') {
        const tableHeaders = ['Nama Menu', 'Zona', 'Spot', 'Kategori', 'Direport oleh', 'Direport tanggal', 'Status', 'Aksi'];

        return (
            <View style={styles.dataReportPageContainer}>
                <Text style={styles.dataReportTitle}>5R-TRACKER DATA REPORT</Text>

                <View style={styles.controlsContainer}>
                    <DropdownPicker
                        options={paginationLimitOptions}
                        selectedValue={selectedLimit}
                        onValueChange={handleLimitChange}
                        placeholder="Tampilkan item"
                        buttonStyle={styles.paginationDropdownButton}
                        buttonTextStyle={styles.paginationDropdownButtonText}
                        dropdownStyle={styles.paginationDropdownOptionsContainer}
                        optionStyle={styles.paginationDropdownOption}
                        optionTextStyle={styles.paginationDropdownOptionText}
                        maxDropdownHeight={200}
                    />

                    <TouchableOpacity
                        style={[styles.exportButton, isExporting && styles.exportButtonDisabled]}
                        onPress={handleExportAllReports}
                        disabled={isExporting}
                    >
                        {isExporting ? (
                            <ActivityIndicator size="small" color="#FFF" />
                        ) : (
                            <>
                                <MaterialCommunityIcons name="microsoft-excel" size={24} color="#FFF" style={styles.exportButtonIcon} />
                                <Text style={styles.exportButtonText}>Export Semua Data</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>

                {loadingReports ? (
                    <View style={styles.centeredMessage}>
                        <ActivityIndicator size="large" color="#0073fe" />
                        <Text style={styles.messageText}>Memuat data laporan...</Text>
                    </View>
                ) : errorReports ? (
                    <View style={styles.centeredMessage}>
                        <Text style={styles.errorText}>Error: {errorReports}</Text>
                        <Text style={styles.messageText}>Gagal memuat data laporan. Silakan coba lagi.</Text>
                    </View>
                ) : reports.length === 0 && !loadingReports ? (
                    <View style={styles.centeredMessage}>
                        <Text style={styles.messageText}>Tidak ada data laporan yang tersedia.</Text>
                    </View>
                ) : (
                    <View style={styles.tableContainerWrapper}>
                        <ScrollView horizontal={true} showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScrollContent}>
                            <View style={styles.tableContainer}>
                                <View style={styles.tableHeaderRow}>
                                    <View style={[styles.tableHeaderCellContainer, styles.columnMenuName]}><Text style={styles.tableHeaderCell}>{tableHeaders[0]}</Text></View>
                                    <View style={[styles.tableHeaderCellContainer, styles.columnZoneName]}><Text style={styles.tableHeaderCell}>{tableHeaders[1]}</Text></View>
                                    <View style={[styles.tableHeaderCellContainer, styles.columnSpot]}><Text style={styles.tableHeaderCell}>{tableHeaders[2]}</Text></View>
                                    <View style={[styles.tableHeaderCellContainer, styles.columnCategory]}><Text style={styles.tableHeaderCell}>{tableHeaders[3]}</Text></View>
                                    <View style={[styles.tableHeaderCellContainer, styles.columnReportedBy]}><Text style={styles.tableHeaderCell}>{tableHeaders[4]}</Text></View>
                                    <View style={[styles.tableHeaderCellContainer, styles.columnReportedDate]}><Text style={styles.tableHeaderCell}>{tableHeaders[5]}</Text></View>
                                    <View style={[styles.tableHeaderCellContainer, styles.columnStatus]}><Text style={styles.tableHeaderCell}>{tableHeaders[6]}</Text></View>
                                    <View style={[styles.tableHeaderCellContainer, styles.columnAction]}><Text style={styles.tableHeaderCell}>{tableHeaders[7]}</Text></View>
                                </View>

                                {reports.map((report, rowIndex) => {
                                    const { initials, color } = getInitialsAndColor(report.createdBy);
                                    return (
                                        <TouchableOpacity
                                            key={report.id || `row-${rowIndex}`}
                                            style={styles.reportCardTouchable}
                                            // onPress={() => handleMoreOptions(report.id)} // Menghapus onPress dari row keseluruhan
                                        >
                                            <View style={styles.reportCardInnerContent}>
                                                <View style={[styles.tableCellContainer, styles.columnMenuName]}>
                                                    <Text style={styles.tableCellText}>{report.menuName || 'N/A'}</Text>
                                                </View>

                                                <View style={[styles.tableCellContainer, styles.columnZoneName]}>
                                                    <Text style={styles.tableCellText}>{report.zoneName || 'N/A'}</Text>
                                                </View>

                                                <View style={[styles.tableCellContainer, styles.columnSpot]}>
                                                    <Text style={styles.tableCellText}>{report.spot || 'N/A'}</Text>
                                                </View>

                                                <View style={[styles.tableCellContainer, styles.columnCategory]}>
                                                    <Text style={styles.tableCellText}>{report.category || 'N/A'}</Text>
                                                </View>

                                                <View style={[styles.tableCellContainer, styles.columnReportedBy]}>
                                                    <View style={[styles.initialsAvatar, { backgroundColor: color }]}>
                                                        <Text style={styles.initialsText}>{initials}</Text>
                                                    </View>
                                                    <Text style={styles.tableCellText}>{report.createdBy || 'N/A'}</Text>
                                                </View>

                                                <View style={[styles.tableCellContainer, styles.columnReportedDate]}>
                                                    <Text style={styles.tableCellText}>{convertToJakartaTime(report.createdAt)}</Text>
                                                </View>

                                                <View style={[styles.tableCellContainer, styles.columnStatus]}>
                                                    <View style={[styles.statusDot, { backgroundColor: getStatusDotColor(report.status) }]} /><Text style={styles.tableCellText}>{report.status || 'N/A'}</Text>
                                                </View>

                                                <View style={[styles.tableCellContainer, styles.columnAction]}>
                                                    <TouchableOpacity
                                                        onPress={(e) => {
                                                            e.stopPropagation(); // Mencegah event sentuh menyebar ke parent jika ada
                                                            handleMoreOptions(report.id);
                                                        }}
                                                        style={styles.actionButton}
                                                    >
                                                        <MaterialCommunityIcons name="dots-vertical" size={24} color="#666" />
                                                    </TouchableOpacity>
                                                </View>
                                            </View>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </ScrollView>
                        {reports.length > 0 && (
                            <Text style={[styles.paginationText, { paddingHorizontal: 20, marginTop: 10 }]}>
                                Menampilkan {reports.length} dari {totalItems} laporan.
                            </Text>
                        )}
                    </View>
                )}
            </View>
        );
    }
    return null;
  };

  return (
    <SafeAreaView style={styles.container}>
      <MainHeader subtitle="Selamat datang kembali di dashboard Anda!" onLogout={handleLogout} />

      <View style={styles.contentBelowHeader}>
        <Sidebar
          isSidebarOpen={isSidebarOpen}
          animatedSidebarWidth={animatedSidebarWidth}
          isDesktop={isDesktop}
          activeNavItem={activeNavItem}
          onNavItemPress={handleNavItemPress}
        />

        {!isDesktop && isSidebarOpen && (
          <TouchableOpacity
            style={styles.overlay}
            onPress={toggleSidebar}
            activeOpacity={1}
          />
        )}

        <View style={[styles.mainContentWrapper, {
          marginLeft: isDesktop ? animatedSidebarWidth : 0,
        }]}>
          {!isDesktop && (
            <TouchableOpacity
              onPress={toggleSidebar}
              style={[styles.hamburgerButton, { top: 15 }]}
            >
              <Icon name="menu" size={28} color="#0073fe" />
            </TouchableOpacity>
          )}

          <Animated.View style={[
            {
              flex: 1,
              opacity: contentFadeAnim,
              transform: [{ translateY: contentSlideAnim }],
            }
          ]}>
            <ScrollView
              contentContainerStyle={styles.dashboardContentScrollView}
              showsVerticalScrollIndicator={false}
            >
              {renderMainContentBasedOnDisplay()}
            </ScrollView>
          </Animated.View>
        </View>
      </View>

      {/* Report Detail Modal */}
      <ReportDetailModal
        isVisible={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        reportData={selectedReportDetail}
        isLoading={loadingDetail}
        error={errorDetail}
        convertToJakartaTime={convertToJakartaTime}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    flexDirection: 'column',
  },
  contentBelowHeader: {
    flex: 1,
    flexDirection: 'row',
  },
  mainContentWrapper: {
    flex: 1,
    padding:20,
    backgroundColor: '#f0f0f0',
  },
  dashboardContentScrollView: {
    paddingTop: 70,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  hamburgerButton: {
    position: 'absolute',
    top: 15,
    left: 20,
    zIndex: 11,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 9,
  },
  dataReportPageContainer: {
    width: '100%',
    marginTop: 20,
  },
  dataReportTitle: {
    marginTop:-80,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 30,
    textAlign: 'left',
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    zIndex: 10,
  },
  paginationDropdownButton: {
    minWidth: 180,
  },
  paginationDropdownButtonText: {
  },
  paginationDropdownOptionsContainer: {
  },
  paginationDropdownOption: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  paginationDropdownOptionText: {
  },
  tableContainerWrapper: {
    width: '100%',
    backgroundColor: '#FFF',
    padding:20,
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    marginTop: 0,
    zIndex: 0,
  },
  horizontalScrollContent: {
  },
  tableContainer: {
    width: '100%',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    paddingVertical: 15,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    overflow: 'hidden',
    width: '100%',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  tableHeaderCellContainer: {
    paddingHorizontal: 75,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  tableHeaderCell: {
    fontWeight: 'normal',
    color: '#666',
    fontSize: 13,
  },
  reportCardTouchable: {
    backgroundColor: '#FFF',
    overflow: 'hidden',
  },
  reportCardInnerContent: {
    flexDirection: 'row',
    paddingVertical: 10,
    alignItems: 'center',
    width: '100%',
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  tableCellContainer: {
    paddingHorizontal: 30,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  tableCellText: {
    color: '#555',
    fontSize: 13,
  },
  initialsAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  initialsText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 5,
  },
  columnMenuName: { flex: 20, alignItems: 'flex-start' },
  columnZoneName: { flex: 20, alignItems: 'flex-start' },
  columnSpot: { flex: 20, alignItems: 'center' },
  columnCategory: { flex: 20, alignItems: 'flex-start' },
  columnReportedBy: { flex: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start' },
  columnReportedDate: { flex: 20, alignItems: 'flex-start' },
  columnStatus: { flex: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  columnAction: { flex: 20, alignItems: 'center' },

  actionButton: {
    padding: 5,
  },
  centeredMessage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    minHeight: 150,
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
  paginationText: {
    fontSize: 14,
    color: '#333',
    marginTop: 5,
    marginBottom: 20,
  },
  loadingScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#28a745',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  exportButtonIcon: {
    marginRight: 8,
  },
  exportButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  exportButtonDisabled: {
    opacity: 0.7,
  }
});

export default DashboardScreen;