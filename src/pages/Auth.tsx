import { Auth } from "@supabase/auth-ui-react";
import { supabase } from "@/integrations/supabase/client";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { Card } from "@/components/ui/card";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
const AuthPage = () => {
  const navigate = useNavigate();
  useEffect(() => {
    const {
      data: {
        subscription
      }
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN") {
        navigate("/dashboard");
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate]);
  return <div className="container mx-auto max-w-md mt-12">
      <Card className="p-8 bg-card/70 backdrop-blur-md border-2 border-border/50 rounded-2xl shadow-lg">
        <h1 className="text-2xl font-bold mb-6 text-center text-primary">Welcome to Diabeticks</h1>
        <Auth supabaseClient={supabase} appearance={{
        theme: ThemeSupa
      }} providers={[]} theme="light" />
      </Card>
    </div>;
};
export default AuthPage;