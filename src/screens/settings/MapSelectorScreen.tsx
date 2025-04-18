import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Button, FAB } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import * as Location from 'expo-location';
import MapView, { Marker } from 'react-native-maps';
import AppHeader from '../../components/common/AppHeader';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainStackParamList } from '../../navigation/types';
import logger from '../../utils/logger';
import useOrientation from '../../hooks/useOrientation';

type MapSelectorScreenProps = NativeStackScreenProps<MainStackParamList, 'MapSelector'>;

const MapSelectorScreen: React.FC<MapSelectorScreenProps> = ({ route, navigation }) => {
  const { t } = useTranslation();
  const { initialLocation, onLocationSelected, title = t('select_location') } = route.params;
  const { isLandscape, dimensions } = useOrientation();

  const [selectedLocation, setSelectedLocation] = useState<{ latitude: number; longitude: number } | null>(
    initialLocation || null
  );
  
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number }>({
    latitude: -1.6777, // Goma, République Démocratique du Congo
    longitude: 29.2285
  });
  
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        // Demander la permission d'accéder à la localisation
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setErrorMsg(t('location_permission_denied'));
          return;
        }

        // Obtenir la localisation actuelle
        let location = await Location.getCurrentPositionAsync({});
        setCurrentLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude
        });
        
        // Si pas de position sélectionnée, utiliser la position actuelle
        if (!selectedLocation) {
          setSelectedLocation({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude
          });
        }
      } catch (error) {
        logger.error('Erreur lors de la récupération de la localisation', error);
        setErrorMsg(t('location_error'));
      }
    })();
  }, []);

  const handleMapPress = (event: any) => {
    setSelectedLocation(event.nativeEvent.coordinate);
  };

  const handleConfirm = () => {
    if (selectedLocation) {
      // Appeler la callback fournie par le parent avec les coordonnées sélectionnées
      onLocationSelected(selectedLocation);
      navigation.goBack();
    }
  };

  // Calculer les dimensions de la carte en fonction de l'orientation
  const mapHeight = isLandscape 
    ? dimensions.height - 120  // En mode paysage, la carte occupe presque tout l'écran
    : dimensions.height - 160; // En mode portrait, on laisse plus d'espace pour les boutons

  const mapWidth = dimensions.width;

  return (
    <View style={styles.container}>
      <AppHeader title={title} showBack />

      <MapView
        style={[
          styles.map, 
          { 
            width: mapWidth,
            height: mapHeight
          }
        ]}
        initialRegion={{
          latitude: selectedLocation?.latitude || currentLocation.latitude,
          longitude: selectedLocation?.longitude || currentLocation.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        }}
        onPress={handleMapPress}
      >
        {selectedLocation && (
          <Marker
            coordinate={{
              latitude: selectedLocation.latitude,
              longitude: selectedLocation.longitude,
            }}
            draggable
            onDragEnd={(e) => setSelectedLocation(e.nativeEvent.coordinate)}
          />
        )}
      </MapView>

      <View style={[
        styles.buttonContainer,
        isLandscape && styles.buttonContainerLandscape
      ]}>
        <Button
          mode="contained"
          onPress={handleConfirm}
          style={styles.confirmButton}
          disabled={!selectedLocation}
        >
          {t('confirm_location')}
        </Button>
      </View>

      <FAB
        style={[
          styles.fab,
          isLandscape && styles.fabLandscape
        ]}
        icon="crosshairs-gps"
        onPress={async () => {
          try {
            let location = await Location.getCurrentPositionAsync({});
            setSelectedLocation({
              latitude: location.coords.latitude,
              longitude: location.coords.longitude
            });
          } catch (error) {
            logger.error('Erreur lors de la récupération de la localisation actuelle', error);
          }
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    // Les dimensions sont définies dynamiquement dans le composant
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  buttonContainerLandscape: {
    bottom: 10,
  },
  confirmButton: {
    width: '80%',
    paddingVertical: 6,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 80,
  },
  fabLandscape: {
    bottom: 70,
    right: 10,
  },
});

export default MapSelectorScreen;