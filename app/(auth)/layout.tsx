import type { ReactNode } from "react";
import Image from "next/image";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4 py-10">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-10">
          <Image
            src="/logo.png"
            alt="Prophetic Pathway"
            width={220}
            height={80}
            priority
            className="h-auto w-55 object-contain"
          />
        </div>
        {children}
      </div>
    </div>
  );
}
