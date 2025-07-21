
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
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
import { addUser, getUserByEmail } from "@/lib/data-service";
import { Logo } from "@/components/icons";
import { Loader2 } from "lucide-react";
import { sendOtp } from "@/ai/flows/send-otp-flow";

export default function SignupPage() {
  const [step, setStep] = useState(1); // 1 for details, 2 for OTP
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleGetOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Passwords do not match",
        description: "Please check your password and try again.",
      });
      return;
    }
    
    setIsLoading(true);
    try {
      const existingUser = await getUserByEmail(email);
      if (existingUser) {
        toast({
            variant: "destructive",
            title: "Email already exists",
            description: "Please use a different email or login.",
        });
        setIsLoading(false);
        return;
      }

      const response = await sendOtp({ email, name: firstName });
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

  const handleVerifyAndSignup = async (e: React.FormEvent) => {
    e.preventDefault();
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
      await addUser({ firstName, lastName, email, phone, password, role: "user" });
      await login(email, password);
      toast({
        title: "Account Created",
        description: "You have been logged in successfully.",
      });
      router.push("/");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Signup Failed",
        description: (error as Error).message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center items-center gap-3 mb-2">
            <Logo className="h-10 w-10 text-primary" />
            <CardTitle className="text-3xl">Court Commander</CardTitle>
          </div>
          <CardDescription>
            {step === 1 ? "Create a new account to book courts" : "Enter the OTP sent to your email"}
          </CardDescription>
        </CardHeader>
        {step === 1 ? (
          <form onSubmit={handleGetOtp}>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="m@example.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 animate-spin" />}
                Get OTP
              </Button>
            </CardFooter>
          </form>
        ) : (
          <form onSubmit={handleVerifyAndSignup}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp">OTP Code</Label>
                <Input id="otp" type="text" value={otp} onChange={(e) => setOtp(e.target.value)} required placeholder="Enter 6-digit code" />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
                <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 animate-spin" />}
                    Verify & Sign Up
                </Button>
                <Button variant="link" size="sm" onClick={() => setStep(1)}>
                    Back to details
                </Button>
            </CardFooter>
          </form>
        )}
        <p className="p-6 pt-0 text-xs text-center text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="underline hover:text-primary">
            Login
          </Link>
        </p>
      </Card>
    </div>
  );
}
