
import React from "react";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md bg-background rounded-lg shadow-lg p-8">
        <div className="flex justify-center mb-6">
          <h2 className="text-3xl font-bold text-primary">FoodPOS</h2>
        </div>
        {children}
      </div>
    </div>
  );
}
