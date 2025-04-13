import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';

interface ChartProps {
  data?: {
    labels: string[];
    datasets: {
      data: number[];
      color?: string | ((opacity: number) => string);
      strokeWidth?: number;
    }[];
  };
  width?: number;
  height?: number;
  type?: 'line' | 'bar' | 'pie' | 'scatter';
  title?: string;
  chartConfig?: any;
  style?: any;
}

// This is a placeholder Chart component
// In a real app, you would use a library like react-native-chart-kit
const Chart: React.FC<ChartProps> = ({
  data = { labels: [], datasets: [{ data: [] }] },
  width = Dimensions.get('window').width - 32,
  height = 220,
  type = 'bar',
  title = 'Chart',
  style
}) => {
  // If data is empty, render placeholder
  if (!data.datasets[0].data.length) {
    return (
      <View style={[styles.container, { width, height }, style]}>
        <Text style={styles.placeholder}>No data to display</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { width, height }, style]}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.chartArea}>
        <Text style={styles.chartType}>{`${type.toUpperCase()} Chart`}</Text>
        <View style={styles.chartPreview}>
          {data.labels.map((label, index) => (
            <View key={`label-${index}`} style={styles.previewItem}>
              <View 
                style={[
                  styles.previewBar, 
                  { 
                    height: Math.max(20, (data.datasets[0].data[index] / Math.max(...data.datasets[0].data)) * 100),
                    backgroundColor: typeof data.datasets[0].color === 'function' 
                      ? data.datasets[0].color(0.8) 
                      : data.datasets[0].color || '#6200EE'
                  }
                ]}
              />
              <Text style={styles.previewLabel}>{label}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.message}>
          Note: This is a simplified chart visualization.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 16,
    marginVertical: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  chartArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    padding: 16,
  },
  chartType: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  message: {
    textAlign: 'center',
    fontSize: 12,
    color: '#666',
    marginTop: 8,
  },
  placeholder: {
    textAlign: 'center',
    fontSize: 14,
    color: '#999',
    marginTop: 'auto',
    marginBottom: 'auto',
  },
  chartPreview: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    width: '100%',
    height: 120,
    paddingBottom: 20,
  },
  previewItem: {
    alignItems: 'center',
    flex: 1,
  },
  previewBar: {
    width: 20,
    minHeight: 20,
    backgroundColor: '#6200EE',
    marginBottom: 5,
  },
  previewLabel: {
    fontSize: 10,
    color: '#666',
  },
});

export default Chart;
