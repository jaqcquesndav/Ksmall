# API de Gestion d'Inventaire

Ce document décrit les API de gestion d'inventaire utilisées dans l'application Ksmall.

## Vue d'ensemble

Les API de gestion d'inventaire permettent de gérer les produits, les stocks, les catégories, les fournisseurs et les mouvements de stock au sein de l'application.

## Endpoints

### 1. Ajouter un Produit

**Endpoint:** `POST /api/v1/inventory/products`

**Description:** Ajoute un nouveau produit à l'inventaire.

#### Requête

```json
{
  "name": "Smartphone XYZ Pro",
  "sku": "SM-XYZ-PRO-128",
  "barcode": "1234567890123",
  "description": "Smartphone haut de gamme avec processeur dernière génération",
  "categoryId": "category-uuid-1234",
  "brand": "XYZ Electronics",
  "costPrice": 250000.00,
  "sellingPrice": 349990.00,
  "wholesalePrice": 329990.00,
  "taxRate": 18.0,
  "quantity": 25,
  "minStockLevel": 5,
  "maxStockLevel": 50,
  "unit": "pièce",
  "weight": 0.25,
  "dimensions": {
    "length": 15.8,
    "width": 7.8,
    "height": 0.8
  },
  "attributes": [
    {
      "name": "Couleur",
      "value": "Noir"
    },
    {
      "name": "Stockage",
      "value": "128 GB"
    },
    {
      "name": "RAM",
      "value": "8 GB"
    }
  ],
  "images": [
    {
      "url": "https://storage.ksmall.com/products/smartphone-xyz-pro-front.jpg",
      "isPrimary": true
    },
    {
      "url": "https://storage.ksmall.com/products/smartphone-xyz-pro-back.jpg",
      "isPrimary": false
    }
  ],
  "suppliers": [
    {
      "supplierId": "supplier-uuid-5678",
      "supplierSku": "XYZ-128-BLK",
      "leadTime": 7
    }
  ],
  "isActive": true,
  "location": {
    "warehouse": "Entrepôt Principal",
    "section": "A",
    "shelf": "12",
    "bin": "3"
  },
  "expiryDate": "2027-04-25"
}
```

#### Réponse

```json
{
  "success": true,
  "statusCode": 201,
  "data": {
    "productId": "product-uuid-1234",
    "name": "Smartphone XYZ Pro",
    "sku": "SM-XYZ-PRO-128",
    "barcode": "1234567890123",
    "description": "Smartphone haut de gamme avec processeur dernière génération",
    "categoryId": "category-uuid-1234",
    "categoryName": "Smartphones",
    "brand": "XYZ Electronics",
    "costPrice": 250000.00,
    "sellingPrice": 349990.00,
    "wholesalePrice": 329990.00,
    "taxRate": 18.0,
    "quantity": 25,
    "availableQuantity": 25,
    "reservedQuantity": 0,
    "minStockLevel": 5,
    "maxStockLevel": 50,
    "unit": "pièce",
    "weight": 0.25,
    "dimensions": {
      "length": 15.8,
      "width": 7.8,
      "height": 0.8
    },
    "attributes": [
      {
        "name": "Couleur",
        "value": "Noir"
      },
      {
        "name": "Stockage",
        "value": "128 GB"
      },
      {
        "name": "RAM",
        "value": "8 GB"
      }
    ],
    "images": [
      {
        "id": "image-uuid-1",
        "url": "https://storage.ksmall.com/products/smartphone-xyz-pro-front.jpg",
        "isPrimary": true
      },
      {
        "id": "image-uuid-2",
        "url": "https://storage.ksmall.com/products/smartphone-xyz-pro-back.jpg",
        "isPrimary": false
      }
    ],
    "suppliers": [
      {
        "supplierId": "supplier-uuid-5678",
        "supplierName": "XYZ Distribution",
        "supplierSku": "XYZ-128-BLK",
        "leadTime": 7
      }
    ],
    "isActive": true,
    "createdAt": "2025-04-25T14:30:00Z",
    "createdBy": "user-uuid-1234",
    "location": {
      "warehouse": "Entrepôt Principal",
      "section": "A",
      "shelf": "12",
      "bin": "3"
    },
    "expiryDate": "2027-04-25",
    "stockStatus": "NORMAL",
    "qrCodeUrl": "https://storage.ksmall.com/products/qr/SM-XYZ-PRO-128.png"
  },
  "message": "Produit créé avec succès"
}
```

### 2. Récupérer un Produit

**Endpoint:** `GET /api/v1/inventory/products/{productId}`

**Description:** Récupère les détails d'un produit spécifique.

#### Requête

*Nécessite un token d'authentification dans l'en-tête*

#### Paramètres de requête

- `includeTransactions` (optionnel, défaut=false): Inclure l'historique des transactions
- `includeSales` (optionnel, défaut=false): Inclure l'historique des ventes

#### Réponse

```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "productId": "product-uuid-1234",
    "name": "Smartphone XYZ Pro",
    "sku": "SM-XYZ-PRO-128",
    "barcode": "1234567890123",
    "description": "Smartphone haut de gamme avec processeur dernière génération",
    "categoryId": "category-uuid-1234",
    "categoryName": "Smartphones",
    "brand": "XYZ Electronics",
    "costPrice": 250000.00,
    "sellingPrice": 349990.00,
    "wholesalePrice": 329990.00,
    "profit": 99990.00,
    "profitMargin": 28.57,
    "taxRate": 18.0,
    "quantity": 25,
    "availableQuantity": 25,
    "reservedQuantity": 0,
    "minStockLevel": 5,
    "maxStockLevel": 50,
    "unit": "pièce",
    "weight": 0.25,
    "dimensions": {
      "length": 15.8,
      "width": 7.8,
      "height": 0.8
    },
    "attributes": [
      {
        "name": "Couleur",
        "value": "Noir"
      },
      {
        "name": "Stockage",
        "value": "128 GB"
      },
      {
        "name": "RAM",
        "value": "8 GB"
      }
    ],
    "images": [
      {
        "id": "image-uuid-1",
        "url": "https://storage.ksmall.com/products/smartphone-xyz-pro-front.jpg",
        "isPrimary": true
      },
      {
        "id": "image-uuid-2",
        "url": "https://storage.ksmall.com/products/smartphone-xyz-pro-back.jpg",
        "isPrimary": false
      }
    ],
    "suppliers": [
      {
        "supplierId": "supplier-uuid-5678",
        "supplierName": "XYZ Distribution",
        "supplierSku": "XYZ-128-BLK",
        "leadTime": 7
      }
    ],
    "isActive": true,
    "createdAt": "2025-04-25T14:30:00Z",
    "createdBy": "user-uuid-1234",
    "updatedAt": "2025-04-25T14:30:00Z",
    "updatedBy": "user-uuid-1234",
    "location": {
      "warehouse": "Entrepôt Principal",
      "section": "A",
      "shelf": "12",
      "bin": "3"
    },
    "expiryDate": "2027-04-25",
    "stockStatus": "NORMAL",
    "qrCodeUrl": "https://storage.ksmall.com/products/qr/SM-XYZ-PRO-128.png",
    "salesStats": {
      "lastSaleDate": "2025-04-24T10:15:00Z",
      "totalSalesQuantity": 5,
      "totalSalesAmount": 1749950.00,
      "averageSalesPerDay": 0.5,
      "estimatedStockDuration": 50
    }
  },
  "message": "Produit récupéré avec succès"
}
```

### 3. Lister les Produits

**Endpoint:** `GET /api/v1/inventory/products`

**Description:** Récupère une liste paginée des produits selon les filtres appliqués.

#### Paramètres de requête

- `categoryId` (optionnel): Filtrer par catégorie
- `brand` (optionnel): Filtrer par marque
- `searchTerm` (optionnel): Recherche dans le nom, SKU, code-barres, description
- `minPrice` (optionnel): Prix de vente minimum
- `maxPrice` (optionnel): Prix de vente maximum
- `stockStatus` (optionnel): État du stock (in_stock, low_stock, out_of_stock, overstock)
- `sortBy` (optionnel, défaut=name): Champ de tri (name, price, quantity, created_at)
- `sortOrder` (optionnel, défaut=asc): Direction du tri (asc, desc)
- `page` (optionnel, défaut=1): Numéro de page
- `limit` (optionnel, défaut=20): Nombre d'éléments par page

#### Réponse

```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "products": [
      {
        "productId": "product-uuid-1234",
        "name": "Smartphone XYZ Pro",
        "sku": "SM-XYZ-PRO-128",
        "barcode": "1234567890123",
        "categoryName": "Smartphones",
        "brand": "XYZ Electronics",
        "sellingPrice": 349990.00,
        "quantity": 25,
        "availableQuantity": 25,
        "reservedQuantity": 0,
        "stockStatus": "NORMAL",
        "imageUrl": "https://storage.ksmall.com/products/smartphone-xyz-pro-front.jpg",
        "isActive": true
      },
      {
        "productId": "product-uuid-5678",
        "name": "Écouteurs Bluetooth ABC",
        "sku": "EB-ABC-100",
        "barcode": "9876543210987",
        "categoryName": "Accessoires Audio",
        "brand": "ABC Sound",
        "sellingPrice": 29990.00,
        "quantity": 50,
        "availableQuantity": 47,
        "reservedQuantity": 3,
        "stockStatus": "NORMAL",
        "imageUrl": "https://storage.ksmall.com/products/ecouteurs-abc.jpg",
        "isActive": true
      }
    ],
    "stockSummary": {
      "totalProducts": 45,
      "totalValue": 12500000.00,
      "productsInStock": 40,
      "productsOutOfStock": 5,
      "productsLowStock": 3,
      "productsOverstock": 2
    }
  },
  "pagination": {
    "totalItems": 45,
    "totalPages": 3,
    "currentPage": 1,
    "itemsPerPage": 20
  },
  "message": "Produits récupérés avec succès"
}
```

### 4. Mettre à jour le Stock

**Endpoint:** `POST /api/v1/inventory/stock-transactions`

**Description:** Enregistre une transaction d'inventaire pour ajuster le stock d'un produit.

#### Requête

```json
{
  "productId": "product-uuid-1234",
  "type": "purchase|sale|return|adjustment|transfer|loss|sample",
  "quantity": 10,
  "reference": "BON-2025-0123",
  "date": "2025-04-25T15:00:00Z",
  "notes": "Réception de marchandises du fournisseur XYZ",
  "costPrice": 250000.00,
  "supplierId": "supplier-uuid-5678",
  "locationFrom": {
    "warehouse": "Fournisseur",
    "section": "",
    "shelf": "",
    "bin": ""
  },
  "locationTo": {
    "warehouse": "Entrepôt Principal",
    "section": "A",
    "shelf": "12",
    "bin": "3"
  },
  "attachments": [
    {
      "type": "invoice",
      "url": "https://storage.ksmall.com/inventory/invoices/INV-SUP-123.pdf"
    },
    {
      "type": "delivery_note",
      "url": "https://storage.ksmall.com/inventory/delivery-notes/DN-123.pdf"
    }
  ]
}
```

#### Réponse

```json
{
  "success": true,
  "statusCode": 201,
  "data": {
    "transactionId": "inv-transaction-uuid-1234",
    "productId": "product-uuid-1234",
    "productName": "Smartphone XYZ Pro",
    "productSku": "SM-XYZ-PRO-128",
    "type": "purchase",
    "quantity": 10,
    "previousQuantity": 25,
    "newQuantity": 35,
    "reference": "BON-2025-0123",
    "date": "2025-04-25T15:00:00Z",
    "notes": "Réception de marchandises du fournisseur XYZ",
    "costPrice": 250000.00,
    "totalCost": 2500000.00,
    "supplierId": "supplier-uuid-5678",
    "supplierName": "XYZ Distribution",
    "locationFrom": {
      "warehouse": "Fournisseur",
      "section": "",
      "shelf": "",
      "bin": ""
    },
    "locationTo": {
      "warehouse": "Entrepôt Principal",
      "section": "A",
      "shelf": "12",
      "bin": "3"
    },
    "createdAt": "2025-04-25T15:05:00Z",
    "createdBy": "user-uuid-1234",
    "attachments": [
      {
        "type": "invoice",
        "url": "https://storage.ksmall.com/inventory/invoices/INV-SUP-123.pdf"
      },
      {
        "type": "delivery_note",
        "url": "https://storage.ksmall.com/inventory/delivery-notes/DN-123.pdf"
      }
    ]
  },
  "message": "Transaction de stock créée avec succès"
}
```

### 5. Effectuer un Inventaire

**Endpoint:** `POST /api/v1/inventory/stock-counts`

**Description:** Enregistre un comptage de stock et les ajustements nécessaires.

#### Requête

```json
{
  "name": "Inventaire trimestriel - T2 2025",
  "date": "2025-04-25",
  "warehouseId": "warehouse-uuid-1234",
  "notes": "Inventaire réalisé par l'équipe A",
  "items": [
    {
      "productId": "product-uuid-1234",
      "expectedQuantity": 35,
      "actualQuantity": 34,
      "notes": "1 unité manquante"
    },
    {
      "productId": "product-uuid-5678",
      "expectedQuantity": 50,
      "actualQuantity": 48,
      "notes": "2 unités endommagées"
    }
  ],
  "attachments": [
    {
      "type": "stock_count_sheet",
      "url": "https://storage.ksmall.com/inventory/stock-counts/sheet-q2-2025.pdf"
    },
    {
      "type": "photos",
      "url": "https://storage.ksmall.com/inventory/stock-counts/photos-q2-2025.zip"
    }
  ]
}
```

#### Réponse

```json
{
  "success": true,
  "statusCode": 201,
  "data": {
    "stockCountId": "stock-count-uuid-1234",
    "name": "Inventaire trimestriel - T2 2025",
    "date": "2025-04-25",
    "warehouseId": "warehouse-uuid-1234",
    "warehouseName": "Entrepôt Principal",
    "status": "completed",
    "totalItems": 2,
    "totalDiscrepancies": 2,
    "totalValueAdjusted": 775000.00,
    "notes": "Inventaire réalisé par l'équipe A",
    "items": [
      {
        "productId": "product-uuid-1234",
        "productName": "Smartphone XYZ Pro",
        "productSku": "SM-XYZ-PRO-128",
        "expectedQuantity": 35,
        "actualQuantity": 34,
        "discrepancy": -1,
        "costPrice": 250000.00,
        "valueAdjusted": -250000.00,
        "notes": "1 unité manquante",
        "adjustmentStatus": "adjusted"
      },
      {
        "productId": "product-uuid-5678",
        "productName": "Écouteurs Bluetooth ABC",
        "productSku": "EB-ABC-100",
        "expectedQuantity": 50,
        "actualQuantity": 48,
        "discrepancy": -2,
        "costPrice": 12500.00,
        "valueAdjusted": -25000.00,
        "notes": "2 unités endommagées",
        "adjustmentStatus": "adjusted"
      }
    ],
    "createdAt": "2025-04-25T16:30:00Z",
    "createdBy": "user-uuid-1234",
    "completedAt": "2025-04-25T17:15:00Z",
    "attachments": [
      {
        "type": "stock_count_sheet",
        "url": "https://storage.ksmall.com/inventory/stock-counts/sheet-q2-2025.pdf"
      },
      {
        "type": "photos",
        "url": "https://storage.ksmall.com/inventory/stock-counts/photos-q2-2025.zip"
      }
    ],
    "adjustmentTransactions": [
      {
        "transactionId": "inv-transaction-uuid-8765",
        "productId": "product-uuid-1234",
        "type": "adjustment",
        "quantity": -1,
        "reference": "SC-2025-Q2",
        "date": "2025-04-25T17:15:00Z"
      },
      {
        "transactionId": "inv-transaction-uuid-9876",
        "productId": "product-uuid-5678",
        "type": "adjustment",
        "quantity": -2,
        "reference": "SC-2025-Q2",
        "date": "2025-04-25T17:15:00Z"
      }
    ]
  },
  "message": "Comptage de stock enregistré avec succès"
}
```

### 6. Consulter les Statistiques d'Inventaire

**Endpoint:** `GET /api/v1/inventory/statistics`

**Description:** Récupère les statistiques et analyses d'inventaire.

#### Paramètres de requête

- `startDate` (optionnel): Date de début de la période
- `endDate` (optionnel): Date de fin de la période
- `warehouseId` (optionnel): Filtre par entrepôt
- `categoryId` (optionnel): Filtre par catégorie

#### Réponse

```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "inventoryValue": {
      "total": 12500000.00,
      "byCategory": [
        {
          "categoryId": "category-uuid-1234",
          "categoryName": "Smartphones",
          "value": 8750000.00,
          "percentage": 70.00
        },
        {
          "categoryId": "category-uuid-2345",
          "categoryName": "Accessoires Audio",
          "value": 2500000.00,
          "percentage": 20.00
        },
        {
          "categoryId": "category-uuid-3456",
          "categoryName": "Tablettes",
          "value": 1250000.00,
          "percentage": 10.00
        }
      ],
      "byWarehouse": [
        {
          "warehouseId": "warehouse-uuid-1234",
          "warehouseName": "Entrepôt Principal",
          "value": 10000000.00,
          "percentage": 80.00
        },
        {
          "warehouseId": "warehouse-uuid-2345",
          "warehouseName": "Entrepôt Secondaire",
          "value": 2500000.00,
          "percentage": 20.00
        }
      ]
    },
    "stockStatus": {
      "normal": {
        "count": 35,
        "percentage": 77.78,
        "value": 9500000.00
      },
      "lowStock": {
        "count": 5,
        "percentage": 11.11,
        "value": 1500000.00
      },
      "outOfStock": {
        "count": 3,
        "percentage": 6.67,
        "value": 0
      },
      "overstock": {
        "count": 2,
        "percentage": 4.44,
        "value": 1500000.00
      }
    },
    "trends": {
      "inventoryValue": [
        {
          "date": "2025-01",
          "value": 10500000.00
        },
        {
          "date": "2025-02",
          "value": 11000000.00
        },
        {
          "date": "2025-03",
          "value": 11750000.00
        },
        {
          "date": "2025-04",
          "value": 12500000.00
        }
      ],
      "stockTurnover": 4.8,
      "daysInventory": 76
    },
    "topProducts": {
      "byValue": [
        {
          "productId": "product-uuid-1234",
          "productName": "Smartphone XYZ Pro",
          "quantity": 35,
          "value": 8750000.00
        }
      ],
      "byQuantity": [
        {
          "productId": "product-uuid-5678",
          "productName": "Écouteurs Bluetooth ABC",
          "quantity": 48,
          "value": 600000.00
        }
      ]
    },
    "purchasesForecast": {
      "nextWeek": [
        {
          "productId": "product-uuid-9012",
          "productName": "Chargeur Rapide 65W",
          "currentQuantity": 5,
          "recommendedPurchaseQuantity": 20,
          "estimatedCost": 400000.00,
          "supplierId": "supplier-uuid-5678",
          "leadTime": 5
        }
      ]
    }
  },
  "message": "Statistiques d'inventaire récupérées avec succès"
}
```

## Codes d'erreur et messages

| Code | Message | Description |
|------|---------|-------------|
| 400 | "Données de produit invalides" | Les données fournies pour le produit ne sont pas valides |
| 401 | "Non autorisé" | Authentification requise |
| 403 | "Accès refusé" | Pas assez de permissions pour accéder à cette ressource |
| 404 | "Produit non trouvé" | Le produit demandé n'existe pas |
| 409 | "SKU ou code-barres en double" | Un produit avec le même SKU ou code-barres existe déjà |
| 422 | "Stock insuffisant" | Stock insuffisant pour l'opération demandée |
| 500 | "Erreur serveur lors de la gestion d'inventaire" | Erreur interne du serveur |

## Bonnes pratiques de gestion d'inventaire

1. Effectuer des inventaires réguliers pour réconcilier les écarts entre les quantités attendues et réelles
2. Surveiller les produits à faible stock pour anticiper les ruptures
3. Analyser la rotation des stocks pour optimiser les commandes
4. Documenter les mouvements de stock avec des références et pièces justificatives
5. Configurer des niveaux minimum et maximum de stock pour chaque produit
6. Utiliser les codes-barres ou QR codes pour accélérer les opérations d'inventaire