import React from 'react';
import { View, StyleSheet, Text, Dimensions, ScrollView } from 'react-native';
import { Card, List, Divider, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { VictoryBar, VictoryPie, VictoryLine, VictoryChart, VictoryTheme, VictoryAxis, VictoryLabel } from 'victory';
import Markdown from 'react-native-markdown-display';


interface ChartData {
  type: 'bar' | 'pie' | 'line';
  title: string;
  data: any;
}

interface AnalysisData {
  title: string;
  summary: string;
  content?: string; // Added the content property that was missing
  charts?: ChartData[];
  insights: string[];
  chartCode?: string; // Code JavaScript for custom charts
}

interface AnalysisWidgetProps {
  data: AnalysisData;
}

const AnalysisWidget: React.FC<AnalysisWidgetProps> = ({ data }) => {
  const { t } = useTranslation();
  const theme = useTheme(); // Get theme for styling
  const screenWidth = Dimensions.get('window').width - 40; // Margin for readability

  // Define a Victory theme based on react-native-paper theme
  const victoryTheme = {
    ...VictoryTheme.material, // Start with a base theme
    axis: {
      ...VictoryTheme.material.axis,
      style: {
        ...VictoryTheme.material.axis?.style,
        axis: {
          stroke: theme.colors.onSurfaceVariant, // Use theme color
          strokeWidth: 1,
        },
        tickLabels: {
          fill: theme.colors.onSurfaceVariant, // Use theme color
          fontSize: 10,
          padding: 5,
        },
        grid: {
          stroke: theme.colors.surfaceVariant, // Use theme color for grid lines
          strokeDasharray: '3, 5',
        },
      },
    },
    bar: {
      ...VictoryTheme.material.bar,
      style: {
        ...VictoryTheme.material.bar?.style,
        data: {
          fill: theme.colors.primary, // Use theme color
        },
        labels: {
          fill: theme.colors.onSurface, // Use theme color
          fontSize: 10,
        },
      },
    },
    line: {
      ...VictoryTheme.material.line,
      style: {
        ...VictoryTheme.material.line?.style,
        data: {
          stroke: theme.colors.primary, // Use theme color
          strokeWidth: 2,
        },
        labels: {
          fill: theme.colors.onSurface, // Use theme color
          fontSize: 10,
        },
      },
    },
    pie: {
      ...VictoryTheme.material.pie,
      style: {
        ...VictoryTheme.material.pie?.style,
        labels: {
          fill: theme.colors.onSurface, // Use theme color
          fontSize: 10,
          padding: 8,
        },
      },
      // Use theme colors for slices if not provided in data
      colorScale: [theme.colors.primary, theme.colors.secondary, theme.colors.tertiary, theme.colors.error, theme.colors.surfaceVariant],
    },
  };

  const renderChart = (chartData: ChartData, index: number) => {
    // Prepare data for Victory charts
    let victoryData: any[] = [];
    if (chartData.data && chartData.data.labels && chartData.data.datasets && chartData.data.datasets[0]) {
      victoryData = chartData.data.labels.map((label: string, i: number) => ({
        x: label,
        y: chartData.data.datasets[0].data[i],
        // Include color if available for pie charts
        ...(chartData.type === 'pie' && chartData.data.datasets[0].colors && { fill: chartData.data.datasets[0].colors[i] }),
      }));
    }

    const chartHeight = 250;

    switch (chartData.type) {
      case 'bar':
        return (
          <View key={`chart-${index}`} style={styles.chartContainer}>
            <Text style={[styles.chartTitle, { color: theme.colors.onSurface }]}>{chartData.title}</Text>
            <VictoryChart
              theme={victoryTheme}
              width={screenWidth}
              height={chartHeight}
              domainPadding={{ x: 20 }}
            >
              <VictoryAxis dependentAxis gridComponent={<></>} />
              <VictoryAxis tickLabelComponent={<VictoryLabel angle={-30} textAnchor="end" />} />
              <VictoryBar data={victoryData} labels={({ datum }) => datum.y} />
            </VictoryChart>
          </View>
        );
      case 'line':
        return (
          <View key={`chart-${index}`} style={styles.chartContainer}>
            <Text style={[styles.chartTitle, { color: theme.colors.onSurface }]}>{chartData.title}</Text>
            <VictoryChart
              theme={victoryTheme}
              width={screenWidth}
              height={chartHeight}
              domainPadding={{ y: 10 }}
            >
              <VictoryAxis dependentAxis gridComponent={<></>} />
              <VictoryAxis />
              <VictoryLine data={victoryData} />
            </VictoryChart>
          </View>
        );
      case 'pie':
        // Prepare data specifically for VictoryPie (x is often nominal, y is the value)
        const pieVictoryData = chartData.data.labels.map((label: string, i: number) => ({
          x: label, // Use label as x
          y: chartData.data.datasets[0].data[i], // Value
          label: `${label}\n(${chartData.data.datasets[0].data[i]})`, // Combine label and value for display
          fill: chartData.data.datasets[0].colors ? chartData.data.datasets[0].colors[i] : undefined // Use provided color
        }));

        return (
          <View key={`chart-${index}`} style={styles.chartContainer}>
            <Text style={[styles.chartTitle, { color: theme.colors.onSurface }]}>{chartData.title}</Text>
            <VictoryPie
              data={pieVictoryData}
              width={screenWidth}
              height={chartHeight}
              theme={victoryTheme}
              colorScale={chartData.data.datasets[0].colors || victoryTheme.pie.colorScale} // Use provided colors or theme colors
              innerRadius={50} // Example: create a donut chart
              // Fix: Ensure innerRadius is treated as a number before adding
              labelRadius={({ innerRadius }) => (typeof innerRadius === 'number' ? innerRadius : 50) + 30} // Adjust label positioning
              style={{ labels: { fill: theme.colors.onSurface, fontSize: 10 } }}
            />
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <Card style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      <Card.Title title={data.title} titleStyle={{ color: theme.colors.onSurface }} />
      <Card.Content>
        {data.content && (
          <ScrollView style={styles.markdownContainer}>
            <Markdown style={{ body: { color: theme.colors.onSurface } }}>{data.content}</Markdown>
          </ScrollView>
        )}

        <Text style={[styles.summary, { color: theme.colors.onSurfaceVariant }]}>{data.summary}</Text>

        <Divider style={[styles.divider, { backgroundColor: theme.colors.outline }]} />

        {data.charts && data.charts.length > 0 && (
          <ScrollView
            horizontal={false}
            style={styles.chartsSection}
            showsVerticalScrollIndicator={false}
          >
            {data.charts.map((chart, index) => renderChart(chart, index))}
          </ScrollView>
        )}

        <Text style={[styles.insightsTitle, { color: theme.colors.onSurface }]}>{t('key_insights')}</Text>
        {data.insights.map((insight, index) => (
          <List.Item
            key={`insight-${index}`}
            title={insight}
            titleStyle={{ color: theme.colors.onSurfaceVariant }}
            left={props => <List.Icon {...props} icon="chart-line" color={theme.colors.primary} />}
            titleNumberOfLines={2}
          />
        ))}
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  summary: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
  },
  divider: {
    marginVertical: 16,
  },
  insightsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    marginTop: 16,
  },
  chartsSection: {
    marginBottom: 16,
    maxHeight: 450, // Limit height
  },
  chartContainer: {
    marginBottom: 24,
    alignItems: 'center',
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  markdownContainer: {
    marginBottom: 16,
    maxHeight: 200,
  }
});

export default AnalysisWidget;
