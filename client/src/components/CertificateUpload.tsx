import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useLocation } from 'wouter';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export default function CertificateUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [hash, setHash] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [, setLocation] = useLocation();

  // Web Crypto APIを使用した高速なSHA-256ハッシュ計算
  const calculateHash = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
    setIsCalculating(true);

    try {
      // 1. ハッシュ計算
      const fileHash = await calculateHash(selectedFile);
      setHash(fileHash);

      // 2. Supabaseへレコード作成
      const { data, error } = await supabase
        .from('certificates')
        .insert([{ file_hash: fileHash }])
        .select()
        .single();

      if (error) {
        console.error("Supabase insert error:", error);
        return;
      }

      // 3. 発行された証明書ページへ即時遷移
      if (data && data.id) {
        setLocation(`/cert/${data.id}`);
      }

    } catch (error) {
      console.error("Process failed:", error);
    } finally {
      setIsCalculating(false);
    }
  }, [setLocation]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    maxFiles: 1
  });

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-[#1e293b] rounded-2xl border border-slate-700 text-white shadow-xl">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-200 ${
          isDragActive 
            ? 'border-[#00D4AA] bg-[#00D4AA]/10' 
            : 'border-slate-600 hover:border-slate-400 hover:bg-slate-800'
        }`}
      >
        <input {...getInputProps()} />
        {isDragActive ? (
          <p className="text-[#00D4AA] font-bold text-lg">画像をドロップして解析を開始...</p>
        ) : (
          <div className="space-y-2">
            <p className="text-slate-200 font-bold text-lg">クリックまたは画像をドラッグ＆ドロップ</p>
            <p className="text-slate-400 text-sm">ブラウザ内で安全にデジタル存在証明（SHA-256）を計算します</p>
          </div>
        )}
      </div>

      {preview && (
        <div className="mt-8 space-y-6 animate-in fade-in duration-500">
          <div className="flex justify-center">
            <img 
              src={preview} 
              alt="Preview" 
              className="max-h-64 rounded-lg shadow-2xl border border-slate-700 object-contain" 
            />
          </div>
          
          <div className="bg-[#0f172a] p-5 rounded-xl border border-slate-700">
            <div className="mb-4">
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-1">Target File</p>
              <p className="text-sm text-slate-300 break-all">{file?.name}</p>
            </div>

            <div>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-1">SHA-256 Hash Signature</p>
              {isCalculating ? (
                <p className="text-[#00D4AA] animate-pulse font-mono text-sm">Computing hash and generating certificate...</p>
              ) : (
                <p className="text-[#00D4AA] font-mono text-sm break-all select-all bg-[#00D4AA]/10 p-3 rounded-lg border border-[#00D4AA]/20">
                  {hash}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}