import { useState, useEffect, useCallback } from "react";
import { profileAPI } from "@/lib/api";
import { useApiRateLimit } from "./useApiRateLimit";
import {
  ProfileData,
  EducationResponse,
  ExperienceResponse,
  SkillsResponse,
} from "@/lib/api";

export const useProfile = (include?: string[]) => {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { makeRequest } = useApiRateLimit({
    maxRequests: 5,
    timeWindow: 60000,
  });

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await makeRequest(() => profileAPI.getProfile(include));
      setProfile(response.data);
    } catch (err: any) {
      setError(err.message || "Failed to fetch profile");
    } finally {
      setLoading(false);
    }
  }, [include, makeRequest]);

  useEffect(() => {
    // Add a small delay to prevent rapid API calls
    const timeoutId = setTimeout(() => {
      fetchProfile();
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [fetchProfile]);

  const updateProfile = useCallback(async (section: string, data: any) => {
    try {
      const response = await profileAPI.updateProfile(section, data);
      setProfile(response.data);
      return response.data;
    } catch (err: any) {
      setError(err.message || "Failed to update profile");
      throw err;
    }
  }, []);

  return {
    profile,
    loading,
    error,
    fetchProfile,
    updateProfile,
  };
};

export const useEducation = () => {
  const [education, setEducation] = useState<EducationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { makeRequest } = useApiRateLimit({
    maxRequests: 5,
    timeWindow: 60000,
  });

  const fetchEducation = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await makeRequest(() => profileAPI.getEducation());
      setEducation(response.data);
    } catch (err: any) {
      setError(err.message || "Failed to fetch education");
    } finally {
      setLoading(false);
    }
  }, [makeRequest]);

  const addEducation = useCallback(
    async (data: any) => {
      try {
        const response = await makeRequest(() => profileAPI.addEducation(data));
        setEducation(response.data);
        return response.data;
      } catch (err: any) {
        setError(err.message || "Failed to add education");
        throw err;
      }
    },
    [makeRequest]
  );

  const updateEducation = useCallback(
    async (id: string, data: any) => {
      try {
        const response = await makeRequest(() =>
          profileAPI.updateEducation(id, data)
        );
        setEducation(response.data);
        return response.data;
      } catch (err: any) {
        setError(err.message || "Failed to update education");
        throw err;
      }
    },
    [makeRequest]
  );

  const deleteEducation = useCallback(
    async (id: string) => {
      try {
        await profileAPI.deleteEducation(id);
        await fetchEducation(); // Refresh data
      } catch (err: any) {
        setError(err.message || "Failed to delete education");
        throw err;
      }
    },
    [fetchEducation]
  );

  useEffect(() => {
    fetchEducation();
  }, [fetchEducation]);

  return {
    education,
    loading,
    error,
    fetchEducation,
    addEducation,
    updateEducation,
    deleteEducation,
  };
};

export const useExperience = () => {
  const [experience, setExperience] = useState<ExperienceResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchExperience = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await profileAPI.getExperience();
      setExperience(response.data);
    } catch (err: any) {
      setError(err.message || "Failed to fetch experience");
    } finally {
      setLoading(false);
    }
  }, []);

  const addExperience = useCallback(async (data: any) => {
    try {
      const response = await profileAPI.addExperience(data);
      setExperience(response.data);
      return response.data;
    } catch (err: any) {
      setError(err.message || "Failed to add experience");
      throw err;
    }
  }, []);

  const updateExperience = useCallback(async (id: string, data: any) => {
    try {
      const response = await profileAPI.updateExperience(id, data);
      setExperience(response.data);
      return response.data;
    } catch (err: any) {
      setError(err.message || "Failed to update experience");
      throw err;
    }
  }, []);

  const deleteExperience = useCallback(
    async (id: string) => {
      try {
        await profileAPI.deleteExperience(id);
        await fetchExperience(); // Refresh data
      } catch (err: any) {
        setError(err.message || "Failed to delete experience");
        throw err;
      }
    },
    [fetchExperience]
  );

  useEffect(() => {
    fetchExperience();
  }, [fetchExperience]);

  return {
    experience,
    loading,
    error,
    fetchExperience,
    addExperience,
    updateExperience,
    deleteExperience,
  };
};

export const useSkills = () => {
  const [skills, setSkills] = useState<SkillsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSkills = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await profileAPI.getSkills();
      setSkills(response.data);
    } catch (err: any) {
      setError(err.message || "Failed to fetch skills");
    } finally {
      setLoading(false);
    }
  }, []);

  const addSkill = useCallback(async (data: any) => {
    try {
      const response = await profileAPI.addSkill(data);
      setSkills(response.data);
      return response.data;
    } catch (err: any) {
      setError(err.message || "Failed to add skill");
      throw err;
    }
  }, []);

  const updateSkill = useCallback(async (id: string, data: any) => {
    try {
      const response = await profileAPI.updateSkill(id, data);
      setSkills(response.data);
      return response.data;
    } catch (err: any) {
      setError(err.message || "Failed to update skill");
      throw err;
    }
  }, []);

  const deleteSkill = useCallback(
    async (id: string) => {
      try {
        await profileAPI.deleteSkill(id);
        await fetchSkills(); // Refresh data
      } catch (err: any) {
        setError(err.message || "Failed to delete skill");
        throw err;
      }
    },
    [fetchSkills]
  );

  useEffect(() => {
    fetchSkills();
  }, [fetchSkills]);

  return {
    skills,
    loading,
    error,
    fetchSkills,
    addSkill,
    updateSkill,
    deleteSkill,
  };
};
