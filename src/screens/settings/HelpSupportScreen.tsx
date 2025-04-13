import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Linking } from 'react-native';
import { 
  List, 
  Text, 
  Button, 
  TextInput,
  Card,
  Divider
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import AppHeader from '../../components/common/AppHeader';

const HelpSupportScreen = () => {
  const { t } = useTranslation();
  const [message, setMessage] = useState('');
  
  const handleSendFeedback = () => {
    alert(t('feedback_sent'));
    setMessage('');
  };
  
  const handleOpenDocumentation = () => {
    Linking.openURL('https://ksmall.app/docs');
  };
  
  const handleContactSupport = () => {
    Linking.openURL('mailto:support@ksmall.app');
  };

  return (
    <View style={styles.container}>
      <AppHeader 
        title={t('help_and_support')} 
        showBack
      />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card style={styles.card}>
          <Card.Title title={t('documentation')} />
          <Card.Content>
            <Text style={styles.cardText}>{t('documentation_description')}</Text>
          </Card.Content>
          <Card.Actions>
            <Button onPress={handleOpenDocumentation}>{t('view_documentation')}</Button>
          </Card.Actions>
        </Card>
        
        <Card style={styles.card}>
          <Card.Title title={t('faqs')} />
          <Card.Content>
            <List.Accordion title={t('what_is_ksmall')}>
              <Text style={styles.faqAnswer}>{t('what_is_ksmall_answer')}</Text>
            </List.Accordion>
            <Divider />
            
            <List.Accordion title={t('how_to_create_transaction')}>
              <Text style={styles.faqAnswer}>{t('how_to_create_transaction_answer')}</Text>
            </List.Accordion>
            <Divider />
            
            <List.Accordion title={t('ai_assistant_usage')}>
              <Text style={styles.faqAnswer}>{t('ai_assistant_usage_answer')}</Text>
            </List.Accordion>
          </Card.Content>
        </Card>
        
        <Card style={styles.card}>
          <Card.Title title={t('contact_support')} />
          <Card.Content>
            <Text style={styles.cardText}>{t('contact_support_description')}</Text>
            <Button 
              mode="contained" 
              style={styles.contactButton} 
              onPress={handleContactSupport}
            >
              {t('email_support')}
            </Button>
          </Card.Content>
        </Card>
        
        <Card style={styles.card}>
          <Card.Title title={t('send_feedback')} />
          <Card.Content>
            <TextInput
              label={t('your_feedback')}
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={4}
              style={styles.feedbackInput}
            />
            <Button 
              mode="contained" 
              onPress={handleSendFeedback}
              disabled={!message.trim()}
              style={styles.sendButton}
            >
              {t('send_feedback')}
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    marginBottom: 16,
  },
  cardText: {
    marginBottom: 16,
  },
  faqAnswer: {
    padding: 16,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 16,
  },
  contactButton: {
    marginTop: 16,
  },
  feedbackInput: {
    marginBottom: 16,
    backgroundColor: 'transparent',
  },
  sendButton: {
    alignSelf: 'flex-end',
  }
});

export default HelpSupportScreen;
