'use client';

import React, { useState } from 'react';
import { Upload, Copy, Check, Image as ImageIcon, Loader2 } from 'lucide-react';

interface MediaLibraryProps {
  initialImages: string[];
}

export function MediaLibrary({ initialImages }: MediaLibraryProps) {
  const [images, setImages] = useState<string[]>(initialImages);
  const [isUploading, setIsUploading] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const dataUrl = event.target?.result as string;
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dataUrl, filename: file.name }),
        });
        if (res.ok) {
          const result = await res.json();
          setImages([result.url, ...images]);
        }
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Upload error:', err);
      setIsUploading(false);
    }
  };

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  return (
    <div className="space-y-6 text-gray-900 max-w-5xl">
      <div className="bg-white border border-gray-200/90 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif font-black text-xl text-gray-900">Media Assets & Artwork Library</h2>
          <p className="text-xs text-gray-500 mt-1">
            Uploaded posters, high-res widescreen backdrops, and editorial photography.
          </p>
        </div>

        <label className="px-5 py-2.5 bg-[#008CFF] hover:bg-[#0077dd] text-white font-sans font-bold text-xs uppercase tracking-wider rounded-xl shadow-xs flex items-center space-x-2 cursor-pointer shrink-0 transition-all">
          {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          <span>{isUploading ? 'Uploading...' : 'Upload Media Asset'}</span>
          <input
            type="file"
            accept="image/*"
            onChange={handleUpload}
            disabled={isUploading}
            className="hidden"
          />
        </label>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {images.map((imgUrl, i) => (
          <div
            key={i}
            className="bg-white border border-gray-200/90 rounded-2xl overflow-hidden shadow-sm group relative flex flex-col hover:border-[#008CFF]/50 transition-all"
          >
            <div className="h-40 bg-gray-100 overflow-hidden relative">
              <img
                src={imgUrl}
                alt={`Media asset ${i}`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gray-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2 backdrop-blur-xs">
                <button
                  onClick={() => handleCopy(imgUrl)}
                  className="px-3 py-1.5 bg-white text-gray-900 font-mono font-bold text-xs rounded-xl shadow-sm flex items-center space-x-1.5 cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  {copiedUrl === imgUrl ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-[#008CFF]" />
                      <span>Copy URL</span>
                    </>
                  )}
                </button>
              </div>
            </div>
            <div className="p-3 bg-white border-t border-gray-100 flex items-center justify-between">
              <span className="text-[11px] font-mono text-gray-500 truncate flex-1 pr-2">
                {imgUrl.slice(0, 26)}...
              </span>
              <button
                onClick={() => handleCopy(imgUrl)}
                className="text-gray-400 hover:text-gray-700 p-1 transition-colors cursor-pointer"
                title="Copy URL"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
