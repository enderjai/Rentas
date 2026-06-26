import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// Configuración global para PDF
export const configurePDF = () => {
  // Registrar plugin autoTable
  (jsPDF as any).API.autoTable = autoTable;
};

export const PDF_CONFIG = {
  fonts: {
    normal: 'helvetica',
    bold: 'helvetica-bold',
    italic: 'helvetica-oblique'
  },
  colors: {
    primary: [41, 128, 185],
    secondary: [52, 73, 94],
    accent: [46, 204, 113],
    danger: [231, 76, 60]
  }
};