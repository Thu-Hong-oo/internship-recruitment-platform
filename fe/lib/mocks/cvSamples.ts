export type CVPersonal = {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  summary?: string;
  avatar?: string;
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

export type CVProject = {
  title: string;
  description?: string;
};

export type CVLanguage = {
  name: string;
  level?: string;
  rating?: number; // 0-5
};

export type CVCertification = {
  name: string;
  issuer?: string;
  year?: string;
};

export type CVSocial = {
  label: string;
  url: string;
};

export type CVData = {
  personal: CVPersonal;
  experience: CVExperience[];
  education: CVEducation[];
  skills: string[];
  templateId: number;
  projects?: CVProject[];
  languages?: CVLanguage[];
  certifications?: CVCertification[];
  social?: CVSocial[];
  sectionTitles?: {
    [key: string]: string; // e.g., "education": "Kinh nghiệm học tập", "references": "Người tham khảo"
  };
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
    projects: [
      {
        title: "Tour Tuyến Phía Bắc",
        description: "Gói tour 5 ngày khám phá Sapa, Hạ Long.",
      },
      {
        title: "Ứng Dụng Đặt Tour",
        description: "Ứng dụng đặt tour, tăng khách hàng trực tuyến.",
      },
    ],
    languages: [
      { name: "Tiếng Việt", level: "Native", rating: 5 },
      { name: "Tiếng Anh", level: "Trôi chảy", rating: 4 },
      { name: "Tiếng Trung", level: "Cơ bản", rating: 2 },
    ],
    certifications: [
      {
        name: "Hướng Dẫn Viên Cấp A",
        issuer: "Sở Du Lịch Hà Nội",
        year: "2020",
      },
      { name: "Quản Lý Du Lịch Bền Vững", issuer: "UNWTO", year: "2021" },
      {
        name: "Hỗ Trợ Khách Hàng",
        issuer: "Hotel Management Academy",
        year: "2019",
      },
    ],
    social: [
      { label: "LinkedIn", url: "#" },
      { label: "Facebook", url: "#" },
      { label: "Instagram", url: "#" },
      { label: "Website", url: "#" },
    ],
  },
];
