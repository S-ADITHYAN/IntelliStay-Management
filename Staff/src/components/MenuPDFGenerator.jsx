import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';
import QRCode from 'qrcode';

const styles = StyleSheet.create({
  page: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    padding: 30,
  },
  section: {
    margin: 10,
    padding: 10,
    flexGrow: 1,
  },
  menuItem: {
    marginBottom: 20,
    borderBottom: '1px solid #ccc',
    paddingBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemDetails: {
    flex: 1,
    marginRight: 20,
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    color: '#1a237e',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  dishName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  description: {
    fontSize: 12,
    marginBottom: 5,
    color: '#666',
  },
  price: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2e7d32',
  },
  qrCode: {
    width: 80,
    height: 80,
  },
  category: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 10,
    color: '#1a237e',
    backgroundColor: '#f5f5f5',
    padding: 5,
  },
  nutritionInfo: {
    fontSize: 10,
    color: '#666',
    marginTop: 5,
  },
  foodType: {
    fontSize: 10,
    marginTop: 2,
    padding: 3,
    borderRadius: 3,
    backgroundColor: '#e8f5e9',
    color: '#2e7d32',
    alignSelf: 'flex-start',
  },
  qrCodeContainer: {
    alignItems: 'center',
  },
  scanText: {
    fontSize: 8,
    color: '#666',
    textAlign: 'center',
    marginTop: 2,
  },
  header: {
    marginBottom: 30,
    borderBottom: '2px solid #1a237e',
    paddingBottom: 10,
  },
  restaurantInfo: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 5,
  }
});

const MenuPDFDocument = ({ menuItems }) => {
  const generateQRCode = async (item) => {
    try {
      if (!item || !item._id) {
        console.error('Invalid item data:', item);
        return null;
      }

      // Construct a shorter URL
      const baseUrl = window.location.origin;
      const arViewUrl = `${baseUrl}/ar/${item._id}`;

      // QR Code options with higher version and error correction
      const qrOptions = {
        version: 8, // Increased version to handle more data
        errorCorrectionLevel: 'M', // Medium error correction
        margin: 1,
        width: 300,
        color: {
          dark: '#1a237e',
          light: '#ffffff',
        },
        maskPattern: 0, // Add mask pattern for better scanning
      };

      // Generate QR code with better error handling
      try {
        const qrCodeDataURL = await QRCode.toDataURL(arViewUrl, qrOptions);
        console.log('Successfully generated QR code for:', arViewUrl);
        return qrCodeDataURL;
      } catch (qrError) {
        // Try again with higher version if first attempt fails
        qrOptions.version = 10;
        const qrCodeDataURL = await QRCode.toDataURL(arViewUrl, qrOptions);
        console.log('Successfully generated QR code with higher version for:', arViewUrl);
        return qrCodeDataURL;
      }

    } catch (error) {
      console.error('Error generating QR code:', error);
      console.error('Item details:', item);
      console.error('Current origin:', window.location.origin);
      
      // Return a fallback QR code or null
      try {
        // Generate a minimal QR code with just the ID
        const fallbackUrl = `${window.location.origin}/ar/${item._id}`;
        return await QRCode.toDataURL(fallbackUrl, {
          version: 4,
          errorCorrectionLevel: 'L',
          margin: 1,
          width: 300,
        });
      } catch (fallbackError) {
        console.error('Fallback QR code generation failed:', fallbackError);
        return null;
      }
    }
  };

  // Group items by category
  const groupByCategory = (items) => {
    return items.reduce((acc, item) => {
      const category = item.category || 'Other';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(item);
      return acc;
    }, {});
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.section}>
          <View style={styles.header}>
            <Text style={styles.title}>Digital AR Menu</Text>
            <Text style={styles.restaurantInfo}>
              Scan QR codes to view dishes in Augmented Reality
            </Text>
          </View>

          {Object.entries(groupByCategory(menuItems)).map(([category, items]) => (
            <View key={category}>
              <Text style={styles.category}>{category}</Text>
              {items.map((item) => (
                <View key={item._id} style={styles.menuItem}>
                  <View style={styles.itemDetails}>
                    <Text style={styles.dishName}>{item.name}</Text>
                    <Text style={styles.description}>{item.description}</Text>
                    <Text style={styles.price}>₹{item.price.toFixed(2)}</Text>
                    
                    {/* Food Type Indicator */}
                    <Text style={styles.foodType}>
                      {item.foodType || 'Veg'}
                    </Text>

                    {/* Nutrition Information */}
                    <View style={styles.nutritionInfo}>
                      <Text>Calories: {item.calories || '266'} kcal</Text>
                      <Text>Protein: {item.protein || '12'}g • Carbs: {item.carbs || '34'}g • Fat: {item.fat || '12'}g</Text>
                      {item.spicyLevel && (
                        <Text>Spicy Level: {item.spicyLevel}</Text>
                      )}
                    </View>
                  </View>

                  <View style={styles.qrCodeContainer}>
                    <Image
                      style={styles.qrCode}
                      source={generateQRCode(item)}
                    />
                    <Text style={styles.scanText}>Scan for AR View</Text>
                  </View>
                </View>
              ))}
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
};

export default MenuPDFDocument; 