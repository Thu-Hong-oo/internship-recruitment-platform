import type { CVData } from "@/lib/mocks/cvSamples";

/**
 * Convert backend profile data to CVData format for CVEditor
 */
export function convertProfileToCVData(profile: any): CVData {
  return {
    templateId: 1, // Default to template 1 (modern)
    personal: {
      name: profile.personalInfo?.fullName || "",
      email: profile.personalInfo?.email || "",
      phone: profile.personalInfo?.phone || "",
      address: profile.personalInfo?.address || "",
      summary: profile.personalInfo?.summary || profile.personalInfo?.bio || "",
      avatar: profile.personalInfo?.avatar || undefined,
    },
    education: (profile.education || []).map((edu: any) => ({
      school: edu.institution || edu.school || "",
      degree: edu.degree || "",
      startDate: edu.startYear || edu.startDate || "",
      endDate: edu.endYear || edu.endDate || "",
    })),
    experience: (profile.experience || []).map((exp: any) => ({
      company: exp.company || "",
      role: exp.position || exp.role || "",
      startDate: exp.startDate || "",
      endDate: exp.endDate || "",
      description: exp.description || "",
      type: exp.type || "fulltime",
    })),
    skills: (profile.skills || []).map((skill: any) => 
      typeof skill === "string" ? skill : skill.name || ""
    ),
    projects: (profile.projects || []).map((proj: any) => ({
      title: proj.name || proj.title || "",
      description: proj.description || "",
    })),
    certifications: (profile.certifications || []).map((cert: any) => ({
      name: cert.name || "",
      issuer: cert.issuer || "",
      year: cert.year || "",
    })),
  };
}

