"use client";
import { Icon } from "@/components/ui/Icon";
import { useState, Suspense, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorBanner, PasswordInput } from "../_components";

import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Resetovanje lozinke | Splashdeals",
  description: "Postavite novu lozinku za vaš Splashdeals nalog.",
}

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const callbackUrl = searchParams.get("callbackUrl") || "/auth/login";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!token) return;

    if (password.length < 8) {
      setError("Password security failure: Minimum 8 characters required.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Validation mismatch: Passwords do not match.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { error: resetError } = await authClient.resetPassword({
        newPassword: password,
        token,
      });

      if (resetError) {
        setError(resetError.message || "The reset link has expired or is invalid. Please request a new link.");
        setLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push(callbackUrl);
      }, 3000);
    } catch {
      setError("Network encryption failure. Please verify your connection.");
      setLoading(false);
    }
  }

  if (!token && !success) {
    return (
      <Card className="border-red-500/10 bg-red-500/5 backdrop-blur-2xl p-8 text-center space-y-6">
        <div className="h-16 w-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto text-red-400">
          <Icon name="error" className="text-[32px]" />
        </div>
        <div className="space-y-2">
          <h2 className="text-lg font-black uppercase tracking-tight text-red-400">Invalid Token</h2>
          <p className="text-xs text-slate-500 font-medium leading-relaxed" role="alert">
            The password reset token is missing or malformed. Please request a new link.
          </p>
        </div>
        <Button asChild className="bg-red-500 hover:bg-red-600 text-white font-black uppercase tracking-widest text-[10px] rounded-xl px-8 h-10">
          <Link href={`/auth/forgot-password?callbackUrl=${encodeURIComponent(callbackUrl)}`}>Request New Token</Link>
        </Button>
      </Card>
    );
  }

  return (
    <div>
      <Card className="border-white/5 bg-white/5 backdrop-blur-2xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] overflow-hidden">
        <CardHeader className="space-y-1 pb-8">
          <CardTitle className="text-2xl font-black uppercase tracking-tight text-center">
            {success ? "Success" : "Define New Secret"}
          </CardTitle>
          <CardDescription className="text-center text-slate-500 font-medium text-xs leading-relaxed">
            {success 
              ? "Your administrative credentials have been updated successfully."
              : "Establish a robust new password for your partner account."
            }
          </CardDescription>
        </CardHeader>

        <CardContent className="grid gap-6">
          {success ? (
            <div className="flex flex-col items-center py-4 space-y-6">
              <div className="h-20 w-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Icon name="check_circle" className="text-[40px]" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-sm font-black uppercase tracking-widest text-emerald-400">Identity Updated</h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  Redirecting to the secure login gateway in 3 seconds...
                </p>
              </div>
              <Button asChild variant="ghost" className="text-cyan-500 text-[10px] font-black uppercase tracking-widest">
                  <Link href={callbackUrl}>Click if not redirected</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {error && <ErrorBanner message={error} />}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="new-password" className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
                    New Security Credential
                  </Label>
                  <PasswordInput
                    id="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    showPassword={showPassword}
                    onToggle={() => setShowPassword(!showPassword)}
                    placeholder="Min. 8 characters"
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password" className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
                    Confirm New Credential
                  </Label>
                  <PasswordInput
                    id="confirm-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    showPassword={showPassword}
                    onToggle={() => setShowPassword(!showPassword)}
                    placeholder="Repeat password"
                    disabled={loading}
                  />
                </div>

                <Button 
                  type="submit" 
                  disabled={loading || !password || !confirmPassword}
                  className="w-full h-12 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black uppercase tracking-widest text-xs rounded-xl shadow-lg shadow-cyan-500/20 group transition-all"
                >
                  {loading ? (
                    <Icon name="progress_activity" className="text-[16px] animate-spin" />
                  ) : (
                    <span className="flex items-center gap-2">
                      Update Security Key
                      <Icon name="security" className="text-[16px]" />
                    </span>
                  )}
                </Button>
              </form>
            </div>
          )}
        </CardContent>

        {!success && (
          <CardFooter className="justify-center border-t border-white/5 bg-black/20 py-4">
            <p className="text-[9px] text-slate-600 font-medium uppercase tracking-tight text-center">
              Recovery Session Active &bull; IP: logged
            </p>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense 
      fallback={
        <div className="flex items-center justify-center">
          <Icon name="progress_activity" className="text-[32px] animate-spin text-cyan-500/50" />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
