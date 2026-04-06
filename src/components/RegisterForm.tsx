"use client";

import { useState } from "react";
import api from "@/services/api";

interface RegisterFormProps {
  onSuccess: () => void;
}

export default function RegisterForm({ onSuccess }: RegisterFormProps) {
  const [formData, setFormData] = useState({
    loginId: "",
    password: "",
    name: "",
    phoneNumber: "",
  });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/auth/signup", formData); 
      
      alert("회원가입 신청이 완료되었습니다.");
      onSuccess(); // 모달 닫기
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || "회원가입 신청 중 오류가 발생했습니다.";
      alert(errorMsg);
    }
  };

  return (
    <form onSubmit={handleRegister} className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1">아이디</label>
        <input
          type="text"
          placeholder="아이디를 입력하세요"
          required
          className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-400 outline-none"
          value={formData.loginId}
          onChange={(e) => setFormData({ ...formData, loginId: e.target.value })}
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1">이름</label>
        <input
          type="text"
          placeholder="성함을 입력하세요"
          required
          className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-400 outline-none"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1">휴대폰 번호</label>
        <input
          type="tel"
          placeholder="010-0000-0000"
          required
          className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-400 outline-none"
          value={formData.phoneNumber}
          onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1">비밀번호</label>
        <input
          type="password"
          placeholder="비밀번호를 입력하세요"
          required
          className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-400 outline-none"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
        />
      </div>

      <button
        type="submit"
        className="w-full py-3 bg-black text-white font-bold rounded-xl mt-4 hover:bg-gray-800 transition-colors"
      >
        회원가입 신청하기
      </button>
    </form>
  );
}