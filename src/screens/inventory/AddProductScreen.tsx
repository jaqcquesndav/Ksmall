import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { 
  Text, TextInput, Button, SegmentedButtons, 
  Divider, List, HelperText, Card
} from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { MainStackParamList } from '../../navigation/types';
import AppHeader from '../../components/common/AppHeader';
import { inventoryMockData } from '../../data/mockData';

type AddProductRouteProp = RouteProp<MainStackParamList, 'AddProduct'>;

interface ProductFormData {
  name: string;
  sku: string;
  description: string;
  category: string;
  subcategory: string;
  cost: string;
  price: string;
  quantity: string;
  reorderPoint: string;
  supplier: string;
  location: string;
  imageUrl: string | null;
}

const AddProductScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<AddProductRouteProp>();
  const productId = route.params?.productId;
  const categoryId = route.params?.categoryId;

  const { t } = useTranslation();
  
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    sku: '',
    description: '',
    category: '',
    subcategory: '',
    cost: '',
    price: '',
    quantity: '',
    reorderPoint: '',
    supplier: '',
    location: '',
    imageUrl: null
  });
  
  const [errors, setErrors] = useState<Partial<Record<keyof ProductFormData, string>>>({});
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  const categories = inventoryMockData.categories;
  const suppliers = inventoryMockData.suppliers;
  
  const handleImagePick = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      alert(t('permission_required'));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets[0]) {
      setFormData({ ...formData, imageUrl: result.assets[0].uri });
    }
  };
  
  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof ProductFormData, string>> = {};
    
    if (!formData.name) {
      newErrors.name = t('name_required');
    }
    
    if (!formData.sku) {
      newErrors.sku = t('sku_required');
    }
    
    if (!formData.cost) {
      newErrors.cost = t('cost_required');
    } else if (isNaN(parseFloat(formData.cost))) {
      newErrors.cost = t('invalid_number');
    }
    
    if (!formData.price) {
      newErrors.price = t('price_required');
    } else if (isNaN(parseFloat(formData.price))) {
      newErrors.price = t('invalid_number');
    }
    
    if (!formData.quantity) {
      newErrors.quantity = t('quantity_required');
    } else if (isNaN(parseInt(formData.quantity))) {
      newErrors.quantity = t('invalid_integer');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSave = () => {
    if (validateForm()) {
      // In a real app, save data to database
      // For this demo, just navigate back
      navigation.goBack();
    }
  };

  return (
    <View style={styles.container}>
      <AppHeader title={t('add_product')} showBack />
      
      <ScrollView style={styles.scrollView}>
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.section}>
              <TouchableOpacity style={styles.imageContainer} onPress={handleImagePick}>
                {formData.imageUrl ? (
                  <Image source={{ uri: formData.imageUrl }} style={styles.productImage} />
                ) : (
                  <View style={[styles.productImage, styles.imagePlaceholder]}>
                    <Text style={styles.imagePlaceholderText}>{t('add_image')}</Text>
                  </View>
                )}
              </TouchableOpacity>
              
              <TextInput
                label={t('product_name')}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                style={styles.input}
                error={!!errors.name}
              />
              {errors.name && <HelperText type="error">{errors.name}</HelperText>}
              
              <TextInput
                label={t('sku')}
                value={formData.sku}
                onChangeText={(text) => setFormData({ ...formData, sku: text })}
                style={styles.input}
                error={!!errors.sku}
              />
              {errors.sku && <HelperText type="error">{errors.sku}</HelperText>}
              
              <TextInput
                label={t('description')}
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                style={styles.input}
                multiline
                numberOfLines={3}
              />
            </View>
            
            <Divider style={styles.divider} />
            
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('categorization')}</Text>
              
              <List.Accordion
                title={formData.category || t('select_category')}
                expanded={selectedCategory === 'category'}
                onPress={() => setSelectedCategory(selectedCategory === 'category' ? null : 'category')}
                style={styles.accordion}
              >
                {categories.map((category) => (
                  <List.Item
                    key={category.id}
                    title={category.name}
                    onPress={() => {
                      setFormData({ ...formData, category: category.name, subcategory: '' });
                      setSelectedCategory(null);
                    }}
                  />
                ))}
              </List.Accordion>
              
              <List.Accordion
                title={formData.subcategory || t('select_subcategory')}
                expanded={selectedCategory === 'subcategory'}
                onPress={() => setSelectedCategory(selectedCategory === 'subcategory' ? null : 'subcategory')}
                style={styles.accordion}
              >
                {formData.category && categories
                  .find(c => c.name === formData.category)
                  ?.subcategories.map((subcat, index) => (
                    <List.Item
                      key={index}
                      title={subcat}
                      onPress={() => {
                        setFormData({ ...formData, subcategory: subcat });
                        setSelectedCategory(null);
                      }}
                    />
                  ))
                }
              </List.Accordion>
            </View>
            
            <Divider style={styles.divider} />
            
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('pricing_and_inventory')}</Text>
              
              <View style={styles.row}>
                <TextInput
                  label={t('cost_price')}
                  value={formData.cost}
                  onChangeText={(text) => setFormData({ ...formData, cost: text })}
                  keyboardType="numeric"
                  style={[styles.input, styles.halfInput]}
                  left={<TextInput.Affix text="$" />}
                  error={!!errors.cost}
                />
                <TextInput
                  label={t('selling_price')}
                  value={formData.price}
                  onChangeText={(text) => setFormData({ ...formData, price: text })}
                  keyboardType="numeric"
                  style={[styles.input, styles.halfInput]}
                  left={<TextInput.Affix text="$" />}
                  error={!!errors.price}
                />
              </View>
              {(errors.cost || errors.price) && (
                <HelperText type="error">{errors.cost || errors.price}</HelperText>
              )}
              
              <View style={styles.row}>
                <TextInput
                  label={t('initial_quantity')}
                  value={formData.quantity}
                  onChangeText={(text) => setFormData({ ...formData, quantity: text })}
                  keyboardType="numeric"
                  style={[styles.input, styles.halfInput]}
                  error={!!errors.quantity}
                />
                <TextInput
                  label={t('reorder_point')}
                  value={formData.reorderPoint}
                  onChangeText={(text) => setFormData({ ...formData, reorderPoint: text })}
                  keyboardType="numeric"
                  style={[styles.input, styles.halfInput]}
                />
              </View>
              {errors.quantity && <HelperText type="error">{errors.quantity}</HelperText>}
            </View>
            
            <Divider style={styles.divider} />
            
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('supplier_and_location')}</Text>
              
              <List.Accordion
                title={formData.supplier || t('select_supplier')}
                expanded={selectedCategory === 'supplier'}
                onPress={() => setSelectedCategory(selectedCategory === 'supplier' ? null : 'supplier')}
                style={styles.accordion}
              >
                {suppliers.map((supplier) => (
                  <List.Item
                    key={supplier.id}
                    title={supplier.name}
                    description={supplier.contactPerson}
                    onPress={() => {
                      setFormData({ ...formData, supplier: supplier.name });
                      setSelectedCategory(null);
                    }}
                  />
                ))}
              </List.Accordion>
              
              <SegmentedButtons
                value={formData.location || ''}
                onValueChange={(value) => setFormData({ ...formData, location: value })}
                buttons={[
                  { value: 'Warehouse A', label: 'Warehouse A' },
                  { value: 'Warehouse B', label: 'Warehouse B' },
                  { value: 'Warehouse C', label: 'Warehouse C' }
                ]}
                style={styles.segmentedButtons}
              />
            </View>
          </Card.Content>
        </Card>
        
        <View style={styles.buttonContainer}>
          <Button 
            mode="contained" 
            onPress={handleSave}
            style={styles.saveButton}
          >
            {t('save_product')}
          </Button>
          <Button 
            mode="outlined" 
            onPress={() => navigation.goBack()}
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
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  divider: {
    marginVertical: 16,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  productImage: {
    width: 120,
    height: 120,
    borderRadius: 8,
    marginBottom: 8,
  },
  imagePlaceholder: {
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    color: '#757575',
  },
  input: {
    marginBottom: 12,
    backgroundColor: 'transparent',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    width: '48%',
  },
  accordion: {
    paddingHorizontal: 0,
    backgroundColor: 'transparent',
  },
  segmentedButtons: {
    marginTop: 12,
  },
  buttonContainer: {
    margin: 16,
    marginTop: 0,
  },
  saveButton: {
    marginBottom: 12,
    backgroundColor: '#6200EE',
  },
  cancelButton: {
    marginBottom: 24,
  },
});

export default AddProductScreen;
