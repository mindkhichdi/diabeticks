import React from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Trash2, Download, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface PrescriptionCardProps {
  prescription: {
    id: string;
    file_path: string;
    file_type: string;
    created_at: string;
  };
  onDelete: (prescription: any) => void;
}

const PrescriptionCard = ({ prescription, onDelete }: PrescriptionCardProps) => {
  const [viewerOpen, setViewerOpen] = React.useState(false);
  const [fileUrl, setFileUrl] = React.useState<string | null>(null);

  const getFileUrl = async () => {
    try {
      const { data } = await supabase.storage
        .from('prescriptions')
        .createSignedUrl(prescription.file_path, 3600); // URL valid for 1 hour

      if (data?.signedUrl) {
        setFileUrl(data.signedUrl);
        return data.signedUrl;
      }
    } catch (error) {
      console.error('Error getting file URL:', error);
    }
    return null;
  };

  const handleView = async () => {
    const url = await getFileUrl();
    if (url) {
      setFileUrl(url);
      setViewerOpen(true);
    }
  };

  const handleDownload = async () => {
    const url = await getFileUrl();
    if (url) {
      const link = document.createElement('a');
      link.href = url;
      link.download = prescription.file_path.split('/').pop() || 'prescription';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <>
      <Card className="p-4 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">
                {new Date(prescription.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleView}
              title="View"
            >
              <Eye className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDownload}
              title="Download"
            >
              <Download className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(prescription)}
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>

      <Dialog open={viewerOpen} onOpenChange={setViewerOpen}>
        <DialogContent className="max-w-4xl h-[80vh]">
          <DialogHeader>
            <DialogTitle>Prescription View</DialogTitle>
          </DialogHeader>
          {fileUrl && (
            prescription.file_type.includes('pdf') ? (
              <iframe
                src={fileUrl}
                className="w-full h-full"
                title="PDF Viewer"
              />
            ) : (
              <img
                src={fileUrl}
                alt="Prescription"
                className="max-h-full object-contain mx-auto"
              />
            )
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PrescriptionCard;