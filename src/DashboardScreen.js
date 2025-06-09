// src/DashboardScreen.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Dimensions,
  Platform,
  Animated, // Import Animated
  ScrollView,
  ActivityIndicator,
  Alert,
  Linking // Import Linking to open URLs if needed
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import MainHeader from './components/MainHeader';
import Sidebar from './components/Sidebar';
import Icon from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'; // For Excel icon
// Import the DashboardContent component
import DashboardContent from './components/DashboardContent';
// Import the custom DropdownPicker component
import DropdownPicker from './components/DropdownPicker';

const DashboardScreen = () => {
  const navigation = useNavigation();

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isDesktop, setIsDesktop] = useState(false);
  const [activeNavItem, setActiveNavItem] = useState('Dashboard'); // Default to Dashboard
  const animatedSidebarWidth = useRef(new Animated.Value(250)).current;

  // State to store token and loading status
  const [userToken, setUserToken] = useState(null);
  const [appReady, setAppReady] = useState(false); // New state to track app readiness

  const [reports, setReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(true);
  const [errorReports, setErrorReports] = useState(null);
  // New state for export status
  const [isExporting, setIsExporting] = useState(false); // Manages export button loading state

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // States for pagination limit dropdown
  const [selectedLimit, setSelectedLimit] = useState(10); // Default limit for items per page
  // Options for the pagination limit dropdown - NOW INCLUDES "Tampilkan Semua Data"
  const paginationLimitOptions = [
    { label: 'Tampilkan 10 item', value: 10 },
    { label: 'Tampilkan 20 item', value: 20 },
    { label: 'Tampilkan 30 item', value: 30 },
    { label: 'Tampilkan 40 item', value: 40 },
    { label: 'Tampilkan 50 item', value: 50 },
    { label: 'Tampilkan 100 item', value: 100 },
    { label: 'Tampilkan Semua Data', value: 'all' }, // New option to display all data
  ];

  // Animation states for content transition
  const contentFadeAnim = useRef(new Animated.Value(1)).current; // For opacity: 1 (visible) to 0 (hidden)
  const contentSlideAnim = useRef(new Animated.Value(0)).current; // For translateY: 0 (on screen) to +/- height (off screen)

  // State to hold the item currently *being displayed* (can lag behind activeNavItem during transition)
  const [displayActiveNavItem, setDisplayActiveNavItem] = useState('Dashboard');

  // Mapping for navigation item order to determine slide direction
  const navItemOrderMap = useRef({
    'Dashboard': 0,
    'Data Report': 1,
    // Add other nav items here if any
  }).current;

  const estimatedHeaderHeight = Platform.select({
    ios: 80,
    android: 70,
    default: 70,
  });

  const convertToJakartaTime = useCallback((utcTimestamp) => {
    if (!utcTimestamp) return 'N/A';
    try {
      const date = new Date(utcTimestamp);
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

  // Effect to load token from AsyncStorage when component first mounts (bootstrap)
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

  // Effect for content transition animation
  useEffect(() => {
    // Only animate if the activeNavItem has actually changed and app is ready
    if (appReady && activeNavItem !== displayActiveNavItem) {
      const currentOrder = navItemOrderMap[activeNavItem];
      const previousOrder = navItemOrderMap[displayActiveNavItem]; // Use currently displayed item's order to determine direction

      // Determine slide direction: 1 for down (new item is "below" previous), -1 for up (new item is "above")
      const direction = currentOrder > previousOrder ? 1 : -1;
      const screenHeight = Dimensions.get('window').height;

      // Phase 1: Animate current content out (slide out and fade out)
      Animated.parallel([
        Animated.timing(contentFadeAnim, {
          toValue: 0, // Fade out
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(contentSlideAnim, {
          toValue: direction * screenHeight * 0.2, // Slide a bit off-screen (e.g., 20% of screen height)
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Phase 2: After fade-out, update the content to be displayed
        setDisplayActiveNavItem(activeNavItem);

        // Instantly reset slide animation to the opposite side for the new content to slide in from
        contentSlideAnim.setValue(-direction * screenHeight * 0.2);

        // Phase 3: Animate new content in (slide in and fade in)
        Animated.parallel([
          Animated.timing(contentFadeAnim, {
            toValue: 1, // Fade in
            duration: 250,
            useNativeDriver: true,
          }),
          Animated.timing(contentSlideAnim, {
            toValue: 0, // Slide to original position
            duration: 250,
            useNativeDriver: true,
          }),
        ]).start();
      });
    } else if (appReady && activeNavItem === displayActiveNavItem && (contentFadeAnim._value !== 1 || contentSlideAnim._value !== 0)) {
      // On initial load or if user rapidly clicks the same item, ensure it's fully visible without re-animating
      contentFadeAnim.setValue(1);
      contentSlideAnim.setValue(0);
    }
  }, [activeNavItem, appReady, displayActiveNavItem, contentFadeAnim, contentSlideAnim, navItemOrderMap]);


  const fetchReports = useCallback(async (signal, pageToFetch = currentPage, limitToFetch = selectedLimit) => {
    if (!signal?.aborted) {
      // Only show full loading spinner for first page load or limit change (not for "load more" if it were still active)
      if (pageToFetch === 1 || limitToFetch !== selectedLimit) {
        setLoadingReports(true);
        setReports([]);
      }
      setErrorReports(null);
    }

    try {
      const category = 'cleanliness';
      const status = 'todo';

      // Determine the limit parameter for the API call
      let apiLimit = limitToFetch;
      if (limitToFetch === 'all') {
        apiLimit = 100000; // Use a very large number to fetch all data
      }

      // If 'all' data is requested, we reset pageToFetch to 1 regardless, as it's not truly paginated then
      const effectivePage = (limitToFetch === 'all') ? 1 : pageToFetch;

      const endpoint = `https://ptm-tracker-service.onrender.com/api/v1/report/list?page=${effectivePage}&limit=${apiLimit}&category=${category}&status=${status}`;

      console.log('Fetching reports from endpoint:', endpoint);

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
        console.log('Fetch aborted for page:', pageToFetch);
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

      console.log('API Response Data:', data);

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
          setTotalItems(0);
          console.warn("API response meta data not found.");
        }
      } else {
        if (effectivePage === 1) { // Also clear if no data on first page/all data fetch
          setReports([]);
        }
        setTotalPages(1);
        setTotalItems(0);
        console.warn("API response format unexpected: Expected data.data.listData", data);
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Fetch request was aborted intentionally.');
      } else {
        console.error("Error fetching reports:", error);
        setErrorReports(error.message);
        Alert.alert('Gagal Memuat Laporan', `Terjadi kesalahan saat memuat data: ${error.message}`);
      }
    } finally {
      if (!signal?.aborted) {
        setLoadingReports(false);
      }
    }
  }, [currentPage, navigation, userToken, selectedLimit]); // selectedLimit is a dependency here

  // Effect to trigger data fetching or navigation once app is ready or page/limit changes
  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    if (appReady) {
      if (userToken) {
        // Only fetch if the currently *displayed* navigation item is 'Data Report'
        // This ensures fetch is tied to the actual content being rendered after animation.
        if (displayActiveNavItem === 'Data Report') {
          fetchReports(signal, currentPage, selectedLimit);
        } else {
          setLoadingReports(false);
          setReports([]);
          setErrorReports(null);
        }
      } else {
        console.log('Aplikasi siap tapi tidak ada user token ditemukan, mengarahkan ke Login.');
        navigation.replace('Login');
        setLoadingReports(false);
        setErrorReports('Tidak ada sesi yang aktif. Silakan login.');
      }
    } else {
      setLoadingReports(true);
    }

    return () => {
      console.log('Aborting ongoing fetch for cleanup...');
      controller.abort();
    };
  }, [fetchReports, currentPage, appReady, userToken, navigation, displayActiveNavItem, selectedLimit]); // Use displayActiveNavItem here

  // Function to export all data from the frontend (CSV)
  const handleExportAllReports = useCallback(async () => {
    setIsExporting(true); // Activate button loading state
    try {
      if (!userToken) {
        Alert.alert('Autentikasi Diperlukan', 'Silakan login kembali untuk mengekspor data.');
        navigation.replace('Login');
        return;
      }

      // === Step 1: Fetch ALL data from the API ===
      const allReportsEndpoint = `https://ptm-tracker-service.onrender.com/api/v1/report/list?category=cleanliness&status=todo&limit=100000`;
      console.log('Fetching ALL reports for export from endpoint:', allReportsEndpoint);

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

      // === Step 2: Format Data into CSV ===
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

      // === Step 3: Use Linking to try and open the CSV ===
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
      console.error("Error saat ekspor laporan:", error);
      Alert.alert('Gagal Ekspor', `Terjadi kesalahan saat mengekspor data: ${error.message}`);
    } finally {
      setIsExporting(false);
    }
  }, [userToken, navigation, convertToJakartaTime]);

  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };

  const handleNavItemPress = (itemName) => {
    // Only change activeNavItem, the useEffect will handle the transition
    setActiveNavItem(itemName);
    if (!isDesktop) {
      setIsSidebarOpen(false);
    }
    console.log(`Navigating to: ${itemName}`);
    // Reset currentPage to 1 when navigating to 'Data Report' or changing limit
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

  // New function to handle limit selection from the DropdownPicker
  const handleLimitChange = (newLimit) => {
    setSelectedLimit(newLimit); // Update the selected limit
    setCurrentPage(1); // Reset to first page when limit changes, which triggers re-fetch
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

  const handleMoreOptions = (reportId) => {
    Alert.alert(
      "Opsi Laporan",
      `Anda memilih laporan dengan ID: ${reportId}\n\nFitur ini akan dikembangkan di masa mendatang.`,
      [
        { text: "OK", style: "cancel" }
      ]
    );
  };

  // Function to render main content based on the currently *displayed* navigation item
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

    // Render content based on `displayActiveNavItem` state
    if (displayActiveNavItem === 'Dashboard') {
        return <DashboardContent />;
    } else if (displayActiveNavItem === 'Data Report') {
        const tableHeaders = ['Nama Menu', 'Zona', 'Spot', 'Kategori', 'Direport oleh', 'Direport tanggal', 'Status', 'Aksi'];

        return (
            <View style={styles.dataReportPageContainer}>
                {/* Page Title */}
                <Text style={styles.dataReportTitle}>5R-TRACKER DATA REPORT</Text>

                {/* Container for pagination limit dropdown and export button */}
                <View style={styles.controlsContainer}>
                    {/* Pagination Limit Dropdown */}
                    <DropdownPicker
                        options={paginationLimitOptions}
                        selectedValue={selectedLimit}
                        onValueChange={handleLimitChange}
                        placeholder="Tampilkan item"
                        // Pass styles to customize the dropdown appearance
                        buttonStyle={styles.paginationDropdownButton}
                        buttonTextStyle={styles.paginationDropdownButtonText}
                        dropdownStyle={styles.paginationDropdownOptionsContainer}
                        optionStyle={styles.paginationDropdownOption}
                        optionTextStyle={styles.paginationDropdownOptionText}
                        maxDropdownHeight={200} // Example: specify max height
                    />

                    {/* Export Button */}
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

                {/* Report Table Logic */}
                {loadingReports && reports.length === 0 ? (
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
                                {/* Table Header */}
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

                                {/* Data Rows */}
                                {reports.map((report, rowIndex) => {
                                    const { initials, color } = getInitialsAndColor(report.createdBy);
                                    return (
                                        <TouchableOpacity
                                            key={report.id || `row-${rowIndex}`}
                                            style={styles.reportCardTouchable}
                                            onPress={() => handleMoreOptions(report.id)}
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
                                                            e.stopPropagation();
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
                        {/* Pagination Text - simplified as Load More button is replaced */}
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

  if (!appReady) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#0073fe" />
        <Text style={styles.messageText}>Memuat aplikasi...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <MainHeader subtitle="Selamat datang kembali di dashboard Anda!" onLogout={handleLogout} />

      <View style={styles.contentBelowHeader}>
        <Sidebar
          isSidebarOpen={isSidebarOpen}
          animatedSidebarWidth={animatedSidebarWidth}
          isDesktop={isDesktop}
          activeNavItem={activeNavItem} // Pass activeNavItem to sidebar
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

          {/* Wrap the content in an Animated.View for page transitions */}
          <Animated.View style={[
            {
              flex: 1, // Make sure it takes full height/width available
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
    paddingTop: 70, // Adjust this if your content is too close to the top
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
  // New style for Data Report page title
  dataReportTitle: {
    marginTop:-80,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 30, // Adjusted margin to make space for new controls
    textAlign: 'left',
  },
  // New style for the controls container (dropdown and export button)
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20, // Space between controls and table
    zIndex: 10, // Ensure controls (especially dropdown) are above other content
  },
  // Styles for the DropdownPicker's button
  paginationDropdownButton: {
    // You can customize the button appearance here
    minWidth: 180, // Example: make it wider
  },
  paginationDropdownButtonText: {
    // Customize text inside the button
  },
  // Styles for the DropdownPicker's options container (Animated.View)
  paginationDropdownOptionsContainer: {
    // Customize the dropdown menu container appearance
    // For example, to match the button's width precisely:
    // width: 'auto', // Remove explicit width if button handles it
    // borderColor: '#0073fe',
    // borderWidth: 1,
  },
  paginationDropdownOption: {
    // Customize each option item
    paddingVertical: 12,
    paddingHorizontal: 15,
    // Add a border to separate options visually, but not the last one
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  paginationDropdownOptionText: {
    // Customize text of each option
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
    marginTop: 0, // No extra margin as it's within a controlled container
    zIndex: 0, // Ensure table is below controls
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
  // Style for the export button on the Data Report page
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#28a745', // Green color for export button
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
    opacity: 0.7, // Slightly transparent when disabled
  }
});

export default DashboardScreen;