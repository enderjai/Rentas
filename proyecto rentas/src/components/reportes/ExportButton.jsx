import React from 'react';
import { DocumentArrowDownIcon } from '@heroicons/react/24/outline';

export const ExportButton = ({ onExport, formato = 'csv' }) => {
  return (
    <button
      onClick={onExport}
      className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 flex items-center gap-2 text-sm"
    >
      <DocumentArrowDownIcon className="h-5 w-5" />
      Exportar {formato.toUpperCase()}
    </button>
  );
};