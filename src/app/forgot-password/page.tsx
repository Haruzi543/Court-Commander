
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { getUserByEmail, updateUserPassword } from "@/lib/data-service";
import { Logo } from "@/components/icons";
import { Loader2 } from "lucide-react";
import { sendPasswordResetOtp } from "@/ai/flows/send-password-reset-flow";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(1); // 1 for email, 2 for OTP and new password
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const router = useRouter();
  const { toast } = useToast();

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const existingUser = await getUserByEmail(email);
      if (!existingUser) {
        toast({
            variant: "destructive",
            title: "User not found",
            description: "No account found with this email address.",
        });
        setIsLoading(false);
        return;
      }

      const response = await sendPasswordResetOtp({ email, name: existingUser.firstName });
      setGeneratedOtp(response.otp);
      setStep(2);
      toast({
        title: "OTP Sent",
        description: "An OTP has been sent to your email address.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to send OTP",
        description: (error as Error).message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Passwords do not match",
      });
      return;
    }

    if (otp !== generatedOtp) {
      toast({
        variant: "destructive",
        title: "Invalid OTP",
        description: "The OTP you entered is incorrect.",
      });
      return;
    }

    setIsLoading(true);
    try {
      await updateUserPassword(email, newPassword);
      toast({
        title: "Password Reset Successful",
        description: "You can now log in with your new password.",
      });
      router.push("/login");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Password Reset Failed",
        description: (error as Error).message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="flex justify-center items-center gap-3 mb-2">
            <Logo className="h-8 w-8 text-primary" />
            <CardTitle className="text-2xl">Forgot Password</CardTitle>
          </div>
          <CardDescription>
            {step === 1 ? "Enter your email to receive a reset code." : "Enter the OTP and your new password."}
          </CardDescription>
        </CardHeader>
        {step === 1 ? (
          <form onSubmit={handleSendOtp}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="m@example.com" />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 animate-spin" />}
                Send Reset Code
              </Button>
            </CardFooter>
          </form>
        ) : (
          <form onSubmit={handleResetPassword}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp">OTP Code</Label>
                <Input id="otp" type="text" value={otp} onChange={(e) => setOtp(e.target.value)} required placeholder="Enter 6-digit code" />
              </div>
               <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
                <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 animate-spin" />}
                    Reset Password
                </Button>
                <Button variant="link" size="sm" onClick={() => setStep(1)}>
                    Back to email
                </Button>
            </CardFooter>
          </form>
        )}
         <p className="p-6 pt-0 text-xs text-center text-muted-foreground">
            Remember your password?{" "}
            <Link href="/login" className="underline hover:text-primary">
                Login
            </Link>
        </p>
      </Card>
    </div>
  );
}
