import { createWorker } from 'tesseract.js';

let worker = null;

export const initTesseract = async () => {
  if (!worker) {
    worker = await createWorker();
    await worker.loadLanguage('eng');
    await worker.initialize('eng');
  }
  return worker;
};

export const terminateWorker = async () => {
  if (worker) {
    await worker.terminate();
    worker = null;
  }
}; 