// Import our custom initialization file to fix core module errors
import './src/utils/initializeCore';

import { registerRootComponent } from 'expo';
import App from './App';

// Point d'entrée de l'application Expo
registerRootComponent(App);