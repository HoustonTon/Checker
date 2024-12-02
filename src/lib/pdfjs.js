import { getDocument } from 'pdfjs-dist/build/pdf';
import { GlobalWorkerOptions } from 'pdfjs-dist/build/pdf';

// Используем конкретную версию worker'а
GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@2.16.105/build/pdf.worker.min.js';

export const loadPDF = async (file) => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    
    // Создаем задачу загрузки PDF
    const loadingTask = getDocument({
      data: arrayBuffer,
      verbosity: 0
    });

    console.log('Loading PDF document...');
    const pdf = await loadingTask.promise;
    console.log('PDF document loaded successfully');
    
    console.log('Extracting metadata...');
    const metadata = await pdf.getMetadata().catch(error => {
      console.warn('Error getting metadata:', error);
      return { info: {} };
    });
    
    console.log('Raw metadata:', metadata);

    // Форматирование даты с обработкой разных форматов
    const formatDate = (dateStr) => {
      if (!dateStr) return 'Не указано';
      try {
        if (dateStr.startsWith('D:')) {
          // Формат PDF даты: D:YYYYMMDDHHmmSS
          const d = dateStr.slice(2); // Убираем D:
          const year = d.slice(0, 4);
          const month = d.slice(4, 6);
          const day = d.slice(6, 8);
          const hour = d.slice(8, 10) || '00';
          const minute = d.slice(10, 12) || '00';
          const second = d.slice(12, 14) || '00';
          return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}`).toLocaleString('ru-RU');
        }
        return new Date(dateStr).toLocaleString('ru-RU');
      } catch (e) {
        console.warn('Error parsing date:', e);
        return dateStr;
      }
    };

    const result = {
      'Имя файла': file.name,
      'Размер': `${(file.size / 1024 / 1024).toFixed(2)} MB`,
      'Количество страниц': pdf.numPages,
      'Заголовок': metadata.info?.Title || 'Не указано',
      'Автор': metadata.info?.Author || 'Не указано',
      'Создатель': metadata.info?.Creator || 'Не указано',
      'Производитель': metadata.info?.Producer || 'Не указано',
      'Дата создания': formatDate(metadata.info?.CreationDate),
      'Дата изменения': formatDate(metadata.info?.ModDate),
      'Версия PDF': metadata.info?.PDFFormatVersion ? `PDF ${metadata.info.PDFFormatVersion}` : 'Не указано',
      'Зашифрован': pdf.isEncrypted ? 'Да' : 'Нет'
    };

    // Добавляем дополнительные метаданные, если они есть
    if (metadata.metadata) {
      try {
        const xmpData = metadata.metadata.getAll();
        Object.entries(xmpData).forEach(([key, value]) => {
          if (value && typeof value === 'string' && value.trim() !== '') {
            result[`XMP: ${key}`] = value;
          }
        });
      } catch (e) {
        console.warn('Failed to parse XMP metadata:', e);
      }
    }

    return result;
  } catch (error) {
    console.error('Error loading PDF:', error);
    let errorMessage = 'Ошибка при чтении PDF файла';
    
    if (error.name === 'PasswordException') {
      errorMessage = 'PDF файл защищен паролем';
    } else if (error.name === 'InvalidPDFException') {
      errorMessage = 'Недействительный PDF файл';
    } else if (error.message) {
      errorMessage += `: ${error.message}`;
    }
    
    throw new Error(errorMessage);
  }
};
