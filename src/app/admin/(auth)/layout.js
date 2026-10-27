"use client";

import { useAuth } from "@/common/hooks/useAuth";
import Loader from "@/common/components/Loader";

// Login, OTP, forgot/reset password and accept-invite. They read cookies and
// the stored navigation state (e.g. the OTP challenge id), which only exist in
// the browser, so they render once auth has loaded on the client.
export default function AuthLayout({ children }) {
  const { loading } = useAuth();
  return loading ? <Loader /> : children;
}
