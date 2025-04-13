import React from 'react';
import { View, StyleSheet, Text, Dimensions, ScrollView } from 'react-native';
import { Card, List, Divider } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { BarChart, PieChart, LineChart } from 'react-native-chart-kit';
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
  const screenWidth = Dimensions.get('window').width - 40; // Margin for readability

  const renderChart = (chartData: ChartData, index: number) => {
    const chartConfig = {
      backgroundColor: '#ffffff',
      backgroundGradientFrom: '#f8f9fa',
      backgroundGradientTo: '#f1f3f5',
      decimalPlaces: 0,
      color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
      labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
      style: {
        borderRadius: 16
      }
    };

    switch (chartData.type) {
      case 'bar':
        return (
          <View key={`chart-${index}`} style={styles.chartContainer}>
            <Text style={styles.chartTitle}>{chartData.title}</Text>
            <BarChart
              data={chartData.data}
              width={screenWidth}
              height={220}
              chartConfig={chartConfig}
              verticalLabelRotation={30}
              fromZero
              showValuesOnTopOfBars
              yAxisLabel=""
              yAxisSuffix=""
            />
          </View>
        );
      case 'line':
        return (
          <View key={`chart-${index}`} style={styles.chartContainer}>
            <Text style={styles.chartTitle}>{chartData.title}</Text>
            <LineChart
              data={chartData.data}
              width={screenWidth}
              height={220}
              chartConfig={chartConfig}
              bezier
              yAxisLabel=""
              yAxisSuffix=""
            />
          </View>
        );
      case 'pie':
        // Format data for PieChart
        const pieData = chartData.data.labels.map((label: string, i: number) => ({
          name: label,
          population: chartData.data.datasets[0].data[i],
          color: chartData.data.datasets[0].colors[i],
          legendFontColor: '#7F7F7F',
          legendFontSize: 12
        }));
        
        return (
          <View key={`chart-${index}`} style={styles.chartContainer}>
            <Text style={styles.chartTitle}>{chartData.title}</Text>
            <PieChart
              data={pieData}
              width={screenWidth}
              height={220}
              chartConfig={chartConfig}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
            />
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <Card style={styles.container}>
      <Card.Title title={data.title} />
      <Card.Content>
        {/* Display markdown content if available */}
        {data.content && (
          <ScrollView style={styles.markdownContainer}>
            <Markdown>{data.content}</Markdown>
          </ScrollView>
        )}
        
        <Text style={styles.summary}>{data.summary}</Text>
        
        <Divider style={styles.divider} />
        
        {/* Charts display */}
        {data.charts && data.charts.length > 0 && (
          <ScrollView 
            horizontal={false} 
            style={styles.chartsSection}
            showsVerticalScrollIndicator={false}
          >
            {data.charts.map((chart, index) => renderChart(chart, index))}
          </ScrollView>
        )}
        
        <Text style={styles.insightsTitle}>{t('key_insights')}</Text>
        {data.insights.map((insight, index) => (
          <List.Item
            key={`insight-${index}`}
            title={insight}
            left={props => <List.Icon {...props} icon="chart-line" />}
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
