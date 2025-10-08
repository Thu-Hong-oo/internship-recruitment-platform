import { useState, useCallback } from "react";
import { profileAPI } from "@/lib/api/profile";
import { useApiRateLimit } from "./useApiRateLimit";
import {
  ProfileData,
  EducationResponse,
  ExperienceResponse,
  SkillsResponse,
} from "@/lib/types/profile";

// Cache để lưu trữ dữ liệu đã tải
const dataCache = {
  profile: null as ProfileData | null,
  education: null as EducationResponse | null,
  experience: null as ExperienceResponse | null,
  skills: null as SkillsResponse | null,
};

// Cache loading states
const loadingCache = {
  profile: false,
  education: false,
  experience: false,
  skills: false,
};

export const useLazyProfile = () => {
  const { makeRequest } = useApiRateLimit({
    maxRequests: 5,
    timeWindow: 60000,
  });

  const [profile, setProfile] = useState<ProfileData | null>(dataCache.profile);
  const [education, setEducation] = useState<EducationResponse | null>(
    dataCache.education
  );
  const [experience, setExperience] = useState<ExperienceResponse | null>(
    dataCache.experience
  );
  const [skills, setSkills] = useState<SkillsResponse | null>(dataCache.skills);

  const [loading, setLoading] = useState({
    profile: loadingCache.profile,
    education: loadingCache.education,
    experience: loadingCache.experience,
    skills: loadingCache.skills,
  });

  const [errors, setErrors] = useState({
    profile: null as string | null,
    education: null as string | null,
    experience: null as string | null,
    skills: null as string | null,
  });

  // Fetch profile data
  const fetchProfile = useCallback(
    async (include?: string[]) => {
      if (dataCache.profile && !include) {
        setProfile(dataCache.profile);
        return dataCache.profile;
      }

      if (loadingCache.profile) return;

      setLoading((prev) => ({ ...prev, profile: true }));
      setErrors((prev) => ({ ...prev, profile: null }));
      loadingCache.profile = true;

      try {
        const response = await makeRequest(() =>
          profileAPI.getProfile(include)
        );
        dataCache.profile = response.data;
        setProfile(response.data);
        return response.data;
      } catch (err: any) {
        const errorMsg = err.message || "Failed to fetch profile";
        setErrors((prev) => ({ ...prev, profile: errorMsg }));
        throw err;
      } finally {
        setLoading((prev) => ({ ...prev, profile: false }));
        loadingCache.profile = false;
      }
    },
    [makeRequest]
  );

  // Fetch education data
  const fetchEducation = useCallback(async () => {
    if (dataCache.education) {
      setEducation(dataCache.education);
      return dataCache.education;
    }

    if (loadingCache.education) return;

    setLoading((prev) => ({ ...prev, education: true }));
    setErrors((prev) => ({ ...prev, education: null }));
    loadingCache.education = true;

    try {
      const response = await makeRequest(() => profileAPI.getEducation());
      dataCache.education = response.data;
      setEducation(response.data);
      return response.data;
    } catch (err: any) {
      const errorMsg = err.message || "Failed to fetch education";
      setErrors((prev) => ({ ...prev, education: errorMsg }));
      throw err;
    } finally {
      setLoading((prev) => ({ ...prev, education: false }));
      loadingCache.education = false;
    }
  }, [makeRequest]);

  // Fetch experience data
  const fetchExperience = useCallback(async () => {
    if (dataCache.experience) {
      setExperience(dataCache.experience);
      return dataCache.experience;
    }

    if (loadingCache.experience) return;

    setLoading((prev) => ({ ...prev, experience: true }));
    setErrors((prev) => ({ ...prev, experience: null }));
    loadingCache.experience = true;

    try {
      const response = await makeRequest(() => profileAPI.getExperience());
      dataCache.experience = response.data;
      setExperience(response.data);
      return response.data;
    } catch (err: any) {
      const errorMsg = err.message || "Failed to fetch experience";
      setErrors((prev) => ({ ...prev, experience: errorMsg }));
      throw err;
    } finally {
      setLoading((prev) => ({ ...prev, experience: false }));
      loadingCache.experience = false;
    }
  }, [makeRequest]);

  // Fetch skills data
  const fetchSkills = useCallback(async () => {
    if (dataCache.skills) {
      setSkills(dataCache.skills);
      return dataCache.skills;
    }

    if (loadingCache.skills) return;

    setLoading((prev) => ({ ...prev, skills: true }));
    setErrors((prev) => ({ ...prev, skills: null }));
    loadingCache.skills = true;

    try {
      const response = await makeRequest(() => profileAPI.getSkills());
      dataCache.skills = response.data;
      setSkills(response.data);
      return response.data;
    } catch (err: any) {
      const errorMsg = err.message || "Failed to fetch skills";
      setErrors((prev) => ({ ...prev, skills: errorMsg }));
      throw err;
    } finally {
      setLoading((prev) => ({ ...prev, skills: false }));
      loadingCache.skills = false;
    }
  }, [makeRequest]);

  // Update profile
  const updateProfile = useCallback(async (section: string, data: any) => {
    try {
      const response = await profileAPI.updateProfile(section, data);
      dataCache.profile = response.data;
      setProfile(response.data);
      return response.data;
    } catch (err: any) {
      setErrors((prev) => ({
        ...prev,
        profile: err.message || "Failed to update profile",
      }));
      throw err;
    }
  }, []);

  // Add education
  const addEducation = useCallback(
    async (data: any) => {
      try {
        const response = await makeRequest(() => profileAPI.addEducation(data));
        dataCache.education = response.data;
        setEducation(response.data);
        return response.data;
      } catch (err: any) {
        setErrors((prev) => ({
          ...prev,
          education: err.message || "Failed to add education",
        }));
        throw err;
      }
    },
    [makeRequest]
  );

  // Update education
  const updateEducation = useCallback(
    async (id: string, data: any) => {
      try {
        const response = await makeRequest(() =>
          profileAPI.updateEducation(id, data)
        );
        dataCache.education = response.data;
        setEducation(response.data);
        return response.data;
      } catch (err: any) {
        setErrors((prev) => ({
          ...prev,
          education: err.message || "Failed to update education",
        }));
        throw err;
      }
    },
    [makeRequest]
  );

  // Delete education
  const deleteEducation = useCallback(
    async (id: string) => {
      try {
        await profileAPI.deleteEducation(id);
        // Clear cache and refetch
        dataCache.education = null;
        await fetchEducation();
      } catch (err: any) {
        setErrors((prev) => ({
          ...prev,
          education: err.message || "Failed to delete education",
        }));
        throw err;
      }
    },
    [fetchEducation]
  );

  // Add experience
  const addExperience = useCallback(
    async (data: any) => {
      try {
        const response = await makeRequest(() =>
          profileAPI.addExperience(data)
        );
        dataCache.experience = response.data;
        setExperience(response.data);
        return response.data;
      } catch (err: any) {
        setErrors((prev) => ({
          ...prev,
          experience: err.message || "Failed to add experience",
        }));
        throw err;
      }
    },
    [makeRequest]
  );

  // Update experience
  const updateExperience = useCallback(
    async (id: string, data: any) => {
      try {
        const response = await makeRequest(() =>
          profileAPI.updateExperience(id, data)
        );
        dataCache.experience = response.data;
        setExperience(response.data);
        return response.data;
      } catch (err: any) {
        setErrors((prev) => ({
          ...prev,
          experience: err.message || "Failed to update experience",
        }));
        throw err;
      }
    },
    [makeRequest]
  );

  // Delete experience
  const deleteExperience = useCallback(
    async (id: string) => {
      try {
        await profileAPI.deleteExperience(id);
        // Clear cache and refetch
        dataCache.experience = null;
        await fetchExperience();
      } catch (err: any) {
        setErrors((prev) => ({
          ...prev,
          experience: err.message || "Failed to delete experience",
        }));
        throw err;
      }
    },
    [fetchExperience]
  );

  // Add skill
  const addSkill = useCallback(
    async (data: any) => {
      try {
        const response = await makeRequest(() => profileAPI.addSkill(data));
        dataCache.skills = response.data;
        setSkills(response.data);
        return response.data;
      } catch (err: any) {
        setErrors((prev) => ({
          ...prev,
          skills: err.message || "Failed to add skill",
        }));
        throw err;
      }
    },
    [makeRequest]
  );

  // Update skill
  const updateSkill = useCallback(
    async (id: string, data: any) => {
      try {
        const response = await makeRequest(() =>
          profileAPI.updateSkill(id, data)
        );
        dataCache.skills = response.data;
        setSkills(response.data);
        return response.data;
      } catch (err: any) {
        setErrors((prev) => ({
          ...prev,
          skills: err.message || "Failed to update skill",
        }));
        throw err;
      }
    },
    [makeRequest]
  );

  // Delete skill
  const deleteSkill = useCallback(
    async (id: string) => {
      try {
        await profileAPI.deleteSkill(id);
        // Clear cache and refetch
        dataCache.skills = null;
        await fetchSkills();
      } catch (err: any) {
        setErrors((prev) => ({
          ...prev,
          skills: err.message || "Failed to delete skill",
        }));
        throw err;
      }
    },
    [fetchSkills]
  );

  // Clear cache (useful for logout)
  const clearCache = useCallback(() => {
    dataCache.profile = null;
    dataCache.education = null;
    dataCache.experience = null;
    dataCache.skills = null;
    setProfile(null);
    setEducation(null);
    setExperience(null);
    setSkills(null);
  }, []);

  return {
    // Data
    profile,
    education,
    experience,
    skills,

    // Loading states
    loading,

    // Errors
    errors,

    // Fetch functions (lazy loading)
    fetchProfile,
    fetchEducation,
    fetchExperience,
    fetchSkills,

    // Update functions
    updateProfile,
    addEducation,
    updateEducation,
    deleteEducation,
    addExperience,
    updateExperience,
    deleteExperience,
    addSkill,
    updateSkill,
    deleteSkill,

    // Utility
    clearCache,
  };
};

