'use client';

import { useEffect } from 'react';
import api from "@/services/api";

export default function NoticeViewCounter({ ntcId }: { ntcId: string }) {
  useEffect(() => {
        api.post("/ntc/increment-view", { ntcId: ntcId })
        .catch(err => console.error("조회수 증가 실패:", err));
  }, [ntcId]);
  return null; 
}