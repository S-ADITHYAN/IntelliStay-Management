import { initTesseract, terminateWorker } from './tesseractService';

export const verifyDocument = async (file, documentType, documentNumber) => {
  let worker = null;
  try {
    // Initialize worker
    worker = await initTesseract();

    // Convert file to image data
    const imageData = await fileToImage(file);

    // Recognize text from image
    const { data: { text } } = await worker.recognize(imageData);

    // Verify based on document type
    const result = validateDocument(text, documentType, documentNumber);

    return result;
  } catch (error) {
    console.error('OCR Error:', error);
    return {
      isValid: false,
      error: 'Failed to verify document. Please ensure the image is clear.'
    };
  } finally {
    // Clean up worker
    if (worker) {
      await terminateWorker();
    }
  }
};

// Convert file to image data
const fileToImage = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = event.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// Validate document based on type
const validateDocument = (text, documentType, documentNumber) => {
  const cleanText = text.toLowerCase().replace(/\s/g, '');
  
  switch (documentType) {
    case 'aadhar':
      return validateAadhar(cleanText, documentNumber);
    case 'passport':
      return validatePassport(cleanText, documentNumber);
    case 'drivingLicense':
      return validateDrivingLicense(cleanText, documentNumber);
    case 'panCard':
      return validatePanCard(cleanText, documentNumber);
    default:
      return {
        isValid: false,
        error: 'Unsupported document type'
      };
  }
};

// Validation functions for different document types
const validateAadhar = (text, number) => {
  const aadharRegex = /\d{12}/;
  const hasNumber = text.includes(number);
  const matchesPattern = aadharRegex.test(number);

  return {
    isValid: hasNumber && matchesPattern,
    error: !hasNumber ? 'Aadhar number not found in document' :
           !matchesPattern ? 'Invalid Aadhar number format' : null
  };
};

const validatePassport = (text, number) => {
  const passportRegex = /[A-Z]{1}[0-9]{7}/;
  const hasNumber = text.includes(number.toLowerCase());
  const matchesPattern = passportRegex.test(number);

  return {
    isValid: hasNumber && matchesPattern,
    error: !hasNumber ? 'Passport number not found in document' :
           !matchesPattern ? 'Invalid passport number format' : null
  };
};

const validatePanCard = (text, number) => {
  const panRegex = /[A-Z]{5}[0-9]{4}[A-Z]{1}/;
  const hasNumber = text.includes(number.toLowerCase());
  const matchesPattern = panRegex.test(number);

  return {
    isValid: hasNumber && matchesPattern,
    error: !hasNumber ? 'PAN number not found in document' :
           !matchesPattern ? 'Invalid PAN number format' : null
  };
};

const validateDrivingLicense = (text, number) => {
  const dlRegex = /^(([A-Z]{2}[0-9]{2})( )|([A-Z]{2}-[0-9]{2}))((19|20)[0-9][0-9])[0-9]{7}$/;
  const hasNumber = text.includes(number.toLowerCase());
  const matchesPattern = dlRegex.test(number);

  return {
    isValid: hasNumber && matchesPattern,
    error: !hasNumber ? 'Driving license number not found in document' :
           !matchesPattern ? 'Invalid driving license number format' : null
  };
}; 