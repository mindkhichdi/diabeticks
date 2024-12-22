import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { useToast } from "@/components/ui/use-toast";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Initialize session from local storage
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      console.log("Getting initial session:", { session, error });
      if (error) {
        console.error("Session error:", error);
        toast({
          variant: "destructive",
          title: "Authentication Error",
          description: "Please sign in again",
        });
        navigate("/auth");
        return;
      }
      setSession(session);
      setLoading(false);
      if (!session) {
        navigate("/auth");
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", { event, session });
      setSession(session);
      
      if (event === 'SIGNED_OUT') {
        navigate("/");
        toast({
          title: "Signed out",
          description: "You have been signed out successfully",
        });
      } else if (!session) {
        navigate("/auth");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, toast]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return session ? <>{children}</> : null;
};

export default ProtectedRoute;