'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Upload, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface DataUploadProps {
  onUpload: (file: File) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export function DataUpload({ onUpload, isLoading, error }: DataUploadProps) {
  const [isDragActive, setIsDragActive] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(e.type === 'dragenter' || e.type === 'dragover');
  }, []);

  const isValidFile = (file: File): boolean => {
    const validExtensions = ['.csv', '.xlsx', '.xls'];
    const validMimes = ['text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'];
    
    return validExtensions.some(ext => file.name.toLowerCase().endsWith(ext)) ||
           validMimes.includes(file.type);
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragActive(false);

      const files = e.dataTransfer.files;
      if (files && files[0]) {
        const file = files[0];
        if (isValidFile(file)) {
          onUpload(file);
        } else {
          alert('Por favor, sube un archivo válido (CSV, XLSX o XLS)');
        }
      }
    },
    [onUpload]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
        onUpload(e.target.files[0]);
      }
    },
    [onUpload]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card
        className={`relative border-2 border-dashed transition-all cursor-pointer ${
          isDragActive
            ? 'border-blue-500 bg-blue-500/5'
            : 'border-muted-foreground/30 hover:border-muted-foreground/50'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="p-12 text-center">
          <motion.div
            animate={{ scale: isDragActive ? 1.1 : 1 }}
            transition={{ duration: 0.2 }}
          >
            <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          </motion.div>

          <h3 className="text-lg font-semibold mb-2">Carga tu archivo de datos</h3>
          <p className="text-muted-foreground mb-4">
            Arrastra y suelta un archivo (CSV, XLSX o XLS) aquí o haz clic para seleccionar
          </p>

          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileInput}
            disabled={isLoading}
            className="hidden"
            id="file-input"
          />

          <Button
            onClick={() => document.getElementById('file-input')?.click()}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Cargando...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Seleccionar archivo
              </>
            )}
          </Button>

          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4 p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-sm"
            >
              {error}
            </motion.div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
