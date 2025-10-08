import { useState, useCallback } from "react";
import {
  ProfileData,
  EducationResponse,
  ExperienceResponse,
  SkillsResponse,
} from "@/lib/api";

// Mock data for development/testing - matches real API response structure
const mockProfile: ProfileData = {
  _id: "68e5ca3b6ca589bbe349bacd",
  userId: {
    _id: "68e5ca3b6ca589bbe349baca",
    email: "ktho16805@gmail.com",
    fullName: "Tám Tháng Mười",
    avatar: "default-avatar",
    isEmailVerified: true,
    preferences: {
      privacySettings: {
        profileVisibility: "public",
        showEmail: false,
        showPhone: false,
      },
      notifications: {
        emailNotifications: true,
        pushNotifications: true,
        jobAlerts: true,
        applicationUpdates: true,
      },
      language: "vi",
      timezone: "Asia/Ho_Chi_Minh",
    },
  },
  settings: {
    visibility: "public",
    searchable: true,
  },
  personalInfo: {
    fullName: "Tám Tháng Mười",
    phone: "0123456789",
    email: "ktho16805@gmail.com",
    bio: "This is a test profile",
    address: {
      country: "Vietnam",
    },
  },
  targetJob: {
    level: "entry",
    updatedAt: new Date().toISOString(),
  },
  education: {
    university: {
      _id: "68e5ca3b6ca589bbe349bacc",
      type: "university",
      institution: "Vietnam National University",
      degree: "Bachelor of Science",
      field: "Computer Science",
      startDate: "2020-09-01T00:00:00.000Z",
      endDate: "2024-06-30T00:00:00.000Z",
      gpa: 3.8,
      achievements: ["Dean's List", "Outstanding Student Award"],
      courses: [],
    },
    certifications: [
      {
        _id: "mock-cert-id",
        type: "certification",
        institution: "Coursera",
        degree: "Full Stack Web Development",
        field: "Web Development",
        startDate: "2023-01-15T00:00:00.000Z",
        endDate: "2023-04-15T00:00:00.000Z",
        achievements: ["Completed with Honors"],
        courses: [],
      },
    ],
  },
  skills: {
    technical: [
      {
        _id: "mock-tech-skill-1",
        type: "technical",
        name: "React",
        level: "intermediate",
        verified: true,
        projects: [],
      },
      {
        _id: "mock-tech-skill-2",
        type: "technical",
        name: "Node.js",
        level: "advanced",
        verified: false,
        projects: [],
      },
    ],
    soft: [
      {
        _id: "mock-soft-skill-1",
        type: "soft",
        name: "Team Leadership",
        level: "intermediate",
        selfAssessment: 4,
        projects: [],
      },
    ],
    languages: [
      {
        _id: "mock-lang-skill-1",
        type: "language",
        name: "English",
        level: "C1",
        certificate: "IELTS 7.5",
      },
    ],
  },
  experience: {
    internships: [
      {
        _id: "mock-internship-1",
        type: "internship",
        company: "FPT Software",
        position: "Backend Developer Intern",
        startDate: "2023-06-01T00:00:00.000Z",
        endDate: "2023-09-01T00:00:00.000Z",
        description: "Developed REST APIs using Node.js and Express",
        skills: ["Node.js", "Express", "MongoDB"],
        projects: [],
      },
    ],
    projects: [
      {
        _id: "mock-project-1",
        type: "project",
        name: "E-commerce Website",
        description: "Full-stack e-commerce platform",
        role: "Full Stack Developer",
        technologies: ["React", "Node.js", "MongoDB"],
        url: "https://github.com/test/ecommerce",
        startDate: "2023-01-01T00:00:00.000Z",
        endDate: "2023-05-01T00:00:00.000Z",
      },
    ],
  },
  preferences: {
    locations: ["Ho Chi Minh", "Ha Noi"],
    internshipTypes: ["full-time", "part-time"],
    industries: ["Technology", "Finance"],
    targetRoles: ["Software Engineer", "Full Stack Developer"],
  },
  resume: {
    current: {
      _id: "mock-resume-1",
      url: "https://example.com/resume.pdf",
      filename: "resume.pdf",
      displayName: "My Resume",
      size: 1024000,
      mimeType: "application/pdf",
      updatedAt: new Date().toISOString(),
    },
    history: [],
  },
  progress: {
    profileCompletion: 75,
    activeRoadmaps: [],
  },
  analytics: {
    applicationStats: {
      total: 5,
      pending: 2,
      interviews: 1,
      offers: 1,
      accepted: 1,
    },
    viewCount: 25,
    skillGrowth: [],
  },
  followedCompanies: [],
  status: "active",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const mockEducation: EducationResponse = {
  university: mockProfile.education.university,
  certifications: mockProfile.education.certifications,
};

const mockExperience: ExperienceResponse = {
  internships: mockProfile.experience.internships,
  projects: mockProfile.experience.projects,
};

const mockSkills: SkillsResponse = {
  technical: mockProfile.skills.technical,
  soft: mockProfile.skills.soft,
  languages: mockProfile.skills.languages,
};

export const useMockProfile = () => {
  const [profile, setProfile] = useState<ProfileData | null>(mockProfile);
  const [education, setEducation] = useState<EducationResponse | null>(
    mockEducation
  );
  const [experience, setExperience] = useState<ExperienceResponse | null>(
    mockExperience
  );
  const [skills, setSkills] = useState<SkillsResponse | null>(mockSkills);

  const [loading, setLoading] = useState({
    profile: false,
    education: false,
    experience: false,
    skills: false,
  });

  const [errors, setErrors] = useState({
    profile: null as string | null,
    education: null as string | null,
    experience: null as string | null,
    skills: null as string | null,
  });

  // Simulate API delay
  const simulateDelay = (ms: number = 500) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  const fetchProfile = useCallback(async (include?: string[]) => {
    setLoading((prev) => ({ ...prev, profile: true }));
    setErrors((prev) => ({ ...prev, profile: null }));

    await simulateDelay();

    setProfile(mockProfile);
    setLoading((prev) => ({ ...prev, profile: false }));
    return mockProfile;
  }, []);

  const fetchEducation = useCallback(async () => {
    setLoading((prev) => ({ ...prev, education: true }));
    setErrors((prev) => ({ ...prev, education: null }));

    await simulateDelay();

    setEducation(mockEducation);
    setLoading((prev) => ({ ...prev, education: false }));
    return mockEducation;
  }, []);

  const fetchExperience = useCallback(async () => {
    setLoading((prev) => ({ ...prev, experience: true }));
    setErrors((prev) => ({ ...prev, experience: null }));

    await simulateDelay();

    setExperience(mockExperience);
    setLoading((prev) => ({ ...prev, experience: false }));
    return mockExperience;
  }, []);

  const fetchSkills = useCallback(async () => {
    setLoading((prev) => ({ ...prev, skills: true }));
    setErrors((prev) => ({ ...prev, skills: null }));

    await simulateDelay();

    setSkills(mockSkills);
    setLoading((prev) => ({ ...prev, skills: false }));
    return mockSkills;
  }, []);

  const updateProfile = useCallback(async (section: string, data: any) => {
    await simulateDelay();
    console.log("Mock update profile:", section, data);
    return mockProfile;
  }, []);

  const addEducation = useCallback(async (data: any) => {
    await simulateDelay();
    console.log("Mock add education:", data);
    return mockEducation;
  }, []);

  const updateEducation = useCallback(async (id: string, data: any) => {
    await simulateDelay();
    console.log("Mock update education:", id, data);
    return mockEducation;
  }, []);

  const deleteEducation = useCallback(
    async (id: string) => {
      await simulateDelay();
      console.log("Mock delete education:", id);
      await fetchEducation();
    },
    [fetchEducation]
  );

  const addExperience = useCallback(async (data: any) => {
    await simulateDelay();
    console.log("Mock add experience:", data);
    return mockExperience;
  }, []);

  const updateExperience = useCallback(async (id: string, data: any) => {
    await simulateDelay();
    console.log("Mock update experience:", id, data);
    return mockExperience;
  }, []);

  const deleteExperience = useCallback(
    async (id: string) => {
      await simulateDelay();
      console.log("Mock delete experience:", id);
      await fetchExperience();
    },
    [fetchExperience]
  );

  const addSkill = useCallback(async (data: any) => {
    await simulateDelay();
    console.log("Mock add skill:", data);
    return mockSkills;
  }, []);

  const updateSkill = useCallback(async (id: string, data: any) => {
    await simulateDelay();
    console.log("Mock update skill:", id, data);
    return mockSkills;
  }, []);

  const deleteSkill = useCallback(
    async (id: string) => {
      await simulateDelay();
      console.log("Mock delete skill:", id);
      await fetchSkills();
    },
    [fetchSkills]
  );

  const clearCache = useCallback(() => {
    setProfile(mockProfile);
    setEducation(mockEducation);
    setExperience(mockExperience);
    setSkills(mockSkills);
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
