'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  X,
  Upload,
  FileJson,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Layers,
  ArrowRight,
} from 'lucide-react';

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function BulkImportModal({ isOpen, onClose, onSuccess }: BulkImportModalProps) {
  const router = useRouter();
  const [jsonInput, setJsonInput] = useState('');
  const [duplicateMode, setDuplicateMode] = useState<'skip' | 'update'>('skip');
  const [isProcessing, setIsProcessing] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<{
    success: boolean;
    importedCount: number;
    skippedCount: number;
    failedCount: number;
    message: string;
    duplicates: any[];
    errors: any[];
  } | null>(null);

  if (!isOpen) return null;

  const handleValidateAndImport = async () => {
    setValidationError(null);
    setImportResult(null);

    const raw = jsonInput.trim();
    if (!raw) {
      setValidationError('Please paste approved JSON from Google Sheets or the Editorial Pipeline.');
      return;
    }

    let parsed: any;
    try {
      parsed = JSON.parse(raw);
    } catch (e: any) {
      setValidationError(`Invalid JSON syntax: ${e.message}`);
      return;
    }

    const payload = Array.isArray(parsed) ? parsed : [parsed];
    if (payload.length === 0) {
      setValidationError('JSON array contains 0 review items.');
      return;
    }

    setIsProcessing(true);

    try {
      const res = await fetch('/api/admin/import-reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviews: payload,
          duplicateMode,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setValidationError(data.message || 'Import request failed.');
      } else {
        setImportResult(data);
        onSuccess();
        router.refresh();
      }
    } catch (err: any) {
      setValidationError(`Network error during import: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setJsonInput('');
    setValidationError(null);
    setImportResult(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-gray-200 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#008CFF]/10 text-[#008CFF] flex items-center justify-center">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-black text-lg text-gray-900">
                Import from Editorial Pipeline
              </h3>
              <p className="text-xs text-gray-500">
                Import approved reviews as CMS drafts with automatic duplicate detection.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
          {!importResult ? (
            <>
              <div>
                <label className="block text-xs font-mono uppercase font-bold text-gray-700 mb-1.5 flex items-center justify-between">
                  <span>Approved JSON Payload</span>
                  <span className="text-[10px] text-gray-400 normal-case">
                    Copy from Google Sheets &gt; Export Approved Reviews
                  </span>
                </label>
                <textarea
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  placeholder={`[\n  {\n    "title": "Dune: Part Two",\n    "releaseYear": 2024,\n    "type": "Movie",\n    "abstractScore": 10,\n    "myTake": "...",\n    "longFormReview": "..."\n  }\n]`}
                  rows={8}
                  className="w-full font-mono text-[11px] p-3.5 bg-gray-50/70 border border-gray-200 rounded-2xl focus:bg-white focus:border-[#008CFF] focus:outline-none transition-all"
                />
              </div>

              {/* Duplicate Handling Mode */}
              <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-100 flex items-center justify-between">
                <div>
                  <div className="font-bold text-gray-800">Duplicate Handling Strategy</div>
                  <div className="text-[11px] text-gray-500">
                    Matches existing reviews by Title + Release Year or Slug
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setDuplicateMode('skip')}
                    className={`px-3 py-1.5 rounded-xl font-mono text-xs cursor-pointer transition-all ${
                      duplicateMode === 'skip'
                        ? 'bg-[#008CFF] text-white font-bold shadow-xs'
                        : 'bg-white text-gray-600 border border-gray-200'
                    }`}
                  >
                    Skip Duplicates (Safe)
                  </button>
                  <button
                    type="button"
                    onClick={() => setDuplicateMode('update')}
                    className={`px-3 py-1.5 rounded-xl font-mono text-xs cursor-pointer transition-all ${
                      duplicateMode === 'update'
                        ? 'bg-amber-500 text-white font-bold shadow-xs'
                        : 'bg-white text-gray-600 border border-gray-200'
                    }`}
                  >
                    Update Existing
                  </button>
                </div>
              </div>

              {validationError && (
                <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl text-red-700 flex items-start space-x-2 text-xs">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{validationError}</span>
                </div>
              )}
            </>
          ) : (
            /* Result Summary */
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 space-y-1">
                <div className="flex items-center space-x-2 font-bold text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Import Completed Successfully</span>
                </div>
                <p className="text-xs text-emerald-700">{importResult.message}</p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-center">
                  <div className="font-serif font-bold text-lg text-[#008CFF]">
                    {importResult.importedCount}
                  </div>
                  <div className="text-[10px] uppercase font-mono text-gray-500">
                    Drafts Created
                  </div>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-center">
                  <div className="font-serif font-bold text-lg text-amber-600">
                    {importResult.skippedCount}
                  </div>
                  <div className="text-[10px] uppercase font-mono text-gray-500">
                    Duplicates Skipped
                  </div>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-center">
                  <div className="font-serif font-bold text-lg text-red-600">
                    {importResult.failedCount}
                  </div>
                  <div className="text-[10px] uppercase font-mono text-gray-500">Errors</div>
                </div>
              </div>

              {importResult.duplicates.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[11px] font-mono font-bold text-gray-600">
                    Skipped Duplicates:
                  </div>
                  <div className="max-h-28 overflow-y-auto space-y-1 bg-gray-50 p-2.5 rounded-xl border border-gray-200">
                    {importResult.duplicates.map((dup, i) => (
                      <div key={i} className="text-[11px] text-gray-600 flex justify-between">
                        <span className="font-semibold">{dup.title} ({dup.releaseYear})</span>
                        <span className="text-gray-400">/{dup.existingSlug}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
          {!importResult ? (
            <>
              <button
                type="button"
                onClick={onClose}
                disabled={isProcessing}
                className="px-4 py-2 text-xs font-mono text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleValidateAndImport}
                disabled={isProcessing}
                className="px-5 py-2.5 bg-[#008CFF] hover:bg-[#0077dd] text-white font-sans font-bold text-xs uppercase tracking-wider rounded-xl shadow-xs flex items-center space-x-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Processing Ingestion...</span>
                  </>
                ) : (
                  <>
                    <FileJson className="w-3.5 h-3.5" />
                    <span>Import to CMS Drafts</span>
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2 text-xs font-mono text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
              >
                Import Another Batch
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 bg-gray-900 hover:bg-black text-white font-sans font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-xs"
              >
                Done
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
