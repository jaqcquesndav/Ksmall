import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, TextInput, Button, Card, HelperText, Divider } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import AppHeader from '../../components/common/AppHeader';
import InventoryService from '../../services/InventoryService';
import logger from '../../utils/logger';

const AddSupplierScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState(false);
  
  // État du formulaire
  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    paymentTerms: '',
    productCategories: '',
    notes: '',
  });
  
  // État des erreurs de validation
  const [errors, setErrors] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
  });
  
  // Fonction de validation du formulaire
  const validateForm = () => {
    let isValid = true;
    const newErrors = {
      name: '',
      contactPerson: '',
      phone: '',
      email: '',
    };
    
    // Validation du nom
    if (!formData.name.trim()) {
      newErrors.name = t('name_required');
      isValid = false;
    }
    
    // Validation du nom du contact
    if (!formData.contactPerson.trim()) {
      newErrors.contactPerson = t('contact_person_required');
      isValid = false;
    }
    
    // Validation du téléphone
    if (!formData.phone.trim()) {
      newErrors.phone = t('phone_required');
      isValid = false;
    }
    
    // Validation basique de l'email
    if (formData.email && !formData.email.includes('@')) {
      newErrors.email = t('invalid_email');
      isValid = false;
    }
    
    setErrors(newErrors);
    return isValid;
  };
  
  // Fonction de soumission du formulaire
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Créer un nouveau fournisseur avec un ID unique
      const newSupplierId = `s${Date.now()}`;
      const newSupplier = {
        id: newSupplierId,
        name: formData.name,
        contactPerson: formData.contactPerson,
        phone: formData.phone,
        email: formData.email,
        address: formData.address,
        paymentTerms: formData.paymentTerms,
        productCategories: formData.productCategories.split(',').map(cat => cat.trim()),
        notes: formData.notes,
      };
      
      // Ajouter le fournisseur
      await InventoryService.addSupplier(newSupplier);
      logger.info(`Nouveau fournisseur ajouté: ${newSupplier.name} (ID: ${newSupplierId})`);
      
      // Naviguer vers les détails du fournisseur
      navigation.navigate('SupplierDetails' as any, { supplierId: newSupplierId });
      
    } catch (error) {
      logger.error('Erreur lors de l\'ajout du fournisseur:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <View style={styles.container}>
      <AppHeader title={t('add_supplier')} showBack />
      
      <ScrollView style={styles.scrollView}>
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('general_information')}</Text>
              
              <TextInput
                label={t('supplier_name')}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                style={styles.input}
                error={!!errors.name}
              />
              {errors.name && <HelperText type="error">{errors.name}</HelperText>}
              
              <TextInput
                label={t('contact_person')}
                value={formData.contactPerson}
                onChangeText={(text) => setFormData({ ...formData, contactPerson: text })}
                style={styles.input}
                error={!!errors.contactPerson}
              />
              {errors.contactPerson && <HelperText type="error">{errors.contactPerson}</HelperText>}
            </View>
            
            <Divider style={styles.divider} />
            
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('contact_information')}</Text>
              
              <TextInput
                label={t('phone')}
                value={formData.phone}
                onChangeText={(text) => setFormData({ ...formData, phone: text })}
                style={styles.input}
                keyboardType="phone-pad"
                error={!!errors.phone}
              />
              {errors.phone && <HelperText type="error">{errors.phone}</HelperText>}
              
              <TextInput
                label={t('email')}
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                style={styles.input}
                keyboardType="email-address"
                error={!!errors.email}
              />
              {errors.email && <HelperText type="error">{errors.email}</HelperText>}
              
              <TextInput
                label={t('address')}
                value={formData.address}
                onChangeText={(text) => setFormData({ ...formData, address: text })}
                style={styles.input}
                multiline
                numberOfLines={2}
              />
            </View>
            
            <Divider style={styles.divider} />
            
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('business_details')}</Text>
              
              <TextInput
                label={t('payment_terms')}
                value={formData.paymentTerms}
                onChangeText={(text) => setFormData({ ...formData, paymentTerms: text })}
                style={styles.input}
                placeholder={t('payment_terms_example')}
              />
              
              <TextInput
                label={t('product_categories')}
                value={formData.productCategories}
                onChangeText={(text) => setFormData({ ...formData, productCategories: text })}
                style={styles.input}
                placeholder={t('comma_separated')}
              />
              
              <TextInput
                label={t('notes')}
                value={formData.notes}
                onChangeText={(text) => setFormData({ ...formData, notes: text })}
                style={styles.input}
                multiline
                numberOfLines={3}
              />
            </View>
          </Card.Content>
        </Card>
        
        <View style={styles.buttonContainer}>
          <Button
            mode="contained"
            onPress={handleSubmit}
            loading={isLoading}
            disabled={isLoading}
            style={styles.saveButton}
          >
            {t('save_supplier')}
          </Button>
          
          <Button
            mode="outlined"
            onPress={() => navigation.goBack()}
            disabled={isLoading}
            style={styles.cancelButton}
          >
            {t('cancel')}
          </Button>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  card: {
    margin: 16,
    marginBottom: 8,
  },
  section: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  input: {
    marginBottom: 12,
    backgroundColor: 'transparent',
  },
  divider: {
    marginVertical: 16,
  },
  buttonContainer: {
    margin: 16,
    marginTop: 8,
  },
  saveButton: {
    marginBottom: 12,
  },
  cancelButton: {
    marginBottom: 16,
  },
});

export default AddSupplierScreen;