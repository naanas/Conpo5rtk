import React, { useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, Pressable, ActivityIndicator, ScrollView, Image } from 'react-native'; // Mengganti TouchableOpacity dengan Pressable
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

// --- PENTING: VERIFIKASI DAN GANTI INI DENGAN URL API ANDA YANG SEBENARNYA ---
// Berdasarkan log Anda, URL API yang benar kemungkinan besar adalah:
const API_URL_DASHBOARDADM_LIST = 'https://gtm-tracker-service.onrender.com/api/v1';

const ReportDetailModal = ({
  isVisible,
  onClose,
  reportData,
  isLoading,
  error,
  convertToJakartaTime
}) => {
  // State untuk menyimpan signed URL dan status loading/error untuk setiap gambar
  const [signedImageUrl, setSignedImageUrl] = useState(null);
  const [loadingSignedImageUrl, setLoadingSignedImageUrl] = useState(false);
  const [errorSignedImageUrl, setErrorSignedImageUrl] = useState(null);

  const [signedPhotoBeforeUrl, setSignedPhotoBeforeUrl] = useState(null);
  const [loadingSignedPhotoBeforeUrl, setLoadingSignedPhotoBeforeUrl] = useState(false);
  const [errorSignedPhotoBeforeUrl, setErrorSignedPhotoBeforeUrl] = useState(null);

  const [signedPhotoInProgressUrl, setSignedPhotoInProgressUrl] = useState(null);
  const [loadingSignedPhotoInProgressUrl, setLoadingSignedPhotoInProgressUrl] = useState(false);
  const [errorSignedPhotoInProgressUrl, setErrorSignedPhotoInProgressUrl] = useState(null);

  const [signedPhotoAfterUrl, setSignedPhotoAfterUrl] = useState(null);
  const [loadingSignedPhotoAfterUrl, setLoadingSignedPhotoAfterUrl] = useState(false);
  const [errorSignedPhotoAfterUrl, setErrorSignedPhotoAfterUrl] = useState(null);

  // Fungsi helper untuk mengambil signed URL dari API
  const fetchAndSetSignedUrl = async (imageKey, setUrlState, setLoadingState, setErrorState, fieldName) => {
    if (!imageKey) {
      setUrlState(null);
      setLoadingState(false);
      setErrorState(null);
      console.log(`[ReportDetailModal] Tidak ada kunci gambar untuk ${fieldName}. Melewatkan pengambilan.`);
      return;
    }

    setLoadingState(true);
    setErrorState(null); // Reset error state sebelum pengambilan baru
    const fullUrl = `${API_URL_DASHBOARDADM_LIST}/image/signed-url?key=${imageKey}`;
    console.log(`[ReportDetailModal] Mengambil signed URL untuk ${fieldName}: ${fullUrl}`);

    try {
      const response = await fetch(fullUrl);
      if (!response.ok) {
        let errorBody = await response.text();
        try {
          const jsonError = JSON.parse(errorBody);
          errorBody = jsonError.message || JSON.stringify(jsonError);
        } catch (e) {
          // not json
        }
        
        const errorMessage = `Gagal mengambil signed URL untuk ${fieldName} (key: ${imageKey}): Status ${response.status} ${response.statusText}. Pesan: ${errorBody || 'Tidak ada pesan error dari server.'}`;
        throw new Error(errorMessage);
      }
      const data = await response.json();
      if (data && data.signedUrl) {
        setUrlState(data.signedUrl);
        console.log(`[ReportDetailModal] Berhasil mengambil signed URL untuk ${fieldName}.`);
      } else {
        throw new Error(`Signed URL tidak ditemukan dalam respons API untuk ${fieldName} (key: ${imageKey}). Respons: ${JSON.stringify(data)}`);
      }
    } catch (err) {
      console.error(`[ReportDetailModal] Error fetching signed URL untuk ${fieldName} (key: ${imageKey}):`, err);
      if (err.message.includes('Failed to fetch') && !err.message.includes('Status')) {
        setErrorState(`Gagal terhubung ke server atau masalah CORS. Pastikan API_URL_DASHBOARDADM_LIST benar dan server mengizinkan CORS dari ${window.location.origin}.`);
      } else {
        setErrorState(err.message);
      }
      setUrlState(null);
    } finally {
      setLoadingState(false);
    }
  };

  useEffect(() => {
    if (isVisible && reportData) {
      setSignedImageUrl(null);
      setLoadingSignedImageUrl(false);
      setErrorSignedImageUrl(null);
      setSignedPhotoBeforeUrl(null);
      setLoadingSignedPhotoBeforeUrl(false);
      setErrorSignedPhotoBeforeUrl(null);
      setSignedPhotoInProgressUrl(null);
      setLoadingSignedPhotoInProgressUrl(false);
      setErrorSignedPhotoInProgressUrl(null);
      setSignedPhotoAfterUrl(null);
      setLoadingSignedPhotoAfterUrl(false);
      setErrorSignedPhotoAfterUrl(null);

      if (reportData.imageUrl) {
        fetchAndSetSignedUrl(reportData.imageUrl, setSignedImageUrl, setLoadingSignedImageUrl, setErrorSignedImageUrl, 'Foto Utama');
      }
      if (reportData.photoBefore && reportData.photoBefore.length > 0) {
        fetchAndSetSignedUrl(reportData.photoBefore[0], setSignedPhotoBeforeUrl, setLoadingSignedPhotoBeforeUrl, setErrorSignedPhotoBeforeUrl, 'Foto Sebelum');
      }
      if (reportData.photoInProgress && reportData.photoInProgress.length > 0) {
        fetchAndSetSignedUrl(reportData.photoInProgress[0], setSignedPhotoInProgressUrl, setLoadingSignedPhotoInProgressUrl, setErrorSignedPhotoInProgressUrl, 'Foto Dalam Proses');
      }
      if (reportData.photoAfter && reportData.photoAfter.length > 0) {
        fetchAndSetSignedUrl(reportData.photoAfter[0], setSignedPhotoAfterUrl, setLoadingSignedPhotoAfterUrl, setErrorSignedPhotoAfterUrl, 'Foto Sesudah');
      }
    }
  }, [isVisible, reportData]);

  if (!isVisible) {
    return null;
  }

  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.centeredMessage}>
          <ActivityIndicator size="large" color="#0073fe" />
          <Text style={styles.messageText}>Memuat detail laporan...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.centeredMessage}>
          <MaterialCommunityIcons name="alert-circle-outline" size={50} color="#DC3545" />
          <Text style={styles.errorText}>Terjadi Kesalahan</Text>
          <Text style={styles.messageText}>{error}</Text>
          <Pressable onPress={onClose} style={styles.closeButton}> {/* Mengganti TouchableOpacity */}
            <Text style={styles.closeButtonText}>Tutup</Text>
          </Pressable>
        </View>
      );
    }

    if (!reportData) {
      return (
        <View style={styles.centeredMessage}>
          <Text style={styles.messageText}>Tidak ada data laporan untuk ditampilkan.</Text>
          <Pressable onPress={onClose} style={styles.closeButton}> {/* Mengganti TouchableOpacity */}
            <Text style={styles.closeButtonText}>Tutup</Text>
          </Pressable>
        </View>
      );
    }

    const renderImageBlock = (label, imageKey, signedUrl, loading, error) => {
      if (!imageKey && !signedUrl && !loading && !error) {
        return null;
      }
      return (
        <View style={styles.imageContainer}>
          <Text style={styles.detailLabel}>{label}:</Text>
          {loading ? (
            <View style={styles.imagePlaceholder}>
              <ActivityIndicator size="small" color="#0073fe" />
              <Text style={styles.messageText}>Memuat {label}...</Text>
            </View>
          ) : error ? (
            <View style={styles.imagePlaceholder}>
              <MaterialCommunityIcons name="alert-circle-outline" size={30} color="#DC3545" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : signedUrl ? (
            <Image
              source={{ uri: signedUrl }}
              style={styles.reportImage}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text style={styles.noImageText}>Tidak ada {label} tersedia.</Text>
            </View>
          )}
        </View>
      );
    };

    return (
      <ScrollView contentContainerStyle={styles.detailContent}>
        <Text style={styles.detailTitle}>Detail Laporan</Text>

        {renderImageBlock(
          'Foto Utama',
          reportData.imageUrl,
          signedImageUrl,
          loadingSignedImageUrl,
          errorSignedImageUrl
        )}

        {renderImageBlock(
          'Foto Sebelum',
          reportData.photoBefore && reportData.photoBefore.length > 0 ? reportData.photoBefore[0] : null,
          signedPhotoBeforeUrl,
          loadingSignedPhotoBeforeUrl,
          errorSignedPhotoBeforeUrl
        )}

        {renderImageBlock(
          'Foto Dalam Proses',
          reportData.photoInProgress && reportData.photoInProgress.length > 0 ? reportData.photoInProgress[0] : null,
          signedPhotoInProgressUrl,
          loadingSignedPhotoInProgressUrl,
          errorSignedPhotoInProgressUrl
        )}

        {renderImageBlock(
          'Foto Sesudah',
          reportData.photoAfter && reportData.photoAfter.length > 0 ? reportData.photoAfter[0] : null,
          signedPhotoAfterUrl,
          loadingSignedPhotoAfterUrl,
          errorSignedPhotoAfterUrl
        )}
        
        {Object.keys(reportData).map((key) => {
          if (key === 'imageUrl' || key === '__v' || key === 'updatedAt' ||
              key === 'photoBefore' || key === 'photoInProgress' || key === 'photoAfter') {
            return null;
          }

          let value = reportData[key];
          if (key === 'createdAt') {
            value = convertToJakartaTime(value);
          }
          if (typeof value === 'object' && value !== null) {
            value = JSON.stringify(value);
          }

          const displayKey = key.replace(/([A-Z])/g, ' $1')
                              .replace(/^./, str => str.toUpperCase());

          return (
            <View key={key} style={styles.detailRow}>
              <Text style={styles.detailLabel}>{displayKey}:</Text>
              <Text style={styles.detailValue}>{value || 'N/A'}</Text>
            </View>
          );
        })}

        <Pressable onPress={onClose} style={styles.closeButton}> {/* Mengganti TouchableOpacity */}
          <Text style={styles.closeButtonText}>Tutup</Text>
        </Pressable>
      </ScrollView>
    );
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <Pressable
        style={styles.modalOverlay}
        onPress={onClose}
      >
        {/* Menghapus onStartShouldSetResponder dari View ini */}
        <View style={styles.modalView} onStartShouldSetResponder={() => true} onResponderRelease={(e) => e.stopPropagation()}>
          {renderContent()}
        </View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 25,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '90%',
    maxHeight: '80%',
  },
  closeButton: {
    backgroundColor: '#0073fe',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginTop: 20,
    alignSelf: 'flex-end',
  },
  closeButtonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  detailContent: {
    paddingBottom: 20,
  },
  detailTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
    textAlign: 'center',
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 10,
    alignItems: 'flex-start',
  },
  detailLabel: {
    fontWeight: 'bold',
    color: '#555',
    marginRight: 10,
    fontSize: 15,
    minWidth: 120,
  },
  detailValue: {
    flex: 1,
    color: '#666',
    fontSize: 15,
  },
  centeredMessage: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 30,
  },
  messageText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#DC3545',
    fontWeight: 'bold',
    marginTop: 5,
    textAlign: 'center',
  },
  imageContainer: {
    width: '100%',
    height: 200,
    marginBottom: 20,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
  },
  imagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  reportImage: {
    width: '100%',
    height: '100%',
  },
  noImageText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 10,
  }
});

export default ReportDetailModal;