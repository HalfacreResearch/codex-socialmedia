import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";

export default function NotFound() {
  const [, setLocation] = useLocation();
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6 text-center px-4">
      <Zap className="h-12 w-12 text-amber-500" />
      <div>
        <h1 className="text-3xl font-bold">404</h1>
        <p className="text-muted-foreground mt-2">Page not found.</p>
      </div>
      <Button
        onClick={() => setLocation("/")}
        className="bg-amber-500 hover:bg-amber-400 text-black font-semibold"
      >
        Back to Dashboard
      </Button>
    </div>
  );
}
