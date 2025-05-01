import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { VictoryChart, VictoryLine, VictoryAxis, VictoryTheme, VictoryGroup, VictoryLegend, VictoryVoronoiContainer } from 'victory';
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

  const transformDataForVictory = (labels: string[], datasets: any[]) => {
    return datasets.map(dataset => ({
      data: labels.map((label, i) => ({ x: label, y: dataset.data[i] })),
      color: dataset.color ? dataset.color(1) : theme.colors.primary,
      strokeWidth: dataset.strokeWidth || 2,
    }));
  };

  const weekData = transformDataForVictory(
    ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
    [
      { data: [25000, 35000, 28000, 45000, 42000, 38000, 50000], color: (opacity = 1) => theme.colors.primary, strokeWidth: 2 },
      { data: [20000, 30000, 22000, 40000, 35000, 32000, 45000], color: (opacity = 1) => theme.colors.secondary + '80', strokeWidth: 2 },
    ]
  );

  const monthData = transformDataForVictory(
    ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'],
    [
      { data: [150000, 180000, 210000, 250000], color: (opacity = 1) => theme.colors.primary, strokeWidth: 2 },
      { data: [120000, 160000, 175000, 225000], color: (opacity = 1) => theme.colors.secondary + '80', strokeWidth: 2 },
    ]
  );

  const quarterData = transformDataForVictory(
    ['Jan', 'Fév', 'Mar'],
    [
      { data: [500000, 580000, 620000], color: (opacity = 1) => theme.colors.primary, strokeWidth: 2 },
      { data: [450000, 510000, 570000], color: (opacity = 1) => theme.colors.secondary + '80', strokeWidth: 2 },
    ]
  );

  const yearData = transformDataForVictory(
    ['T1', 'T2', 'T3', 'T4'],
    [
      { data: [1800000, 2200000, 2500000, 2900000], color: (opacity = 1) => theme.colors.primary, strokeWidth: 2 },
      { data: [1600000, 2000000, 2300000, 2600000], color: (opacity = 1) => theme.colors.secondary + '80', strokeWidth: 2 },
    ]
  );

  const getChartData = () => {
    if (propData) return transformDataForVictory(propData.labels, propData.datasets);

    switch (timeframe) {
      case 'week': return weekData;
      case 'month': return monthData;
      case 'quarter': return quarterData;
      case 'year': return yearData;
      default: return monthData;
    }
  };

  const chartDataSets = getChartData();

  const victoryTheme = {
    ...VictoryTheme.material,
    axis: {
      ...VictoryTheme.material.axis,
      style: {
        axis: { stroke: theme.colors.outline, strokeWidth: 1 },
        tickLabels: { fill: theme.colors.onSurfaceVariant, fontSize: 10, padding: 5 },
        grid: { stroke: theme.colors.surfaceVariant, strokeDasharray: '3, 5' },
      },
    },
    group: {
      colorScale: chartDataSets.map(ds => ds.color),
    },
  };

  const screenWidth = Dimensions.get("window").width - 40;

  const formatYTick = (tick: number | string): string => {
    const num = Number(tick);
    if (isNaN(num)) return String(tick);
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(0) + 'k';
    }
    return String(num);
  };

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

  const legendData = [
    { name: "Entrées", symbol: { fill: theme.colors.primary } },
    { name: "Sorties", symbol: { fill: theme.colors.secondary + '80' } }
  ];

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

      <VictoryLegend
        x={10} y={0}
        orientation="horizontal"
        gutter={20}
        style={{ labels: { fill: theme.colors.onSurfaceVariant, fontSize: 12 } }}
        data={legendData}
      />

      <VictoryChart
        width={screenWidth}
        height={250}
        theme={victoryTheme}
        padding={{ top: 10, bottom: 30, left: 50, right: 20 }}
        containerComponent={<VictoryVoronoiContainer voronoiDimension="x" labels={({ datum }) => `${datum.x}: ${formatYTick(datum.y)}`} />}
      >
        <VictoryAxis
          dependentAxis
          tickFormat={formatYTick}
          style={{ grid: { stroke: theme.colors.outline + '30' } }}
        />
        <VictoryAxis
          style={{ tickLabels: { angle: -30, textAnchor: 'end', fontSize: 9 } }}
        />
        <VictoryGroup
          colorScale={chartDataSets.map(ds => ds.color)}
        >
          {chartDataSets.map((dataset, index) => (
            <VictoryLine
              key={index}
              data={dataset.data}
              style={{
                data: { strokeWidth: dataset.strokeWidth }
              }}
              animate={{
                duration: 500,
                onLoad: { duration: 500 }
              }}
            />
          ))}
        </VictoryGroup>
      </VictoryChart>
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
  chart: {
    borderRadius: 12,
    paddingRight: 20,
  },
});

export default FinancialChart;
