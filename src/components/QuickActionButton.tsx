import React, { useState, useContext } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
  Modal,
  Dimensions,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemeContext } from '../context/ThemeContext';
import { useNavigation } from '@react-navigation/native';

const QuickActionButton = () => {
  const { theme } = useContext(ThemeContext);
  const navigation = useNavigation();
  const [modalVisible, setModalVisible] = useState(false);
  const [animation] = useState(new Animated.Value(0));

  const toggleModal = () => {
    if (modalVisible) {
      // Animation to close
      Animated.timing(animation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setModalVisible(false);
      });
    } else {
      setModalVisible(true);
      // Animation to open
      Animated.timing(animation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  };

  const scaleInterpolate = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const opacityInterpolate = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const animatedStyle = {
    transform: [{ scale: scaleInterpolate }],
    opacity: opacityInterpolate,
  };

  const buttons = [
    {
      id: 'payment',
      icon: 'cash-outline',
      label: 'Paiement',
      color: '#4CAF50',
      onPress: () => {
        console.log('Payment pressed');
        toggleModal();
        // Navigation to payment screen would go here
      },
    },
    {
      id: 'receive',
      icon: 'arrow-down-outline',
      label: 'Recevoir',
      color: '#2196F3',
      onPress: () => {
        console.log('Receive pressed');
        toggleModal();
        // Navigation to receive payment screen would go here
      },
    },
    {
      id: 'credit',
      icon: 'card-outline',
      label: 'Crédit',
      color: '#FF9800',
      onPress: () => {
        console.log('Credit pressed');
        toggleModal();
        // Navigation to credit screen would go here
      },
    },
    {
      id: 'transfer',
      icon: 'swap-horizontal-outline',
      label: 'Transfert',
      color: '#9C27B0',
      onPress: () => {
        console.log('Transfer pressed');
        toggleModal();
        // Navigation to transfer screen would go here
      },
    },
  ];

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, { backgroundColor: theme.colors.primary }]}
        onPress={toggleModal}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>

      <Modal
        transparent={true}
        visible={modalVisible}
        animationType="none"
        onRequestClose={toggleModal}
      >
        <TouchableWithoutFeedback onPress={toggleModal}>
          <View style={styles.modalOverlay}>
            <Animated.View style={[styles.modalContent, animatedStyle, { backgroundColor: theme.colors.background }]}>
              <View style={styles.buttonsContainer}>
                {buttons.map((button) => (
                  <TouchableOpacity
                    key={button.id}
                    style={styles.actionButton}
                    onPress={button.onPress}
                  >
                    <View style={[styles.iconContainer, { backgroundColor: button.color }]}>
                      <Ionicons name={button.icon} size={24} color="#FFFFFF" />
                    </View>
                    <Text style={[styles.buttonLabel, { color: theme.colors.text }]}>
                      {button.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity
                style={[styles.closeButton, { backgroundColor: theme.colors.card }]}
                onPress={toggleModal}
              >
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </Animated.View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 60,
  },
  button: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    bottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    borderRadius: 20,
    padding: 20,
    width: '80%',
    alignItems: 'center',
  },
  buttonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    marginVertical: 20,
  },
  actionButton: {
    alignItems: 'center',
    width: '40%',
    marginBottom: 20,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  buttonLabel: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
  },
  closeButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
});

export default QuickActionButton;
