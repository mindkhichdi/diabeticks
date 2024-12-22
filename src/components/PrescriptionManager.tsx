import React from 'react';
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import PrescriptionCard from './prescriptions/PrescriptionCard';
import UploadButton from './prescriptions/UploadButton';

interface Prescription {
  id: string;
  file_path: string;
  file_type: string;
  created_at: string;
}

const PrescriptionManager = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch prescriptions
  const { data: prescriptions, isLoading } = useQuery({
    queryKey: ['prescriptions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('prescriptions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Prescription[];
    },
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('No user found');

      console.log('Uploading prescription for user:', user.id);

      const timestamp = new Date().getTime();
      const fileExt = file.name.split('.').pop();
      const filePath = `${timestamp}_${crypto.randomUUID()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('prescriptions')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase
        .from('prescriptions')
        .insert({
          file_path: filePath,
          file_type: file.type,
          user_id: user.id,
        });

      if (dbError) throw dbError;

      return filePath;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prescriptions'] });
      toast({
        title: "Success",
        description: "Prescription uploaded successfully",
      });
    },
    onError: (error) => {
      console.error('Upload error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to upload prescription",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (prescription: Prescription) => {
      const { error: storageError } = await supabase.storage
        .from('prescriptions')
        .remove([prescription.file_path]);

      if (storageError) throw storageError;

      const { error: dbError } = await supabase
        .from('prescriptions')
        .delete()
        .eq('id', prescription.id);

      if (dbError) throw dbError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prescriptions'] });
      toast({
        title: "Success",
        description: "Prescription deleted successfully",
      });
    },
    onError: (error) => {
      console.error('Delete error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete prescription",
      });
    },
  });

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!['application/pdf', 'image/jpeg', 'image/png'].includes(file.type)) {
      toast({
        variant: "destructive",
        title: "Invalid file type",
        description: "Please upload a PDF or image file",
      });
      return;
    }

    uploadMutation.mutate(file);
  };

  if (isLoading) {
    return <div className="text-center py-4">Loading prescriptions...</div>;
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl md:text-2xl font-semibold">Prescriptions</h2>
        <UploadButton
          onFileSelect={handleFileSelect}
          isUploading={uploadMutation.isPending}
        />
      </div>

      <div className="grid gap-3 md:gap-4">
        {prescriptions?.map((prescription) => (
          <PrescriptionCard
            key={prescription.id}
            prescription={prescription}
            onDelete={(p) => deleteMutation.mutate(p)}
          />
        ))}
      </div>

      {prescriptions?.length === 0 && (
        <div className="text-center py-6 md:py-8 text-muted-foreground">
          No prescriptions uploaded yet
        </div>
      )}
    </div>
  );
};

export default PrescriptionManager;