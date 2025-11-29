import { useState, useEffect } from "react";
import { getToken } from "@/lib/userStorage";
import { getEmployerProfile } from "@/lib/api";

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

      const result = await getEmployerProfile(token);

      // Debug logging
      console.log("Profile API Response:", result);

      // Handle successful response from /employers/profile endpoint
      if (result.success && result.data) {
        const profile = result.data;
        const completion = profile.completion;
        
        // Debug logging
        console.log("Completion data:", completion);
        console.log("Completion sections:", completion?.sections);
        
        // Check if completion exists and has sections
        if (completion && completion.sections) {
          // Check completion status from completion.sections
          // But also verify that data is not just placeholder data
          const personalInfoComplete = completion.sections.personalInfo?.isComplete === true;
          const companyInfoComplete = completion.sections.companyInfo?.isComplete === true;
          const documentsComplete = completion.sections.documents?.isComplete === true;

          // Additional check: verify if data is actually filled (not placeholder)
          // Check each section specifically
          
          // Personal Info: check if position fields are filled (not empty)
          const personalInfoActuallyComplete = personalInfoComplete && 
            profile.position?.title !== "" && 
            profile.position?.level !== "" && 
            profile.position?.department !== "";

          // Company Info: check if address fields are not placeholder
          const companyInfoActuallyComplete = companyInfoComplete &&
            profile.businessInfo?.address?.street !== "Chưa cập nhật" &&
            profile.businessInfo?.address?.ward !== "Chưa cập nhật" &&
            profile.businessInfo?.address?.district !== "Chưa cập nhật" &&
            profile.businessInfo?.address?.city !== "Chưa cập nhật" &&
            profile.businessInfo?.issuePlace !== "Chưa cập nhật" &&
            !profile.company?.email?.includes('placeholder.company');
          
          // Documents: check if documents are actually uploaded
          const documentsActuallyComplete = documentsComplete &&
            profile.verification?.documents &&
            profile.verification.documents.length > 0;

          console.log("Completion status:", {
            personalInfo: personalInfoComplete,
            companyInfo: companyInfoComplete,
            documents: documentsComplete,
            personalInfoActuallyComplete,
            companyInfoActuallyComplete,
            documentsActuallyComplete,
          });

          // Use actual completion status (checking for placeholder data)
          setVerificationData({
            profileCompleted: personalInfoActuallyComplete,
            companyCompleted: companyInfoActuallyComplete,
            documentsCompleted: documentsActuallyComplete,
            needsProfile: false,
          });
        } else {
          // Completion data not available, assume nothing is completed
          console.log("Completion data not available, assuming incomplete");
        setVerificationData({
            profileCompleted: false,
            companyCompleted: false,
            documentsCompleted: false,
            needsProfile: false,
        });
        }
      } else {
        // Handle case where profile is not set up or error
        console.log("Profile not set up or error:", result);
        setVerificationData({
          profileCompleted: false,
          companyCompleted: false,
          documentsCompleted: false,
          needsProfile: true,
        });
      }
    } catch (err: any) {
      setError(err.message || "Có lỗi xảy ra");
      // On error, assume profile needs to be set up
      setVerificationData({
        profileCompleted: false,
        companyCompleted: false,
        documentsCompleted: false,
        needsProfile: true,
      });
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
