import React, { useState, useRef } from 'react';
import { View, StyleSheet, Dimensions, Animated, FlatList } from 'react-native';
import { Button, Text, Title, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/types';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

const { width } = Dimensions.get('window');

type OnboardingScreenProps = NativeStackScreenProps<
  AuthStackParamList,
  'Onboarding'
>;

// Type d'icônes de MaterialCommunityIcons
type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

interface OnboardingSlide {
  id: string;
  title: string;
  description: string;
  icon: IconName; // Correction: utilisation du type IconName pour être compatible
}

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ navigation }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  // Correction: modifier le type de référence pour un FlatList standard
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const [currentIndex, setCurrentIndex] = useState(0);

  // Remplacer les images par des icônes avec les types corrects
  const slides: OnboardingSlide[] = [
    {
      id: '1',
      title: t('onboarding_slide1_title'),
      description: t('onboarding_slide1_description'),
      icon: 'check-circle-outline' as IconName,
    },
    {
      id: '2',
      title: t('onboarding_slide2_title'),
      description: t('onboarding_slide2_description'),
      icon: 'credit-card-outline' as IconName,
    },
    {
      id: '3',
      title: t('onboarding_slide3_title'),
      description: t('onboarding_slide3_description'),
      icon: 'package-variant' as IconName,
    },
  ];

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      const nextIndex = currentIndex + 1;

      // Correction: utilisation d'un scroll manuel au lieu de scrollToIndex
      if (flatListRef.current) {
        flatListRef.current.scrollToOffset({
          offset: nextIndex * width,
          animated: true,
        });
      }

      setCurrentIndex(nextIndex);
    } else {
      navigation.replace('Login');
    }
  };

  const handleSkip = () => {
    navigation.replace('Login');
  };

  const renderItem = ({ item }: { item: OnboardingSlide }) => (
    <View style={styles.slide}>
      <View style={styles.iconContainer}>
        {/* Utilisation d'icône Material Community */}
        <Animated.View style={styles.iconCircle}>
          <MaterialCommunityIcons
            name={item.icon}
            size={120}
            color={theme.colors.primary}
          />
        </Animated.View>
      </View>

      <Title style={styles.title}>{item.title}</Title>

      <Text style={styles.description}>{item.description}</Text>
    </View>
  );

  const isLastSlide = currentIndex === slides.length - 1;

  return (
    <View style={styles.container}>
      <View style={styles.skipContainer}>
        {!isLastSlide && (
          <Button mode="text" onPress={handleSkip}>
            {t('skip')}
          </Button>
        )}
      </View>

      <Animated.FlatList
        data={slides}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onMomentumScrollEnd={(event) => {
          const newIndex = Math.round(
            event.nativeEvent.contentOffset.x / width
          );
          setCurrentIndex(newIndex);
        }}
        scrollEventThrottle={16}
        style={styles.flatList}
        ref={flatListRef}
      />

      <View style={styles.pagination}>
        {slides.map((_, idx) => {
          const inputRange = [
            (idx - 1) * width,
            idx * width,
            (idx + 1) * width,
          ];

          const dotWidth = scrollX.interpolate({
            inputRange,
            outputRange: [10, 20, 10],
            extrapolate: 'clamp',
          });

          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.3, 1, 0.3],
            extrapolate: 'clamp',
          });

          return (
            <Animated.View
              key={idx.toString()}
              style={[
                styles.dot,
                {
                  width: dotWidth,
                  opacity,
                  backgroundColor: theme.colors.primary,
                },
              ]}
            />
          );
        })}
      </View>

      <View style={styles.buttonContainer}>
        <Button mode="contained" onPress={handleNext} style={styles.button}>
          {isLastSlide ? t('get_started') : t('next')}
        </Button>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  skipContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    alignItems: 'flex-end',
  },
  flatList: {
    flex: 1,
  },
  slide: {
    width,
    alignItems: 'center',
    padding: 16,
    paddingTop: 60,
  },
  iconContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  iconCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(103, 58, 183, 0.1)', // couleur violette légère
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 24,
    color: '#666',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  dot: {
    height: 10,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  buttonContainer: {
    paddingHorizontal: 32,
    paddingBottom: 32,
  },
  button: {
    paddingVertical: 8,
  },
});

export default OnboardingScreen;
