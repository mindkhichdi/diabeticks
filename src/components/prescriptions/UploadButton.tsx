import React from 'react';
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";

interface UploadButtonProps {
  onFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  isUploading: boolean;
}

const UploadButton = ({ onFileSelect, isUploading }: UploadButtonProps) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  return (
    <div className="w-full sm:w-auto">
      <input
        type="file"
        ref={fileInputRef}
        onChange={onFileSelect}
        accept=".pdf,image/*"
        className="hidden"
      />
      <Button
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className="w-full sm:w-auto flex items-center gap-2"
      >
        <Upload className="w-4 h-4" />
        <span className="hidden sm:inline">Upload Prescription</span>
        <span className="sm:hidden">Upload</span>
      </Button>
    </div>
  );
};

export default UploadButton;