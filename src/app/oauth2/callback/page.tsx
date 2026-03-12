import { Suspense } from "react";
import CallbackInner from "@/components/auth/CallbackInner"; 

export default function OAuthCallbackPage() {
  return (
    <Suspense fallback={<div>로그인 처리 중...</div>}>
      <CallbackInner />
    </Suspense>
  );
}