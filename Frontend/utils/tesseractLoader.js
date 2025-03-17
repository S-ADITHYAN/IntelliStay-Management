let tesseract = null;

export const loadTesseract = async () => {
  if (!tesseract) {
    tesseract = await import('tesseract.js');
  }
  return tesseract;
}; 