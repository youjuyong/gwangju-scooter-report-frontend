import { Suspense } from "react";
import OAuth2Callback from "@/components/auth/CallbackInner";
import LoadingSpinner from "@/components/ui/LoadingSpinner"; 

export default function OAuthCallbackPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <OAuth2Callback />
    </Suspense>
  );
}