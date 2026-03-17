import { Suspense } from "react";
import CallbackInner from "@/components/auth/CallbackInner";
import LoadingSpinner from "@/components/ui/LoadingSpinner"; 

export default function OAuthCallbackPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <CallbackInner />
    </Suspense>
  );
}