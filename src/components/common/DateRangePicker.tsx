import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

interface DateRangePickerProps {
  onSelectRange: (startDate: Date, endDate: Date) => void;
  theme: any;
  initialStartDate?: Date;
  initialEndDate?: Date;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({
  onSelectRange,
  theme,
  initialStartDate,
  initialEndDate,
}) => {
  const today = new Date();
  const defaultEndDate = new Date();
  defaultEndDate.setDate(today.getDate() + 7);

  const [isPickerVisible, setIsPickerVisible] = useState(false);
  const [tempStartDate, setTempStartDate] = useState(initialStartDate || today);
  const [tempEndDate, setTempEndDate] = useState(initialEndDate || defaultEndDate);
  const [startDate, setStartDate] = useState(initialStartDate || today);
  const [endDate, setEndDate] = useState(initialEndDate || defaultEndDate);
  const [isSelectingStart, setIsSelectingStart] = useState(true);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (initialStartDate) {
      setStartDate(initialStartDate);
      setTempStartDate(initialStartDate);
    }
    if (initialEndDate) {
      setEndDate(initialEndDate);
      setTempEndDate(initialEndDate);
    }
  }, [initialStartDate, initialEndDate]);

  useEffect(() => {
    if (tempEndDate < tempStartDate) {
      const newEndDate = new Date(tempStartDate);
      newEndDate.setDate(tempStartDate.getDate() + 1);
      setTempEndDate(newEndDate);
    }
  }, [tempStartDate, tempEndDate]);

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const handleOpenPicker = () => {
    setTempStartDate(startDate);
    setTempEndDate(endDate);
    setIsSelectingStart(true);
    setIsPickerVisible(true);
    setShow(true);
  };

  const handleCancel = () => {
    setIsPickerVisible(false);
    setShow(false);
  };

  const handleConfirm = () => {
    setStartDate(tempStartDate);
    setEndDate(tempEndDate);
    onSelectRange(tempStartDate, tempEndDate);
    setIsPickerVisible(false);
    setShow(false);
  };

  const onChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShow(false);
    }

    if (selectedDate) {
      if (isSelectingStart) {
        setTempStartDate(selectedDate);
        if (Platform.OS === 'android') {
          setIsSelectingStart(false);
          setTimeout(() => setShow(true), 500);
        }
      } else {
        if (selectedDate < tempStartDate) {
          const newEndDate = new Date(tempStartDate);
          newEndDate.setDate(tempStartDate.getDate() + 1);
          setTempEndDate(newEndDate);
        } else {
          setTempEndDate(selectedDate);
        }
        if (Platform.OS === 'android') {
          handleConfirm();
        }
      }
    } else if (Platform.OS === 'android') {
      handleCancel();
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.pickerButton,
          { backgroundColor: theme.colors.background, borderColor: theme.colors.border }
        ]}
        onPress={handleOpenPicker}
      >
        <Ionicons name="calendar-outline" size={18} color={theme.colors.primary} />
        <Text style={[styles.dateRangeText, { color: theme.colors.text }]}>
          {formatDate(startDate)} - {formatDate(endDate)}
        </Text>
        <Ionicons name="chevron-down" size={16} color={theme.colors.text + '80'} />
      </TouchableOpacity>

      {Platform.OS === 'ios' ? (
        <Modal
          visible={isPickerVisible}
          transparent={true}
          animationType="slide"
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: theme.colors.card }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                  {isSelectingStart ? 'Date de début' : 'Date de fin'}
                </Text>
                <TouchableOpacity onPress={handleCancel}>
                  <Text style={{ color: theme.colors.error }}>Annuler</Text>
                </TouchableOpacity>
              </View>

              <DateTimePicker
                value={isSelectingStart ? tempStartDate : tempEndDate}
                mode="date"
                display="spinner"
                onChange={onChange}
                style={{ width: '100%' }}
                textColor={theme.colors.text}
              />

              <View style={styles.modalButtons}>
                {!isSelectingStart && (
                  <TouchableOpacity
                    style={[styles.backButton, { borderColor: theme.colors.border }]}
                    onPress={() => setIsSelectingStart(true)}
                  >
                    <Text style={{ color: theme.colors.primary }}>Retour</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.nextButton, { backgroundColor: theme.colors.primary }]}
                  onPress={() => {
                    if (isSelectingStart) {
                      setIsSelectingStart(false);
                    } else {
                      handleConfirm();
                    }
                  }}
                >
                  <Text style={{ color: '#FFFFFF' }}>
                    {isSelectingStart ? 'Suivant' : 'Confirmer'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      ) : (
        show && (
          <DateTimePicker
            value={isSelectingStart ? tempStartDate : tempEndDate}
            mode="date"
            display="default"
            onChange={onChange}
          />
        )
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  dateRangeText: {
    flex: 1,
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 25,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  backButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  nextButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginLeft: 10,
    flex: 1,
    alignItems: 'center',
  },
});

export default DateRangePicker;
