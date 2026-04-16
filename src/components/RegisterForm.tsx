"use client";

import {useEffect, useState} from "react";
import api from "@/services/api";
import {getDeptApi, getRegisterRoleApi, signUpApi} from "@/services/register/registerApi";
import {deptResponse, roleResponse} from "@/types/regiser";
import {toast} from "react-hot-toast";
import {useSqlValidator} from "@/hooks/useSqlValidator";



interface RegisterFormProps {
  onSuccess: () => void;
}

export default function RegisterForm({ onSuccess }: RegisterFormProps) {
  const [formData, setFormData] = useState({
    userId: "",
    pswd: "",
    userNm: "",
    deptId: "",
    emlAddr: "",
    telno: "",
  });
    const [roleList, setRoleList] = useState<roleResponse[]>([]);
    const [deptList, setDeptList] = useState<deptResponse[]>([]);
    const [cdId, setCdId] = useState<string>('');
    const { sqlValidate } = useSqlValidator(); // 훅 불러오기


  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

      const { userId, userNm, telno, pswd, emlAddr, deptId } = formData;

      if (!userId) return toast.error("아이디를 입력해주세요.");
      if (!userNm) return toast.error("이름을 입력해주세요.");
      if (!pswd) return toast.error("비밀번호를 입력해주세요.");
      if (!deptId) return toast.error("부서를 선택해주세요.");

      // SQL 인젝션 검사
      if (!sqlValidate(userId) || !sqlValidate(userNm)) {
          return; // 검사 탈락 시 중단
      }

    try {
      await signUpApi( formData);
      
      alert("회원가입 신청이 완료되었습니다.");
      onSuccess(); // 모달 닫기
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || "회원가입 신청 중 오류가 발생했습니다.";
      alert(errorMsg);
    }
  };

    // 역할 목록
    useEffect(() => {
        const fetchRoleList = async () => {
            try {
                const data = await getRegisterRoleApi();
                setRoleList(data);
            } catch (e) {
                toast.error("사용자 목록 조회 실패");
            }
        };
        fetchRoleList();
    }, []);

// 부서 목록 (cdId 변경 시마다)
    useEffect(() => {
        const fetchDeptList = async () => {
            if (!cdId) {
                setDeptList([]); // 선택된 값이 없으면 부서 목록 비우기
                return;
            }
            try {
                const data = await getDeptApi(cdId);
                setDeptList(data);
            } catch (e) {
                toast.error("부서 목록 조회 실패");
            }
        };

        fetchDeptList();
    }, [cdId]); // cdId가 바뀔 때만

  return (
      <form onSubmit={handleRegister} className="space-y-4">
          <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">아이디</label>
              <input
                  type="text"
                  placeholder="아이디를 입력하세요"
                  required
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-400 outline-none text-gray-800"
                  value={formData.userId}
                  onChange={(e) => setFormData({...formData, userId: e.target.value})}
              />
          </div>

          <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">이름</label>
              <input
                  type="text"
                  placeholder="성함을 입력하세요"
                  required
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-400 outline-none text-gray-800"
                  value={formData.userNm}
                  onChange={(e) => setFormData({...formData, userNm: e.target.value})}
              />
          </div>

          <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">휴대폰 번호</label>
              <input
                  type="tel"
                  placeholder="010-0000-0000"
                  required
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-400 outline-none text-gray-800"
                  value={formData.telno}
                  onChange={(e) => setFormData({...formData, telno: e.target.value})}
              />
          </div>

          <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">비밀번호</label>
              <input
                  type="password"
                  placeholder="비밀번호를 입력하세요"
                  required
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-400 outline-none text-gray-800"
                  value={formData.pswd}
                  onChange={(e) => setFormData({...formData, pswd: e.target.value})}
              />
          </div>
          <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">이메일 주소</label>
              <input
                  type="email"
                  placeholder="user@example.com"
                  required
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-400 outline-none text-gray-800"
                  value={formData.emlAddr}
                  onChange={(e) => setFormData({...formData, emlAddr: e.target.value})}
              />
          </div>
          <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">사용자 선택</label>
              <select className="text-gray-800"
                      value={cdId} onChange={e => setCdId(e.target.value)}>
                  <option value="">선택</option>
                  {roleList.map(opt => (
                      <option key={opt.cdId} value={opt.cdId}>{opt.cdNm}</option>
                  ))}
              </select>
          </div>
          <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">부서선택</label>
              <select className="text-gray-800"
                      value={formData.deptId} onChange={e => setFormData({...formData, deptId: e.target.value})}>
                  <option value="">선택</option>
                  {deptList.map(opt => (
                      <option key={opt.code} value={opt.code}>{opt.codeNm}</option>
                  ))}
              </select>
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