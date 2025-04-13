import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { TextInput, Button, HelperText } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { CompanyInfo } from '../../services/CompanyService'; // Chemin corrigé

interface CompanyInfoFormProps {
  initialValues?: CompanyInfo;
  onSubmit: (values: CompanyInfo) => void;
  onCancel: () => void;
}

const CompanyInfoForm: React.FC<CompanyInfoFormProps> = ({
  initialValues,
  onSubmit,
  onCancel
}) => {
  const { t } = useTranslation();
  const [formValues, setFormValues] = useState<CompanyInfo>({
    name: initialValues?.name || '',
    address: initialValues?.address || '',
    registrationNumber: initialValues?.registrationNumber || '',
    taxId: initialValues?.taxId || '',
    phone: initialValues?.phone || '',
    email: initialValues?.email || '',
    logo: initialValues?.logo || ''
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const handleChange = (field: keyof CompanyInfo, value: string) => {
    setFormValues(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user changes the value
    if (errors[field as string]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };
  
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formValues.name) {
      newErrors.name = t('field_required');
    }
    
    if (!formValues.address) {
      newErrors.address = t('field_required');
    }
    
    if (!formValues.registrationNumber) {
      newErrors.registrationNumber = t('field_required');
    }
    
    if (!formValues.taxId) {
      newErrors.taxId = t('field_required');
    }
    
    if (formValues.email && !/\S+@\S+\.\S+/.test(formValues.email)) {
      newErrors.email = t('invalid_email');
    }
    
    setErrors(newErrors);
    
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = () => {
    if (validateForm()) {
      onSubmit(formValues);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <TextInput
        label={t('company_name')}
        value={formValues.name}
        onChangeText={(value) => handleChange('name', value)}
        style={styles.input}
        error={!!errors.name}
      />
      {errors.name && <HelperText type="error">{errors.name}</HelperText>}
      
      <TextInput
        label={t('address')}
        value={formValues.address}
        onChangeText={(value) => handleChange('address', value)}
        style={styles.input}
        error={!!errors.address}
        multiline
      />
      {errors.address && <HelperText type="error">{errors.address}</HelperText>}
      
      <TextInput
        label={t('registration_number')}
        value={formValues.registrationNumber}
        onChangeText={(value) => handleChange('registrationNumber', value)}
        style={styles.input}
        error={!!errors.registrationNumber}
        placeholder="RCCM"
      />
      {errors.registrationNumber && <HelperText type="error">{errors.registrationNumber}</HelperText>}
      
      <TextInput
        label={t('tax_id')}
        value={formValues.taxId}
        onChangeText={(value) => handleChange('taxId', value)}
        style={styles.input}
        error={!!errors.taxId}
        placeholder="NIF"
      />
      {errors.taxId && <HelperText type="error">{errors.taxId}</HelperText>}
      
      <TextInput
        label={t('phone')}
        value={formValues.phone}
        onChangeText={(value) => handleChange('phone', value)}
        style={styles.input}
        keyboardType="phone-pad"
      />
      
      <TextInput
        label={t('email')}
        value={formValues.email}
        onChangeText={(value) => handleChange('email', value)}
        style={styles.input}
        error={!!errors.email}
        keyboardType="email-address"
      />
      {errors.email && <HelperText type="error">{errors.email}</HelperText>}
      
      <View style={styles.buttonContainer}>
        <Button onPress={onCancel} style={styles.button}>
          {t('cancel')}
        </Button>
        <Button mode="contained" onPress={handleSubmit} style={styles.button}>
          {t('save')}
        </Button>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  input: {
    marginBottom: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  button: {
    marginLeft: 8,
  },
});

export default CompanyInfoForm;
