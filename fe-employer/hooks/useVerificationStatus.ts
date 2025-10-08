import { useState, useEffect } from "react";
import { getToken } from "@/lib/userStorage";
import {
  getVerificationStatus,
  VerificationStatusResponse,
} from "@/lib/profileAPI";

export interface VerificationData {
  profileCompleted: boolean;
  companyCompleted: boolean;
  documentsCompleted: boolean;
  needsProfile: boolean;
  setupUrl?: string;
}

export function useVerificationStatus() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [verificationData, setVerificationData] =
    useState<VerificationData | null>(null);

  const fetchVerificationStatus = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = getToken();
      if (!token) {
        setError("Vui lòng đăng nhập");
        return;
      }

      const result = await getVerificationStatus(token);

      // Handle both successful responses and 400 status (profile not set up)
      if (result.data) {
        setVerificationData({
          profileCompleted: result.data.verificationProgress?.profile || false,
          companyCompleted: result.data.verificationProgress?.company || false,
          documentsCompleted:
            result.data.verificationProgress?.documents || false,
          needsProfile: result.needsProfile || false,
          setupUrl: result.setupUrl,
        });
      } else if (result.needsProfile) {
        // Handle case where profile needs to be set up (400 status)
        setVerificationData({
          profileCompleted: false,
          companyCompleted: false,
          documentsCompleted: false,
          needsProfile: true,
          setupUrl: result.setupUrl,
        });
      } else {
        setError(result.message || "Không thể tải trạng thái xác thực");
      }
    } catch (err: any) {
      setError(err.message || "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVerificationStatus();
  }, []);

  const refreshVerificationStatus = () => {
    fetchVerificationStatus();
  };

  const isFullyVerified = verificationData
    ? verificationData.profileCompleted &&
      verificationData.companyCompleted &&
      verificationData.documentsCompleted
    : false;

  const completedSteps = verificationData
    ? [
        verificationData.profileCompleted,
        verificationData.companyCompleted,
        verificationData.documentsCompleted,
      ].filter(Boolean).length
    : 0;

  const totalSteps = 3;
  const progressPercentage = (completedSteps / totalSteps) * 100;

  return {
    loading,
    error,
    verificationData,
    isFullyVerified,
    completedSteps,
    totalSteps,
    progressPercentage,
    refreshVerificationStatus,
  };
}
