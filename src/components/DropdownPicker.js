// src/components/DropdownPicker.js
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  FlatList,
  Animated, // Import Animated for animations
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather'; // Assuming Feather icons are installed

const MAX_DROPDOWN_HEIGHT = 200; // Default maximum height for the dropdown list

/**
 * A customizable dropdown picker component for React Native with animation.
 * The dropdown expands downwards from the button.
 *
 * @param {object} props - The component props.
 * @param {Array<object>} props.options - An array of objects, each with a 'label' and 'value' property.
 *                                      Example: [{ label: 'Option 1', value: 'value1' }, { label: 'Option 2', value: 'value2' }]
 * @param {*} props.selectedValue - The currently selected value.
 * @param {function(value: *): void} props.onValueChange - Callback function when a new value is selected.
 * @param {string} [props.placeholder='Select an option'] - Text to display when no value is selected or as a default.
 * @param {object} [props.containerStyle={}] - Optional style for the main wrapper View of the component.
 * @param {object} [props.buttonStyle={}] - Optional style for the dropdown button (TouchableOpacity).
 * @param {object} [props.buttonTextStyle={}] - Optional style for the text inside the dropdown button.
 * @param {object} [props.dropdownStyle={}] - Optional style for the animated dropdown options container (Animated.View).
 * @param {object} [props.optionStyle={}] - Optional style for each individual option item (TouchableOpacity).
 * @param {object} [props.optionTextStyle={}] - Optional style for the text of each option item.
 * @param {number} [props.maxDropdownHeight=200] - Maximum height of the expanded dropdown list.
 */
const DropdownPicker = ({
  options,
  selectedValue,
  onValueChange,
  placeholder = 'Select an option',
  containerStyle,
  buttonStyle,
  buttonTextStyle,
  dropdownStyle,
  optionStyle,
  optionTextStyle,
  maxDropdownHeight = MAX_DROPDOWN_HEIGHT,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [buttonLayout, setButtonLayout] = useState(null); // Stores button position and dimensions (x, y, width, height)
  const buttonRef = useRef(null); // Ref to get button layout for positioning

  const animatedHeight = useRef(new Animated.Value(0)).current; // Animated value for dropdown height
  const animatedOpacity = useRef(new Animated.Value(0)).current; // Animated value for dropdown opacity

  // Find the label for the currently selected value to display on the button
  const selectedLabel = options.find(option => option.value === selectedValue)?.label || placeholder;

  // Function to open the dropdown with a smooth animation
  const openDropdown = useCallback(() => {
    // Measure the button's position and dimensions in the window
    buttonRef.current?.measureInWindow((x, y, width, height) => {
      setButtonLayout({ x, y, width, height }); // Store layout for absolute positioning
      setIsDropdownOpen(true); // Open the modal

      // Start parallel animations for height and opacity
      Animated.parallel([
        Animated.timing(animatedHeight, {
          toValue: maxDropdownHeight, // Animate to full desired height
          duration: 250, // Animation duration
          useNativeDriver: false, // Height animation typically requires JS driver
        }),
        Animated.timing(animatedOpacity, {
          toValue: 1, // Animate to fully opaque
          duration: 150, // Shorter duration for opacity for a snappier feel
          useNativeDriver: false,
        }),
      ]).start();
    });
  }, [animatedHeight, animatedOpacity, maxDropdownHeight]);

  // Function to close the dropdown with a smooth animation
  const closeDropdown = useCallback(() => {
    Animated.parallel([
      Animated.timing(animatedHeight, {
        toValue: 0, // Animate height back to 0
        duration: 200, // Animation duration
        useNativeDriver: false,
      }),
      Animated.timing(animatedOpacity, {
        toValue: 0, // Animate opacity back to 0
        duration: 150,
        useNativeDriver: false,
      }),
    ]).start(() => {
      // After animation completes, unmount the modal and reset animated values
      setIsDropdownOpen(false);
      animatedHeight.setValue(0);
      animatedOpacity.setValue(0);
    });
  }, [animatedHeight, animatedOpacity]);

  // Handler for when an option is selected
  const handleSelectOption = (value) => {
    onValueChange(value); // Call the provided callback
    closeDropdown(); // Close the dropdown
  };

  // Render function for each option in the FlatList
  const renderOption = ({ item }) => (
    <TouchableOpacity
      style={[styles.dropdownOption, optionStyle]}
      onPress={() => handleSelectOption(item.value)}
    >
      <Text style={[styles.dropdownOptionText, optionTextStyle]}>{item.label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, containerStyle]}>
      {/* The main dropdown button */}
      <TouchableOpacity
        ref={buttonRef} // Attach ref to this button
        style={[styles.dropdownButton, buttonStyle]}
        onPress={openDropdown} // Open dropdown on press
      >
        <Text style={[styles.buttonText, buttonTextStyle]}>{selectedLabel}</Text>
        <Icon name="chevron-down" size={20} color="#0073fe" style={styles.icon} />
      </TouchableOpacity>

      {/* Modal to display the dropdown options */}
      <Modal
        transparent={true} // Allows content underneath to be seen
        visible={isDropdownOpen} // Controlled by state
        onRequestClose={closeDropdown} // Handles back button on Android
        animationType="fade" // Or 'none' if only relying on custom height/opacity animation
      >
        {/* Overlay that closes the dropdown when tapped outside */}
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1} // Prevents visual feedback on tap
          onPress={closeDropdown} // Close dropdown when tapping overlay
        >
          {/* Animated container for the dropdown options, absolutely positioned */}
          {buttonLayout && ( // Only render if button layout is known
            <Animated.View
              style={[
                styles.dropdownAnimatedContainer,
                {
                  // Position the dropdown directly below the button
                  top: buttonLayout.y + buttonLayout.height + 5, // 5 units of spacing below the button
                  left: buttonLayout.x,
                  width: buttonLayout.width,
                  // Apply animated height and opacity
                  height: animatedHeight,
                  opacity: animatedOpacity,
                  overflow: 'hidden', // Crucial to clip content during height animation
                },
                dropdownStyle, // Allow custom styles to override positioning/sizing if needed
              ]}
            >
              <FlatList
                data={options}
                renderItem={renderOption}
                keyExtractor={(item, index) => String(item.value || index)}
                // Max height for FlatList content, allows scrolling if content exceeds animated height
                style={{ maxHeight: maxDropdownHeight }}
                contentContainerStyle={styles.dropdownListContent}
              />
            </Animated.View>
          )}
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // Default container styles (can be overridden by prop)
    zIndex: 1, // Ensures the dropdown button has a higher z-index than content below it
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 15,
    minWidth: 150,
    zIndex: 2, // Ensures button is above other potential content
  },
  buttonText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  icon: {
    marginLeft: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)', // Semi-transparent overlay to dim background
  },
  dropdownAnimatedContainer: {
    position: 'absolute', // Absolute positioning within the modal overlay
    backgroundColor: '#FFF',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5, // Android shadow
  },
  dropdownListContent: {
    // Styles for the content container of the FlatList (e.g., padding inside the list)
  },
  dropdownOption: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
    // Remove last border for cleaner look by default (can be overridden)
    // borderBottomColor: 'transparent',
    // borderBottomWidth: 0,
  },
  dropdownOptionText: {
    fontSize: 14,
    color: '#333',
  },
});

export default DropdownPicker;