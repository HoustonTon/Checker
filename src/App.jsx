import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { DocumentArrowUpIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { loadPDF } from './lib/pdfjs';

function App() {
  const [metadata, setMetadata] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const extractMetadata = async (file) => {
    try {
      setLoading(true);
      setError(null);
      const metadata = await loadPDF(file);
      console.log('Processed metadata:', metadata);
      setMetadata(metadata);
    } catch (err) {
      console.error('PDF processing error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) {
      extractMetadata(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    multiple: false
  });

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <DocumentTextIcon className="mx-auto h-12 w-12 text-primary-600" />
          <h1 className="mt-3 text-3xl font-bold text-gray-900">
            PDF Metadata Viewer
          </h1>
          <p className="mt-2 text-gray-600">
            Загрузите PDF файл для просмотра его метаданных
          </p>
        </div>

        <div className="card">
          <div
            {...getRootProps()}
            className={`dropzone ${
              isDragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-300'
            }`}
          >
            <input {...getInputProps()} />
            <div className="text-center">
              <DocumentArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-600">
                {isDragActive
                  ? 'Отпустите файл здесь...'
                  : 'Перетащите PDF файл сюда или кликните для выбора'}
              </p>
            </div>
          </div>

          {loading && (
            <div className="mt-6 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary-500 border-t-transparent"></div>
              <p className="mt-2 text-sm text-gray-600">Загрузка метаданных...</p>
            </div>
          )}

          {error && (
            <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {metadata && !loading && (
            <div className="mt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Метаданные файла
              </h2>
              <div className="divide-y divide-gray-200">
                {Object.entries(metadata).map(([key, value]) => (
                  <div key={key} className="py-3 flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">{key}</dt>
                    <dd className="text-sm text-gray-900 mt-0 ml-6 text-right">
                      {value}
                    </dd>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
