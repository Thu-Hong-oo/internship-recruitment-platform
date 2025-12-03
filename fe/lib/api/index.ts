// Export everything
export * from "./types";
export * from "./config";
export { apiClient } from "./client";
export { authService } from "./services/auth.service";
export { jobService } from "./services/job.service";
export { candidateService } from "./services/candidate.service";
export { profileService } from "./services/profile.service";
export { industryService } from "./services/industry.service";
export { skillService } from "./services/skill.service";
export { aiService } from "./services/ai.service";
export { nlpService } from "./services/nlp.service";

// Convenient API object (backward compatible)
import { authService } from "./services/auth.service";
import { jobService } from "./services/job.service";
import { candidateService } from "./services/candidate.service";
import { profileService } from "./services/profile.service";
import { industryService } from "./services/industry.service";
import { skillService } from "./services/skill.service";
import { aiService } from "./services/ai.service";
import { nlpService } from "./services/nlp.service";
import { apiClient } from "./client";

export const api = {
  auth: authService,
  jobs: jobService,
  candidateCV: candidateService,
  profile: profileService,
  industries: industryService,
  skills: skillService,
  ai: aiService,
  nlp: nlpService,
  client: apiClient,
};

// Legacy exports for backward compatibility
export const authAPI = authService;
export const jobsAPI = jobService;
export const candidateCVAPI = candidateService;
export const profileAPI = profileService;
export const industriesAPI = industryService;
export const skillsAPI = skillService;
