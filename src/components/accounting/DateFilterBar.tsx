import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Button, Menu, Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export type DateRange = {
  startDate: Date;
  endDate: Date;
};

interface DateFilterBarProps {
  onFilterChange: (range: DateRange) => void;
}

const DateFilterBar: React.FC<DateFilterBarProps> = ({ onFilterChange }) => {
  const { t } = useTranslation();
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedRange, setSelectedRange] = useState<'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom'>('month');
  const [customRange, setCustomRange] = useState<DateRange>({
    startDate: new Date(new Date().setDate(1)), // Premier jour du mois
    endDate: new Date()
  });
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  // Fonctions pour définir les plages de dates prédéfinies
  const setTodayRange = () => {
    const today = new Date();
    const range = { startDate: today, endDate: today };
    setCustomRange(range);
    onFilterChange(range);
    setSelectedRange('today');
    setMenuVisible(false);
  };

  const setWeekRange = () => {
    const today = new Date();
    const startDate = new Date();
    startDate.setDate(today.getDate() - today.getDay()); // Dimanche de cette semaine
    const range = { startDate, endDate: today };
    setCustomRange(range);
    onFilterChange(range);
    setSelectedRange('week');
    setMenuVisible(false);
  };

  const setMonthRange = () => {
    const today = new Date();
    const startDate = new Date(today.getFullYear(), today.getMonth(), 1); // Premier jour du mois
    const range = { startDate, endDate: today };
    setCustomRange(range);
    onFilterChange(range);
    setSelectedRange('month');
    setMenuVisible(false);
  };

  const setQuarterRange = () => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const quarterStartMonth = Math.floor(currentMonth / 3) * 3;
    const startDate = new Date(today.getFullYear(), quarterStartMonth, 1);
    const range = { startDate, endDate: today };
    setCustomRange(range);
    onFilterChange(range);
    setSelectedRange('quarter');
    setMenuVisible(false);
  };

  const setYearRange = () => {
    const today = new Date();
    const startDate = new Date(today.getFullYear(), 0, 1); // 1er janvier de l'année en cours
    const range = { startDate, endDate: today };
    setCustomRange(range);
    onFilterChange(range);
    setSelectedRange('year');
    setMenuVisible(false);
  };

  const handleStartDateChange = (selectedDate: Date) => {
    setShowStartDatePicker(false);
    if (selectedDate) {
      const newRange = { ...customRange, startDate: selectedDate };
      setCustomRange(newRange);
      setSelectedRange('custom');
      onFilterChange(newRange);
    }
  };

  const handleEndDateChange = (selectedDate: Date) => {
    setShowEndDatePicker(false);
    if (selectedDate) {
      const newRange = { ...customRange, endDate: selectedDate };
      setCustomRange(newRange);
      setSelectedRange('custom');
      onFilterChange(newRange);
    }
  };

  const formatDate = (date: Date): string => {
    return format(date, 'dd/MM/yyyy', { locale: fr });
  };

  return (
    <View style={styles.container}>
      <Menu
        visible={menuVisible}
        onDismiss={() => setMenuVisible(false)}
        anchor={
          <Button 
            mode="outlined" 
            icon="calendar" 
            onPress={() => setMenuVisible(true)}
            style={styles.filterButton}
          >
            {selectedRange === 'custom' 
              ? `${formatDate(customRange.startDate)} - ${formatDate(customRange.endDate)}`
              : t(`filter_${selectedRange}`)}
          </Button>
        }
      >
        <Menu.Item onPress={setTodayRange} title={t('filter_today')} />
        <Menu.Item onPress={setWeekRange} title={t('filter_week')} />
        <Menu.Item onPress={setMonthRange} title={t('filter_month')} />
        <Menu.Item onPress={setQuarterRange} title={t('filter_quarter')} />
        <Menu.Item onPress={setYearRange} title={t('filter_year')} />
        <Menu.Item 
          onPress={() => {
            setSelectedRange('custom');
            setMenuVisible(false);
          }} 
          title={t('filter_custom')}
        />
      </Menu>

      {selectedRange === 'custom' && (
        <View style={styles.customDateContainer}>
          <TouchableOpacity onPress={() => setShowStartDatePicker(true)} style={styles.dateInput}>
            <Text>{formatDate(customRange.startDate)}</Text>
          </TouchableOpacity>
          
          <Text style={styles.dateSeparator}>-</Text>
          
          <TouchableOpacity onPress={() => setShowEndDatePicker(true)} style={styles.dateInput}>
            <Text>{formatDate(customRange.endDate)}</Text>
          </TouchableOpacity>
        </View>
      )}

      <DateTimePickerModal
        isVisible={showStartDatePicker}
        mode="date"
        onConfirm={handleStartDateChange}
        onCancel={() => setShowStartDatePicker(false)}
        date={customRange.startDate}
        maximumDate={customRange.endDate}
      />
      
      <DateTimePickerModal
        isVisible={showEndDatePicker}
        mode="date"
        onConfirm={handleEndDateChange}
        onCancel={() => setShowEndDatePicker(false)}
        date={customRange.endDate}
        minimumDate={customRange.startDate}
        maximumDate={new Date()}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterButton: {
    flex: 1,
  },
  customDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  dateInput: {
    padding: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 4,
  },
  dateSeparator: {
    marginHorizontal: 8,
  },
});

export default DateFilterBar;
