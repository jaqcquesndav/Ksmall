import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';

interface FinancialChartProps {
  theme: any;
  data?: {
    labels: string[];
    datasets: {
      data: number[];
      color?: (opacity: number) => string;
      strokeWidth?: number;
    }[];
  };
}

const FinancialChart: React.FC<FinancialChartProps> = ({ theme, data: propData }) => {
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  
  // Sample data
  const weekData = {
    labels: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
    datasets: [
      {
        data: [25000, 35000, 28000, 45000, 42000, 38000, 50000],
        color: (opacity = 1) => theme.colors.primary,
        strokeWidth: 2,
      },
      {
        data: [20000, 30000, 22000, 40000, 35000, 32000, 45000],
        color: (opacity = 1) => theme.colors.secondary + '80',
        strokeWidth: 2,
      },
    ],
  };
  
  const monthData = {
    labels: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'],
    datasets: [
      {
        data: [150000, 180000, 210000, 250000],
        color: (opacity = 1) => theme.colors.primary,
        strokeWidth: 2,
      },
      {
        data: [120000, 160000, 175000, 225000],
        color: (opacity = 1) => theme.colors.secondary + '80',
        strokeWidth: 2,
      },
    ],
  };
  
  const quarterData = {
    labels: ['Jan', 'Fév', 'Mar'],
    datasets: [
      {
        data: [500000, 580000, 620000],
        color: (opacity = 1) => theme.colors.primary,
        strokeWidth: 2,
      },
      {
        data: [450000, 510000, 570000],
        color: (opacity = 1) => theme.colors.secondary + '80',
        strokeWidth: 2,
      },
    ],
  };
  
  const yearData = {
    labels: ['T1', 'T2', 'T3', 'T4'],
    datasets: [
      {
        data: [1800000, 2200000, 2500000, 2900000],
        color: (opacity = 1) => theme.colors.primary,
        strokeWidth: 2,
      },
      {
        data: [1600000, 2000000, 2300000, 2600000],
        color: (opacity = 1) => theme.colors.secondary + '80',
        strokeWidth: 2,
      },
    ],
  };
  
  const getChartData = () => {
    if (propData) return propData;
    
    switch (timeframe) {
      case 'week':
        return weekData;
      case 'month':
        return monthData;
      case 'quarter':
        return quarterData;
      case 'year':
        return yearData;
      default:
        return monthData;
    }
  };
  
  const chartData = getChartData();
  
  const chartConfig = {
    backgroundColor: theme.dark ? theme.colors.card : '#FFFFFF',
    backgroundGradientFrom: theme.dark ? theme.colors.card : '#FFFFFF',
    backgroundGradientTo: theme.dark ? theme.colors.card : '#FFFFFF',
    decimalPlaces: 0,
    color: (opacity = 1) => theme.colors.text + 'aa',
    labelColor: (opacity = 1) => theme.colors.text + 'dd',
    style: {
      borderRadius: 12,
    },
    propsForDots: {
      r: "4",
      strokeWidth: "2",
      stroke: theme.colors.background,
    },
    propsForLabels: {
      fontSize: 12,
    },
  };
  
  const screenWidth = Dimensions.get("window").width - 40;
  
  const TimeframeButton = ({ title, value, isActive }) => (
    <TouchableOpacity
      style={[
        styles.timeframeButton,
        isActive && { backgroundColor: theme.colors.primary + '20' }
      ]}
      onPress={() => setTimeframe(value)}
    >
      <Text
        style={[
          styles.timeframeButtonText,
          { color: isActive ? theme.colors.primary : theme.colors.text + '80' }
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
  
  return (
    <View style={styles.container}>
      <View style={styles.chartHeader}>
        <Text style={[styles.chartTitle, { color: theme.colors.text }]}>Revenus et Dépenses</Text>
        <View style={styles.timeframeButtons}>
          <TimeframeButton title="7J" value="week" isActive={timeframe === 'week'} />
          <TimeframeButton title="1M" value="month" isActive={timeframe === 'month'} />
          <TimeframeButton title="3M" value="quarter" isActive={timeframe === 'quarter'} />
          <TimeframeButton title="1A" value="year" isActive={timeframe === 'year'} />
        </View>
      </View>
      
      <View style={[styles.legendContainer]}>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: theme.colors.primary }]} />
          <Text style={{ color: theme.colors.text }}>Entrées</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: theme.colors.secondary + '80' }]} />
          <Text style={{ color: theme.colors.text }}>Sorties</Text>
        </View>
      </View>
      
      <LineChart
        data={chartData}
        width={screenWidth}
        height={220}
        chartConfig={chartConfig}
        bezier
        style={styles.chart}
        withInnerLines={true}
        withOuterLines={false}
        withHorizontalLines={true}
        withVerticalLines={false}
        yAxisInterval={1}
        formatYLabel={(value) => {
          const num = parseInt(value);
          if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
          } else if (num >= 1000) {
            return (num / 1000).toFixed(0) + 'k';
          }
          return value;
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 10,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  timeframeButtons: {
    flexDirection: 'row',
  },
  timeframeButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 5,
  },
  timeframeButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  legendContainer: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 5,
  },
  chart: {
    borderRadius: 12,
    paddingRight: 20,
  },
});

export default FinancialChart;
