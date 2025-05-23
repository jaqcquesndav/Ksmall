import React, { useState, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, Menu } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

// Define and export CHAT_MODES enum
export enum CHAT_MODES {
  REGULAR = 'regular',
  ACCOUNTING = 'accounting',
  INVENTORY = 'inventory',
  ANALYSIS = 'analysis'
}

interface ModeSelectorProps {
  currentMode: CHAT_MODES;
  onChangeMode: (mode: CHAT_MODES) => void;
}

const ModeSelector: React.FC<ModeSelectorProps> = ({ currentMode, onChangeMode }) => {
  const { t } = useTranslation();
  const [showModeMenu, setShowModeMenu] = useState(false);
  const buttonRef = useRef<View>(null);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0, width: 0, height: 0 });

  const openMenu = () => {
    buttonRef.current?.measure((fx, fy, width, height, px, py) => {
      setMenuPosition({ x: px, y: py, width, height });
      setShowModeMenu(true);
    });
  };

  const getModeLabel = (mode: CHAT_MODES): string => {
    switch (mode) {
      case CHAT_MODES.ACCOUNTING:
        return t('accounting_mode');
      case CHAT_MODES.INVENTORY:
        return t('inventory_mode');
      case CHAT_MODES.ANALYSIS:
        return t('analysis_mode');
      default:
        return t('regular_mode');
    }
  };

  const getModeIcon = (mode: CHAT_MODES): string => {
    switch (mode) {
      case CHAT_MODES.ACCOUNTING:
        return 'calculator';
      case CHAT_MODES.INVENTORY:
        return 'package-variant';
      case CHAT_MODES.ANALYSIS:
        return 'chart-bar';
      default:
        return 'chat';
    }
  };

  return (
    <View style={styles.container}>
      <Button
        mode="outlined"
        icon={getModeIcon(currentMode)}
        onPress={openMenu}
        style={styles.button}
        ref={buttonRef}
      >
        {getModeLabel(currentMode)}
      </Button>

      <Menu
        visible={showModeMenu}
        onDismiss={() => setShowModeMenu(false)}
        anchor={menuPosition}
      >
        {Object.values(CHAT_MODES).map(mode => (
          <Menu.Item
            key={mode}
            title={getModeLabel(mode)}
            leadingIcon={getModeIcon(mode)}
            onPress={() => {
              onChangeMode(mode);
              setShowModeMenu(false);
            }}
          />
        ))}
      </Menu>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 8,
    backgroundColor: '#FFFFFF', // Changé de #f0f0f0 à blanc
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  button: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF', // Ajout d'un fond blanc explicite pour le bouton
  }
});

export default ModeSelector;
