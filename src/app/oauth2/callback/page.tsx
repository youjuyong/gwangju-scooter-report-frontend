import { Suspense } from "react";
import CallbackInner from "@/components/auth/CallbackInner";
import LoadingSpinner from "@/components/ui/LoadingSpinner"; 

export default function OAuthCallbackPage() {
  return (
    // 2. fallback을 LoadingSpinner로 교체
    <Suspense fallback={<LoadingSpinner />}>
      <CallbackInner />
    </Suspense>
  );
}