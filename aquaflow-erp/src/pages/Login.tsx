import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { FormInput } from "@/components/forms";
import { validationRules } from "@/lib/validations";
import { useAuth } from "@/hooks/useAuth";
import { AppLogo } from "@/components/AppLogo";
import { Helmet } from "react-helmet-async";

const structuredData = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Prawns Accounting",
  "applicationCategory": "BusinessApplication",
  "description": "Comprehensive enterprise resource planning (ERP) and accounting software for aquaculture and prawn trading businesses.",
  "operatingSystem": "Web",
  "url": "https://prawns-accounting.vercel.app/login"
};

interface LoginFormData {
  identifier: string;
  password: string;
}

export default function Login() {
  const { login, isLoading, error } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    mode: "onBlur",
    defaultValues: { identifier: "", password: "" },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data.identifier, data.password);
    } catch {
      // error is handled by useAuth hook
    }
  };

  return (
    <>
      <Helmet>
        <title>Login | Prawns Accounting</title>
        <meta name="description" content="Sign in to Prawns Accounting to manage your aquaculture inventory, sales, expenses, and customers." />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://prawns-accounting.vercel.app/login" />
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      </Helmet>
    <div className="min-h-screen bg-background flex">
      {/* Left brand panel */}
      <div className="hidden lg:flex lg:w-1/2 brand-gradient flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <div className="bg-white rounded-xl px-3 py-2">
            <AppLogo size="md" />
          </div>
          <span className="font-display font-bold text-xl text-white">Prawns Accounting</span>
        </div>
        <div>
          <h2 className="font-display text-4xl font-bold text-white leading-tight">
            Manage your entire aquaculture business from one place.
          </h2>
          <p className="mt-4 text-white/70 text-lg">Inventory · Sales · Billing · Reports · </p>
        </div>
        <p className="text-white/50 text-sm">© 2026 Prawns Accounting. All rights reserved.</p>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <AppLogo size="sm" />
            <span className="font-display font-bold text-lg text-foreground">Prawns Accounting</span>
          </div>

          <h1 className="font-display text-2xl font-bold text-foreground">Welcome back</h1>
          <p className="mt-1 text-sm text-muted-foreground">Sign in to your workspace</p>

          {error && (
            <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <p className="text-sm font-medium text-destructive">{error}</p>
            </div>
          )}
          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
            <FormInput
              label="Email or Phone Number"
              placeholder="Enter your email or phone number"
              {...register("identifier", validationRules.required)}
              error={errors.identifier}
            />

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-display font-medium text-foreground">
                  Password <span className="text-destructive">*</span>
                </label>
              </div>
              <input
                type="password"
                placeholder="••••••••"
                {...register("password", validationRules.password)}
                className={`w-full h-10 px-3 rounded-lg border transition-colors text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-offset-0 bg-surface ${errors.password
                    ? "border-destructive focus:ring-destructive/50"
                    : "border-border focus:ring-brand/50"
                  }`}
              />
              {errors.password && (
                <p className="text-xs text-destructive mt-1.5">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-10 rounded-lg bg-brand text-white text-sm font-display font-semibold hover:bg-brand/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                "Sign in"
              )}
            </button>
          </form>
          
          <div className="mt-8 pt-6 border-t border-border">
            <p className="text-center text-xs text-muted-foreground">
              developed by IndentDev 6301253789
            </p>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
