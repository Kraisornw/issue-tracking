'use client';

import { useState, useRef } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  Upload, 
  FileSpreadsheet, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  X,
  FileWarning 
} from 'lucide-react';
import { ValidationError } from '@/types';

interface UploadModalProps {
  onSuccess: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UploadModal({ onSuccess, open, onOpenChange }: UploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [stats, setStats] = useState<{
    totalRecords: number;
    newRecords: number;
    updatedRecords: number;
    processingTime: string;
  } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      const ext = droppedFile.name.split('.').pop()?.toLowerCase();
      if (ext === 'xlsx' || ext === 'xls') {
        setFile(droppedFile);
        resetState();
      } else {
        setErrorMessage('Only Excel files (.xlsx, .xls) are supported');
        setStatus('error');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      resetState();
    }
  };

  const resetState = () => {
    setStatus('idle');
    setErrors([]);
    setErrorMessage('');
    setStats(null);
  };

  const removeFile = () => {
    setFile(null);
    resetState();
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleUpload = async () => {
    if (!file) return;

    setStatus('loading');
    setErrors([]);
    setErrorMessage('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        setStatus('success');
        setStats({
          totalRecords: data.totalRecords,
          newRecords: data.newRecords,
          updatedRecords: data.updatedRecords,
          processingTime: data.processingTime
        });
        onSuccess();
      } else {
        setStatus('error');
        if (data.errorType === 'VALIDATION_FAILED') {
          setErrors(data.errors || []);
          setErrorMessage('File validation failed. Please correct the errors below and try again.');
        } else if (data.errorType === 'MISSING_HEADERS') {
          setErrorMessage(data.error || 'Required columns are missing in your Excel sheet.');
        } else {
          setErrorMessage(data.error || 'Failed to upload and process Excel file.');
        }
      }
    } catch (error) {
      console.error(error);
      setStatus('error');
      setErrorMessage('An unexpected connection error occurred. Please try again.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => {
      onOpenChange(val);
      if (!val) {
        setFile(null);
        resetState();
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    }}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto bg-white border border-slate-200 text-slate-800 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2 text-indigo-600">
            <FileSpreadsheet className="w-5 h-5" /> Import Issue Tracking File
          </DialogTitle>
          <DialogDescription className="text-slate-500">
            Upload your Excel file (.xlsx or .xls) to import new issues and update existing records.
          </DialogDescription>
        </DialogHeader>

        {status === 'idle' && (
          <div className="space-y-4">
            <div 
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 ${
                dragActive 
                  ? 'border-indigo-500 bg-indigo-50' 
                  : 'border-slate-200 bg-slate-50/50 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <input 
                ref={fileInputRef}
                type="file" 
                className="hidden" 
                accept=".xlsx, .xls"
                onChange={handleFileChange}
              />
              <div className="flex flex-col items-center gap-3">
                <div className="p-4 bg-white rounded-full text-indigo-600 shadow-sm border border-slate-100">
                  <Upload className="w-8 h-8 animate-pulse" />
                </div>
                <div>
                  <p className="font-semibold text-slate-700">Drag & drop your Excel file here</p>
                  <p className="text-sm text-slate-500 mt-1">or click to browse your folders</p>
                </div>
                <p className="text-xs text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200 mt-2">
                  Supports .xlsx and .xls
                </p>
              </div>
            </div>

            {file && (
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="w-8 h-8 text-emerald-600" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-slate-800 truncate max-w-md">{file.name}</p>
                    <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>
                <Button size="icon" variant="ghost" className="text-slate-400 hover:text-slate-800 hover:bg-slate-100" onClick={removeFile}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}

            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" className="border-slate-200 text-slate-600 hover:bg-slate-50" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleUpload} 
                disabled={!file}
                variant="outline"
                className="border-slate-200 bg-white text-black hover:bg-slate-50 shadow-sm disabled:opacity-50 font-semibold"
              >
                Upload & Process
              </Button>
            </div>
          </div>
        )}

        {status === 'loading' && (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
            <div className="text-center">
              <p className="font-semibold text-slate-800 text-lg">Processing Excel File</p>
              <p className="text-sm text-slate-500 mt-1">Reading headers, validating data formatting, and checking for duplicates...</p>
            </div>
          </div>
        )}

        {status === 'success' && stats && (
          <div className="text-center py-6 space-y-6">
            <div className="flex justify-center">
              <div className="p-4 bg-emerald-50 rounded-full text-emerald-600 border border-emerald-100">
                <CheckCircle2 className="w-12 h-12" />
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold text-emerald-700">Data Imported Successfully!</h3>
              <p className="text-slate-550 text-sm mt-1">Your Issue Tracking database has been updated.</p>
            </div>

            <div className="grid grid-cols-4 gap-4 max-w-md mx-auto p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="text-center">
                <p className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Total Rows</p>
                <p className="text-xl font-extrabold text-slate-800 mt-1">{stats.totalRecords}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">New</p>
                <p className="text-xl font-extrabold text-emerald-600 mt-1">+{stats.newRecords}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Updated</p>
                <p className="text-xl font-extrabold text-blue-600 mt-1">~{stats.updatedRecords}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Time</p>
                <p className="text-xl font-extrabold text-indigo-600 mt-1">{stats.processingTime}</p>
              </div>
            </div>

            <div className="flex justify-center mt-6">
              <Button className="bg-emerald-600 hover:bg-emerald-500 text-white px-6" onClick={() => onOpenChange(false)}>
                Done
              </Button>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-rose-50 border border-rose-100 rounded-lg text-rose-800">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600" />
              <div>
                <h4 className="font-semibold text-rose-900">Import Refused</h4>
                <p className="text-sm opacity-90 mt-0.5 text-rose-700">{errorMessage}</p>
              </div>
            </div>

            {errors.length > 0 && (
              <div className="space-y-2 mt-4">
                <p className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                  <FileWarning className="w-4 h-4 text-rose-600" /> Detected Formatting Errors ({errors.length})
                </p>
                <div className="border border-slate-200 rounded-lg overflow-hidden max-h-60 overflow-y-auto">
                  <table className="w-full text-sm text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-550 text-slate-500 font-bold border-b border-slate-200">
                        <th className="p-2 w-16 text-center">Row</th>
                        <th className="p-2 w-32">Column</th>
                        <th className="p-2 w-32">Invalid Value</th>
                        <th className="p-2">Error Message</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {errors.map((err, idx) => (
                        <tr key={idx} className="bg-white hover:bg-slate-50/50 text-slate-600">
                          <td className="p-2 text-center text-slate-400 font-mono">{err.row}</td>
                          <td className="p-2 font-semibold text-slate-750">{err.column}</td>
                          <td className="p-2 text-rose-600 font-mono truncate max-w-[120px]">{err.value || '-'}</td>
                          <td className="p-2 text-slate-550">{err.message}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" className="border-slate-200 text-slate-600 hover:bg-slate-50" onClick={resetState}>
                Try Another File
              </Button>
              <Button className="bg-slate-100 hover:bg-slate-200 text-slate-700" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
