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
    const initSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
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

        if (!session) {
          console.log("No session found, redirecting to auth");
          navigate("/auth");
          return;
        }

        setSession(session);
      } catch (error) {
        console.error("Error getting session:", error);
        navigate("/auth");
      } finally {
        setLoading(false);
      }
    };

    initSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", { event, session });
      
      if (event === 'SIGNED_OUT') {
        setSession(null);
        navigate("/");
        toast({
          title: "Signed out",
          description: "You have been signed out successfully",
        });
        return;
      }

      if (!session) {
        navigate("/auth");
        return;
      }

      setSession(session);
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