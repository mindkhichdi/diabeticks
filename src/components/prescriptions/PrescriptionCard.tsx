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
import { useToast } from "@/components/ui/use-toast";

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
  const { toast } = useToast();

  const getFileUrl = async () => {
    try {
      console.log('Getting signed URL for file:', prescription.file_path);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('No active session found');
        toast({
          variant: "destructive",
          title: "Authentication Error",
          description: "Please sign in again",
        });
        return null;
      }

      const { data, error } = await supabase.storage
        .from('prescriptions')
        .createSignedUrl(prescription.file_path, 3600);

      if (error) {
        console.error('Error getting signed URL:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not access the file",
        });
        return null;
      }

      console.log('Successfully got signed URL:', data.signedUrl);
      return data.signedUrl;
    } catch (error) {
      console.error('Error in getFileUrl:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to access file",
      });
      return null;
    }
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
      <Card className="p-3 md:p-4 space-y-3 md:space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 md:w-5 md:h-5 text-primary flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-sm text-muted-foreground truncate">
                {new Date(prescription.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex gap-1 md:gap-2 justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleView}
              title="View"
              className="h-8 w-8 md:h-9 md:w-9"
            >
              <Eye className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDownload}
              title="Download"
              className="h-8 w-8 md:h-9 md:w-9"
            >
              <Download className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(prescription)}
              title="Delete"
              className="h-8 w-8 md:h-9 md:w-9"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>

      <Dialog open={viewerOpen} onOpenChange={setViewerOpen}>
        <DialogContent className="w-[95vw] max-w-4xl h-[80vh] md:h-[85vh]">
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