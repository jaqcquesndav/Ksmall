import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, useTheme } from 'react-native-paper';
import { formatCurrency, formatPercentage } from '../../utils/formatters';
import { useTranslation } from 'react-i18next';

interface Metric {
  label: string;
  value: number | string;
  isCurrency?: boolean;
  isPercentage?: boolean;
}

interface Comparison {
  label: string;
  currentValue: number;
  previousValue: number;
  change: number; // percentage change
}

export interface AnalysisData {
  id: string;
  title: string;
  metrics?: Metric[];
  comparisons?: Comparison[];
  summary?: string;
  details?: string;
  period?: string;
  periodLabel?: string;
}

interface AnalysisCardProps {
  analysisData: AnalysisData;
}

const AnalysisCard: React.FC<AnalysisCardProps> = ({ analysisData }) => {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <Card style={styles.card}>
      <Card.Content>
        <Text style={styles.title}>{analysisData.title}</Text>
        
        {analysisData.period && (
          <View style={styles.periodContainer}>
            <Text style={styles.periodLabel}>
              {analysisData.periodLabel || t('period')}:
            </Text>
            <Text style={styles.periodValue}>
              {analysisData.period}
            </Text>
          </View>
        )}
        
        {analysisData.summary && (
          <Text style={styles.summary}>{analysisData.summary}</Text>
        )}
        
        {analysisData.metrics && analysisData.metrics.length > 0 && (
          <View style={styles.metricsContainer}>
            {analysisData.metrics.map((metric, index) => (
              <View key={`metric-${index}`} style={styles.metricItem}>
                <Text style={styles.metricLabel}>{metric.label}:</Text>
                <Text style={styles.metricValue}>
                  {metric.isCurrency 
                    ? formatCurrency(metric.value as number)
                    : metric.isPercentage
                      ? formatPercentage(metric.value as number)
                      : metric.value}
                </Text>
              </View>
            ))}
          </View>
        )}
        
        {analysisData.comparisons && analysisData.comparisons.length > 0 && (
          <View style={styles.comparisonsContainer}>
            <Text style={styles.sectionTitle}>{t('comparisons')}</Text>
            {analysisData.comparisons.map((comparison, index) => (
              <View key={`comparison-${index}`} style={styles.comparisonItem}>
                <Text style={styles.comparisonLabel}>{comparison.label}:</Text>
                <View style={styles.comparisonValues}>
                  <Text style={styles.comparisonValue}>
                    {formatCurrency(comparison.currentValue)}
                  </Text>
                  <Text style={[styles.changeText, { 
                    color: comparison.change >= 0 ? theme.colors.primary : theme.colors.error 
                  }]}>
                    {comparison.change >= 0 ? '+' : ''}{formatPercentage(comparison.change)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
        
        {analysisData.details && (
          <View style={styles.detailsContainer}>
            <Text style={styles.sectionTitle}>{t('details')}</Text>
            <Text style={styles.detailsText}>{analysisData.details}</Text>
          </View>
        )}
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: 12,
    elevation: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  periodContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  periodLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 4,
  },
  periodValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  summary: {
    fontSize: 14,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  metricsContainer: {
    marginBottom: 16,
  },
  metricItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  metricLabel: {
    fontSize: 14,
    color: '#666',
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  comparisonsContainer: {
    marginBottom: 16,
  },
  comparisonItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  comparisonLabel: {
    fontSize: 14,
    color: '#666',
  },
  comparisonValues: {
    flexDirection: 'row',
  },
  comparisonValue: {
    fontSize: 14,
    marginRight: 8,
    fontWeight: '500',
  },
  changeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  detailsContainer: {
    marginTop: 16,
  },
  detailsText: {
    fontSize: 14,
  },
});

export default AnalysisCard;
