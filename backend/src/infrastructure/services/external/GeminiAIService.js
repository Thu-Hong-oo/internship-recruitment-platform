const { GoogleGenerativeAI } = require('@google/generative-ai');

class GeminiAIService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  }

  async generateEmbedding(text) {
    try {
      const result = await this.model.embedContent(text);
      return result.embedding.values;
    } catch (error) {
      throw new Error(`Gemini AI embedding failed: ${error.message}`);
    }
  }

  async analyzeCV(cvText) {
    try {
      const prompt = `
        Analyze this CV and extract the following information in JSON format:
        {
          "skills": ["skill1", "skill2", ...],
          "experience": [
            {
              "title": "Job Title",
              "company": "Company Name",
              "duration": "Duration",
              "description": "Job Description"
            }
          ],
          "education": [
            {
              "degree": "Degree Name",
              "institution": "Institution Name",
              "year": "Graduation Year"
            }
          ],
          "summary": "Brief professional summary",
          "strengths": ["strength1", "strength2", ...],
          "yearsOfExperience": number
        }
        
        CV Text: ${cvText}
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Try to parse JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      throw new Error('Failed to parse AI response as JSON');
    } catch (error) {
      throw new Error(`CV analysis failed: ${error.message}`);
    }
  }

  async extractSkills(text) {
    try {
      const prompt = `
        Extract all technical and soft skills from this text.
        Return only a JSON array of skills: ["skill1", "skill2", ...]
        
        Text: ${text}
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return [];
    } catch (error) {
      throw new Error(`Skill extraction failed: ${error.message}`);
    }
  }

  async extractExperience(text) {
    try {
      const prompt = `
        Extract work experience from this text.
        Return JSON array: [
          {
            "title": "Job Title",
            "company": "Company Name",
            "duration": "Duration",
            "description": "Job Description"
          }
        ]
        
        Text: ${text}
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return [];
    } catch (error) {
      throw new Error(`Experience extraction failed: ${error.message}`);
    }
  }

  async extractEducation(text) {
    try {
      const prompt = `
        Extract education information from this text.
        Return JSON array: [
          {
            "degree": "Degree Name",
            "institution": "Institution Name",
            "year": "Graduation Year"
          }
        ]
        
        Text: ${text}
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return [];
    } catch (error) {
      throw new Error(`Education extraction failed: ${error.message}`);
    }
  }

  async generateRoadmap(skillGaps, preferences = {}) {
    try {
      const prompt = `
        Create a learning roadmap to acquire these skills: ${skillGaps.join(
          ', '
        )}
        
        Preferences: ${JSON.stringify(preferences)}
        
        Return JSON format:
        {
          "title": "Roadmap Title",
          "description": "Brief description",
          "estimatedDuration": "X weeks",
          "phases": [
            {
              "name": "Phase Name",
              "description": "Phase Description",
              "duration": "X weeks",
              "skills": ["skill1", "skill2"],
              "resources": [
                {
                  "title": "Resource Title",
                  "type": "course|book|video|article",
                  "url": "Resource URL",
                  "difficulty": "beginner|intermediate|advanced"
                }
              ]
            }
          ]
        }
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      throw new Error('Failed to parse roadmap response as JSON');
    } catch (error) {
      throw new Error(`Roadmap generation failed: ${error.message}`);
    }
  }

  async calculateMatch(cvText, jobDescription) {
    try {
      const prompt = `
        Calculate the match percentage between this CV and job description.
        Consider skills, experience, education, and overall fit.
        
        CV: ${cvText}
        Job Description: ${jobDescription}
        
        Return JSON format:
        {
          "matchPercentage": number (0-100),
          "matchedSkills": ["skill1", "skill2"],
          "missingSkills": ["skill1", "skill2"],
          "strengths": ["strength1", "strength2"],
          "recommendations": ["recommendation1", "recommendation2"]
        }
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      throw new Error('Failed to parse match response as JSON');
    } catch (error) {
      throw new Error(`Match calculation failed: ${error.message}`);
    }
  }

  async generateJobRecommendations(candidateProfile, jobPreferences = {}) {
    try {
      const prompt = `
        Generate job recommendations based on this candidate profile:
        
        Profile: ${JSON.stringify(candidateProfile)}
        Preferences: ${JSON.stringify(jobPreferences)}
        
        Return JSON format:
        {
          "recommendations": [
            {
              "title": "Job Title",
              "company": "Company Name",
              "matchScore": number (0-100),
              "reason": "Why this job matches",
              "skillsNeeded": ["skill1", "skill2"],
              "salaryRange": "Salary range if available"
            }
          ]
        }
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      throw new Error('Failed to parse recommendations response as JSON');
    } catch (error) {
      throw new Error(`Job recommendations failed: ${error.message}`);
    }
  }

  async generateInterviewQuestions(jobDescription, candidateProfile) {
    try {
      const prompt = `
        Generate interview questions for this job and candidate:
        
        Job: ${jobDescription}
        Candidate: ${JSON.stringify(candidateProfile)}
        
        Return JSON format:
        {
          "questions": [
            {
              "question": "Question text",
              "type": "technical|behavioral|situational",
              "difficulty": "easy|medium|hard",
              "expectedAnswer": "What to look for in the answer"
            }
          ]
        }
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      throw new Error('Failed to parse questions response as JSON');
    } catch (error) {
      throw new Error(
        `Interview questions generation failed: ${error.message}`
      );
    }
  }

  async summarizeText(text, maxLength = 200) {
    try {
      const prompt = `
        Summarize this text in maximum ${maxLength} characters:
        
        ${text}
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      throw new Error(`Text summarization failed: ${error.message}`);
    }
  }

  async translateText(text, targetLanguage = 'en') {
    try {
      const prompt = `
        Translate this text to ${targetLanguage}:
        
        ${text}
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      throw new Error(`Translation failed: ${error.message}`);
    }
  }
}

module.exports = new GeminiAIService();
