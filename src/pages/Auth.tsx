import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff, MailCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Logo from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import RangeRibbon from "@/components/glucose/RangeRibbon";
import { cn } from "@/lib/utils";
import { DEFAULT_TARGETS } from "@/lib/glucose";

type View = "sign-in" | "sign-up" | "forgot" | "check-email" | "new-password";

const MIN_PASSWORD = 6;

// Turn Supabase's messages into instructions the reader can act on.
const friendlyError = (message: string) => {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials"))
    return "That email and password don't match. Try again, or reset your password.";
  if (m.includes("email not confirmed"))
    return "Confirm your email first. Check your inbox for the link we sent.";
  if (m.includes("already registered"))
    return "An account with this email already exists. Sign in instead.";
  if (m.includes("rate limit") || m.includes("too many"))
    return "Too many attempts. Wait a minute, then try again.";
  if (m.includes("password"))
    return `Use a password with at least ${MIN_PASSWORD} characters.`;
  return message;
};

const inputClass = "h-12 rounded-xl text-base bg-card border-input";

const PasswordField = ({
  id, label, value, onChange, autoComplete,
}: { id: string; label: string; value: string; onChange: (v: string) => void; autoComplete: string }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-bold">{label}</label>
      <div className="relative">
        <Input
          id={id}
          type={show ? "text" : "password"}
          autoComplete={autoComplete}
          required
          minLength={MIN_PASSWORD}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(inputClass, "pr-12")}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? "Hide password" : "Show password"}
          className="absolute right-1 top-1/2 -translate-y-1/2 grid place-items-center w-10 h-10 rounded-lg text-muted-foreground hover:text-foreground"
        >
          {show ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );
};

const AuthPage = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [view, setView] = useState<View>(params.get("mode") === "signup" ? "sign-up" : "sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const viewRef = useRef(view);
  viewRef.current = view;

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate("/dashboard", { replace: true });
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      // A password reset link signs the user in; let them choose a new password first.
      if (event === "PASSWORD_RECOVERY") setView("new-password");
      else if (event === "SIGNED_IN" && viewRef.current !== "new-password") navigate("/dashboard");
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const switchView = (v: View) => {
    setView(v);
    setError(null);
    setNotice(null);
    setPassword("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (view === "sign-in") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else if (view === "sign-up") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/dashboard` },
        });
        if (error) throw error;
        if (!data.session) switchView("check-email");
      } else if (view === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth`,
        });
        if (error) throw error;
        setNotice(`If an account exists for ${email}, a reset link is on its way.`);
      } else if (view === "new-password") {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        navigate("/dashboard");
      }
    } catch (err) {
      setError(friendlyError(err instanceof Error ? err.message : String(err)));
    } finally {
      setBusy(false);
    }
  };

  const copy: Record<Exclude<View, "check-email">, { title: string; sub: string; action: string; busy: string }> = {
    "sign-in": { title: "Welcome back", sub: "Sign in to see today's readings and doses.", action: "Sign in", busy: "Signing in…" },
    "sign-up": { title: "Create your account", sub: "Free, and it takes under a minute.", action: "Create account", busy: "Creating account…" },
    forgot: { title: "Reset your password", sub: "Enter your email and we'll send you a link to choose a new one.", action: "Send reset link", busy: "Sending…" },
    "new-password": { title: "Choose a new password", sub: `Use at least ${MIN_PASSWORD} characters.`, action: "Save password", busy: "Saving…" },
  };

  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-2">
      {/* Brand panel */}
      <aside className="hidden lg:flex flex-col justify-between bg-primary text-primary-foreground p-12 relative overflow-hidden">
        <Link to="/" aria-label="Diabeticks home">
          <Logo size={36} tone="inverse" />
        </Link>

        <div className="max-w-md">
          <p className="font-display text-5xl font-bold leading-[1.05] tracking-tight">
            Know where you stand, at a glance.
          </p>
          <p className="mt-4 text-lg text-primary-foreground/80">
            Log a reading in seconds and see straight away whether it's low, in range or high, with what to do next.
          </p>

          {/* The same scale the app uses, shown on a sample reading */}
          <div className="mt-10 rounded-3xl bg-card text-card-foreground p-6 shadow-2xl shadow-black/20" aria-hidden="true">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span className="font-bold uppercase tracking-wider">Latest blood sugar</span>
              <span>Fasting · Today</span>
            </div>
            <div className="flex items-end gap-3 mt-2">
              <span className="font-display font-bold text-7xl leading-[0.85] tabular text-in-range">108</span>
              <span className="pb-1">
                <span className="block text-sm text-muted-foreground">mg/dL</span>
                <span className="inline-flex items-center gap-1.5 font-bold text-in-range">
                  <span className="w-2.5 h-2.5 rounded-full bg-in-range" /> In range
                </span>
              </span>
            </div>
            <RangeRibbon value={108} kind="fasting" targets={DEFAULT_TARGETS} className="mt-3" />
          </div>
        </div>

        <ul className="flex gap-6 text-sm text-primary-foreground/80">
          <li>Blood sugar</li>
          <li>Medicine</li>
          <li>Meals</li>
          <li>Activity</li>
        </ul>
      </aside>

      {/* Form */}
      <main className="flex flex-col min-h-screen px-4 sm:px-8">
        <header className="flex items-center justify-between h-16 lg:justify-end">
          <Link to="/" aria-label="Diabeticks home" className="lg:hidden">
            <Logo size={32} />
          </Link>
          <ThemeToggle />
        </header>

        <div className="flex-1 flex items-center justify-center py-8">
          <div className="w-full max-w-sm animate-slide-up" key={view}>
            {view === "check-email" ? (
              <div className="text-center">
                <span className="inline-grid place-items-center w-16 h-16 rounded-2xl bg-primary-soft text-primary">
                  <MailCheck className="w-8 h-8" />
                </span>
                <h1 className="text-3xl font-bold mt-5">Check your email</h1>
                <p className="text-muted-foreground mt-3">
                  We sent a confirmation link to <strong className="text-foreground">{email}</strong>. Open it to finish creating your account.
                </p>
                <Button variant="outline" size="lg" className="w-full mt-8" onClick={() => switchView("sign-in")}>
                  Back to sign in
                </Button>
              </div>
            ) : (
              <>
                {view === "forgot" && (
                  <button
                    onClick={() => switchView("sign-in")}
                    className="inline-flex items-center gap-1 text-sm font-bold text-muted-foreground hover:text-foreground mb-6"
                  >
                    <ArrowLeft className="w-4 h-4" /> Back to sign in
                  </button>
                )}

                <h1 className="text-3xl sm:text-4xl font-bold">{copy[view].title}</h1>
                <p className="text-muted-foreground mt-2">{copy[view].sub}</p>

                {(view === "sign-in" || view === "sign-up") && (
                  <div role="tablist" aria-label="Account" className="grid grid-cols-2 gap-1 p-1 rounded-2xl bg-muted mt-7">
                    {(["sign-in", "sign-up"] as const).map((v) => (
                      <button
                        key={v}
                        role="tab"
                        aria-selected={view === v}
                        onClick={() => switchView(v)}
                        className={cn(
                          "h-11 rounded-xl text-sm font-bold transition-colors",
                          view === v ? "bg-card shadow-sm" : "text-muted-foreground hover:text-foreground",
                        )}
                      >
                        {v === "sign-in" ? "Sign in" : "Create account"}
                      </button>
                    ))}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5 mt-6">
                  {view !== "new-password" && (
                    <div className="space-y-1.5">
                      <label htmlFor="email" className="block text-sm font-bold">Email</label>
                      <Input
                        id="email"
                        type="email"
                        autoComplete="email"
                        inputMode="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={inputClass}
                      />
                    </div>
                  )}

                  {view !== "forgot" && (
                    <div>
                      <PasswordField
                        id="password"
                        label={view === "sign-in" ? "Password" : "New password"}
                        value={password}
                        onChange={setPassword}
                        autoComplete={view === "sign-in" ? "current-password" : "new-password"}
                      />
                      {view === "sign-in" ? (
                        <button
                          type="button"
                          onClick={() => switchView("forgot")}
                          className="mt-2 text-sm font-bold text-primary hover:underline"
                        >
                          Forgot password?
                        </button>
                      ) : (
                        <p className="mt-2 text-sm text-muted-foreground">At least {MIN_PASSWORD} characters.</p>
                      )}
                    </div>
                  )}

                  <div aria-live="polite">
                    {error && (
                      <p className="rounded-xl border-l-4 border-low bg-low/10 px-4 py-3 text-sm">{error}</p>
                    )}
                    {notice && (
                      <p className="rounded-xl border-l-4 border-in-range bg-in-range/10 px-4 py-3 text-sm">{notice}</p>
                    )}
                  </div>

                  <Button type="submit" size="lg" className="w-full" disabled={busy}>
                    {busy ? copy[view].busy : copy[view].action}
                  </Button>
                </form>
              </>
            )}
          </div>
        </div>

        <footer className="py-6 text-center text-sm text-muted-foreground">
          By continuing you agree to our{" "}
          <Link to="/terms" className="font-bold underline underline-offset-2 hover:text-foreground">Terms of Use</Link>
          {" "}and{" "}
          <Link to="/privacy" className="font-bold underline underline-offset-2 hover:text-foreground">Privacy Policy</Link>.
        </footer>
      </main>
    </div>
  );
};

export default AuthPage;
