export type CVPersonal = {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  summary?: string;
};

export type CVExperience = {
  company: string;
  role: string;
  startDate: string;
  endDate?: string;
  description?: string;
};

export type CVEducation = {
  school: string;
  degree: string;
  startDate: string;
  endDate?: string;
};

export type CVData = {
  personal: CVPersonal;
  experience: CVExperience[];
  education: CVEducation[];
  skills: string[];
  templateId: number;
};

export const sampleCVs: CVData[] = [
  {
    templateId: 1,
    personal: {
      name: "Nguyen Van A",
      email: "nguyenvana@example.com",
      phone: "0901 234 567",
      address: "Hanoi, Vietnam",
      summary: "Front-end developer with a passion for UX and performance.",
    },
    experience: [
      {
        company: "Awesome Co.",
        role: "Frontend Engineer",
        startDate: "2022-01",
        endDate: "2024-03",
        description: "Built React UI and optimized performance.",
      },
      {
        company: "Startup XYZ",
        role: "Web Developer",
        startDate: "2020-03",
        endDate: "2021-12",
        description: "Implemented landing pages and A/B tests.",
      },
    ],
    education: [
      {
        school: "HUST",
        degree: "B.Sc. Computer Science",
        startDate: "2016-09",
        endDate: "2020-06",
      },
    ],
    skills: ["React", "TypeScript", "Tailwind", "Next.js"],
  },
];


