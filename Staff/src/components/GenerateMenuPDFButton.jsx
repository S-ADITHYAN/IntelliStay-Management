import React from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import MenuPDFDocument from './MenuPDFGenerator';

const GenerateMenuPDFButton = ({ menuItems }) => {
  return (
    <PDFDownloadLink
      document={<MenuPDFDocument menuItems={menuItems} />}
      fileName="ar-menu.pdf"
    >
      {({ blob, url, loading, error }) => 
        loading ? 'Generating PDF...' : 'Download AR Menu PDF'
      }
    </PDFDownloadLink>
  );
};

export default GenerateMenuPDFButton; 