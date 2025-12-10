"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getToken } from "@/lib/userStorage";

interface Props {
  children: React.ReactNode;
}

// Gate that ensures routes are protected based on presence of token in storage.
// - If token exists and user visits public routes (login/register/verify), redirect to /dashboard
// - If no token and user visits protected routes, redirect to /
// - Do not render UI until decision is made (avoid flicker)
export default function AuthGate({ children }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Public routes that don't require authentication
    const publicRoutes = new Set<string>([
      "/",
      "/register",
      "/email-verification",
      "/invitations/accept",
    ]);

    const token = getToken();
    const isPublic = publicRoutes.has(pathname || "/");

    if (token) {
      // Authenticated: send away from public pages to dashboard
      if (isPublic) {
        router.replace("/dashboard");
        return;
      }
      setReady(true);
      return;
    }

    // Not authenticated: allow only public pages
    if (!isPublic) {
      router.replace("/");
      return;
    }

    setReady(true);
  }, [pathname, router]);

  if (!ready) return null; // Avoid rendering before auth check completes
  return <>{children}</>;
}
