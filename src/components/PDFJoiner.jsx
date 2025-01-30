'use client'

import React, { useState, useCallback } from 'react';
import { PDFDocument } from 'pdf-lib';
import { X, Upload, FileUp } from 'lucide-react';

const PDFJoiner = () => {
  const [pdfFiles, setPdfFiles] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const pdfFiles = files.filter(file => file.type === 'application/pdf');
    
    setPdfFiles(prevFiles => [...prevFiles, ...pdfFiles]);
    setError('');
  };

  const removeFile = (index) => {
    setPdfFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
  };

  const mergePDFs = async () => {
    if (pdfFiles.length < 2) {
      setError('Please add at least 2 PDF files to merge');
      return;
    }

    try {
      setIsProcessing(true);
      setError('');

      // Create a new PDF document
      const mergedPdf = await PDFDocument.create();

      // Process each PDF file
      for (const file of pdfFiles) {
        const fileArrayBuffer = await file.arrayBuffer();
        const pdf = await PDFDocument.load(fileArrayBuffer);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach(page => mergedPdf.addPage(page));
      }

      // Save the merged PDF
      const mergedPdfFile = await mergedPdf.save();
      
      // Create download link
      const blob = new Blob([mergedPdfFile], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'merged.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setIsProcessing(false);
    } catch (err) {
      setError('Error merging PDFs. Please try again.');
      setIsProcessing(false);
      console.error('Error merging PDFs:', err);
    }
  };

  const dropHandler = useCallback((e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    const pdfFiles = files.filter(file => file.type === 'application/pdf');
    setPdfFiles(prevFiles => [...prevFiles, ...pdfFiles]);
  }, []);

  const dragOverHandler = useCallback((e) => {
    e.preventDefault();
  }, []);

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">PDF Joiner</h1>
        <p className="text-gray-600">Merge multiple PDF files in your browser</p>
      </div>

      {/* Drop Zone */}
      <div 
        className="border-2 border-dashed border-gray-300 rounded-lg p-8 mb-6 text-center"
        onDrop={dropHandler}
        onDragOver={dragOverHandler}
      >
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-gray-600 mb-2">Drag and drop PDF files here, or</p>
        <label className="inline-block">
          <span className="bg-blue-500 text-white px-4 py-2 rounded cursor-pointer hover:bg-blue-600 transition-colors">
            Browse Files
          </span>
          <input
            type="file"
            multiple
            accept=".pdf"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
      </div>

      {/* File List */}
      {pdfFiles.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3">Selected Files</h2>
          <div className="space-y-2">
            {pdfFiles.map((file, index) => (
              <div 
                key={`${file.name}-${index}`}
                className="flex items-center justify-between bg-gray-50 p-3 rounded"
              >
                <span className="truncate flex-1 mr-4">{file.name}</span>
                <button
                  onClick={() => removeFile(index)}
                  className="text-gray-500 hover:text-red-500 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="text-red-500 text-center mb-4">
          {error}
        </div>
      )}

      {/* Merge Button */}
      <button
        onClick={mergePDFs}
        disabled={isProcessing || pdfFiles.length < 2}
        className={`w-full py-3 px-4 rounded font-semibold flex items-center justify-center gap-2
          ${isProcessing || pdfFiles.length < 2 
            ? 'bg-gray-300 cursor-not-allowed' 
            : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}
      >
        <FileUp className="h-5 w-5" />
        {isProcessing ? 'Processing...' : 'Merge PDFs'}
      </button>
    </div>
  );
};

export default PDFJoiner;