// src/components/Sidebar.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';

// Import ikon dari react-native-vector-icons
import AntDesign from 'react-native-vector-icons/AntDesign';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Feather from 'react-native-vector-icons/Feather';

const Sidebar = ({ isSidebarOpen, animatedSidebarWidth, isDesktop, activeNavItem, onNavItemPress }) => {
  const [navItemLayouts, setNavItemLayouts] = useState({});
  const animatedIndicatorY = useState(new Animated.Value(0))[0];
  const animatedIndicatorHeight = useState(new Animated.Value(0))[0];

  const handleLayout = (itemName) => (event) => {
    const { y, height } = event.nativeEvent.layout;
    setNavItemLayouts(prev => ({ ...prev, [itemName]: { y, height } }));
  };

  useEffect(() => {
    if (navItemLayouts[activeNavItem]) {
      const { y, height } = navItemLayouts[activeNavItem];
      Animated.parallel([
        Animated.timing(animatedIndicatorY, { toValue: y, duration: 300, useNativeDriver: false }),
        Animated.timing(animatedIndicatorHeight, { toValue: height, duration: 300, useNativeDriver: false }),
      ]).start();
    }
  }, [activeNavItem, navItemLayouts, animatedIndicatorY, animatedIndicatorHeight]);

  if (!isSidebarOpen && !isDesktop) {
    return null;
  }

  const navItems = [
    { name: 'Dashboard', icon: 'view-dashboard' },
    { name: 'Data Report', icon: 'chart-bell-curve' },
  ];

  return (
    <Animated.View style={[
      styles.sidebar,
      { width: animatedSidebarWidth },
      !isDesktop && styles.sidebarMobile,
    ]}>
      {isSidebarOpen || isDesktop ? (
        <>
          <View style={styles.sidebarTop}>
            {navItemLayouts[activeNavItem] && (
              <Animated.View
                style={[
                  styles.activeIndicator,
                  {
                    transform: [{ translateY: animatedIndicatorY }],
                    height: animatedIndicatorHeight,
                  }
                ]}
              />
            )}
            {navItems.map((item) => (
              <TouchableOpacity
                key={item.name}
                style={[
                  styles.navItem,
                  activeNavItem === item.name && styles.navItemActive
                ]}
                onPress={() => onNavItemPress(item.name)}
                onLayout={handleLayout(item.name)}
              >
                {item.name === 'Order' || item.name === 'Dashboard' || item.name === 'Statistic' || item.name === 'Stock' ? (
                  <MaterialCommunityIcons
                    name={item.icon}
                    size={24}
                    color={activeNavItem === item.name ? '#0073fe' : '#FFF'}
                  />
                ) : item.name === 'Product' ? (
                  <AntDesign
                    name={item.icon}
                    size={24}
                    color={activeNavItem === item.name ? '#0073fe' : '#FFF'}
                  />
                ) : item.name === 'Offer' ? (
                  <Feather
                    name={item.icon}
                    size={24}
                    color={activeNavItem === item.name ? '#0073fe' : '#FFF'}
                  />
                ) : (
                  <MaterialCommunityIcons
                    name={item.icon}
                    size={24}
                    color={activeNavItem === item.name ? '#0073fe' : '#FFF'}
                  />
                )}<Text
                  style={[
                    styles.navItemText,
                    activeNavItem === item.name && styles.navItemTextActive,
                  ]}
                >
                  {item.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.socialLinksContainer}>
            <TouchableOpacity><Text style={styles.socialLinkText}>Facebook</Text></TouchableOpacity>
            <TouchableOpacity><Text style={styles.socialLinkText}>Twitter</Text></TouchableOpacity>
            <TouchableOpacity><Text style={styles.socialLinkText}>Google</Text></TouchableOpacity>
          </View>
        </>
      ) : null}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  sidebar: {
    backgroundColor: '#0073fe',
    paddingVertical: 30,
    paddingLeft: 20,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  sidebarMobile: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 5, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 15,
  },
  sidebarTop: {
    // paddingTop: 20,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
    marginBottom: 10,
    zIndex: 2,
    position: 'relative',
  },
  navItemActive: {
    // No change
  },
  navItemText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 15,
  },
  navItemTextActive: {
    color: '#0073fe',
    fontWeight: 'bold',
  },
  activeIndicator: {
    backgroundColor: '#F0F0F0',
    position: 'absolute',
    right: -20,
    width: '110%',
    zIndex: 1,
    shadowColor: '#000',
    shadowOffset: { width: -5, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 20,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
  },
  socialLinksContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 10,
    marginTop: 30,
  },
  socialLinkText: {
    color: '#FFF',
    fontSize: 12,
    opacity: 0.8,
  },
});

export default Sidebar;