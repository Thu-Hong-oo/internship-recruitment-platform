const mongoose = require('mongoose');

// Sample Applications Data
const sampleApplications = [
  // Application 1: Frontend Developer Intern at FPT
  {
    job: null, // Will be set dynamically
    applicant: null, // Will be set dynamically
    status: 'shortlisted',
    resume: {
      url: 'https://example.com/resumes/nguyen-van-an-resume.pdf',
      filename: 'nguyen-van-an-resume.pdf',
      uploadedAt: new Date('2024-04-15')
    },
    coverLetter: {
      content: 'Tôi là Nguyễn Văn An, sinh viên năm 3 ngành Công nghệ thông tin tại Đại học Bách khoa TP.HCM. Tôi rất quan tâm đến vị trí Frontend Developer Intern tại FPT Software vì đây là cơ hội tuyệt vời để học hỏi và phát triển kỹ năng trong môi trường chuyên nghiệp. Tôi đã có kinh nghiệm với React, JavaScript và các công nghệ frontend khác thông qua các dự án cá nhân và hackathons. Tôi mong muốn được đóng góp vào các dự án thực tế và học hỏi từ các developer có kinh nghiệm.',
      lastModified: new Date('2024-04-15')
    },
    additionalInfo: {
      availableStartDate: new Date('2024-06-01'),
      expectedSalary: {
        amount: 7000000,
        currency: 'VND'
      },
      workPreference: 'hybrid',
      motivationLetter: 'Tôi đam mê lập trình web và luôn tìm hiểu các công nghệ mới. Tôi tin rằng môi trường làm việc tại FPT sẽ giúp tôi phát triển toàn diện cả về kỹ thuật và kỹ năng mềm.'
    },
    aiAnalysis: {
      overallScore: 85,
      skillsMatch: {
        matched: ['JavaScript', 'React', 'HTML', 'CSS'],
        missing: ['TypeScript'],
        additional: ['Vue.js', 'Git'],
        score: 88
      },
      experienceMatch: {
        relevantExperience: ['Web development projects', 'Hackathon participation'],
        experienceGap: ['Enterprise-level projects', 'Team collaboration'],
        score: 75
      },
      educationMatch: {
        relevantEducation: true,
        educationLevel: 'Bachelor',
        score: 90
      },
      strengthsWeaknesses: {
        strengths: ['Strong technical foundation', 'Good problem-solving skills', 'Eager to learn'],
        weaknesses: ['Limited enterprise experience', 'No TypeScript experience'],
        recommendations: ['Learn TypeScript basics', 'Contribute to open source projects']
      },
      resumeQuality: {
        score: 82,
        feedback: ['Well-structured', 'Clear project descriptions', 'Good formatting'],
        suggestions: ['Add more quantifiable achievements', 'Include GitHub links']
      },
      fitScore: {
        cultural: 85,
        technical: 80,
        overall: 83
      },
      lastAnalyzed: new Date('2024-04-15')
    },
    interviews: [
      {
        type: 'phone',
        scheduledAt: new Date('2024-04-20T10:00:00Z'),
        duration: 30,
        interviewer: {
          name: 'Phạm Thị Dung',
          email: 'hr@fpt.com.vn',
          role: 'HR Manager'
        },
        status: 'completed',
        feedback: {
          technical: {
            score: 8,
            comments: 'Có kiến thức cơ bản tốt về frontend, cần học thêm TypeScript'
          },
          communication: {
            score: 9,
            comments: 'Giao tiếp tốt, thể hiện sự nhiệt huyết và ham học hỏi'
          },
          cultural: {
            score: 8,
            comments: 'Phù hợp với văn hóa công ty, có tinh thần teamwork'
          },
          overall: {
            score: 8,
            recommendation: 'hire',
            comments: 'Ứng viên tiềm năng, phù hợp với vị trí intern'
          }
        },
        notes: 'Sinh viên có tiềm năng, cần đào tạo thêm về TypeScript và quy trình làm việc'
      }
    ],
    feedback: {
      fromEmployer: {
        rating: 4,
        comments: 'Ứng viên có kiến thức cơ bản tốt và thái độ học hỏi tích cực',
        privateNotes: 'Có thể shortlist cho vòng technical interview',
        tags: ['promising', 'needs-training']
      }
    },
    communications: [
      {
        type: 'email',
        from: 'employer',
        subject: 'Xác nhận nộp đơn ứng tuyển',
        content: 'Cảm ơn bạn đã nộp đơn ứng tuyển vị trí Frontend Developer Intern. Chúng tôi sẽ xem xét hồ sơ và liên hệ trong vòng 1 tuần.',
        timestamp: new Date('2024-04-15T09:00:00Z'),
        read: true
      },
      {
        type: 'email',
        from: 'employer',
        subject: 'Mời phỏng vấn vòng 1',
        content: 'Chúc mừng! Bạn đã được mời tham gia phỏng vấn vòng 1 qua điện thoại vào ngày 20/04/2024 lúc 17:00.',
        timestamp: new Date('2024-04-18T14:00:00Z'),
        read: true,
        important: true
      }
    ],
    timeline: [
      {
        action: 'applied',
        description: 'Ứng viên nộp đơn ứng tuyển',
        timestamp: new Date('2024-04-15T09:00:00Z'),
        actor: 'applicant'
      },
      {
        action: 'viewed',
        description: 'HR đã xem hồ sơ ứng viên',
        timestamp: new Date('2024-04-16T10:00:00Z'),
        actor: 'employer'
      },
      {
        action: 'shortlisted',
        description: 'Ứng viên được shortlist cho vòng phỏng vấn',
        timestamp: new Date('2024-04-18T14:00:00Z'),
        actor: 'employer'
      },
      {
        action: 'interview_scheduled',
        description: 'Lịch phỏng vấn vòng 1 được sắp xếp',
        timestamp: new Date('2024-04-18T15:00:00Z'),
        actor: 'employer'
      },
      {
        action: 'interview_completed',
        description: 'Hoàn thành phỏng vấn vòng 1',
        timestamp: new Date('2024-04-20T10:30:00Z'),
        actor: 'employer'
      }
    ],
    source: 'direct',
    priority: 'medium',
    viewedByEmployer: true,
    viewedAt: new Date('2024-04-16T10:00:00Z'),
    lastActivity: new Date('2024-04-20T10:30:00Z')
  },
  // Application 2: Data Analyst Intern at Tiki
  {
    job: null, // Will be set dynamically
    applicant: null, // Will be set dynamically
    status: 'pending',
    resume: {
      url: 'https://example.com/resumes/tran-thi-binh-resume.pdf',
      filename: 'tran-thi-binh-resume.pdf',
      uploadedAt: new Date('2024-04-16')
    },
    coverLetter: {
      content: 'Tôi là Trần Thị Bình, sinh viên năm 4 ngành Kinh tế tại Đại học Bách khoa TP.HCM. Với niềm đam mê phân tích dữ liệu và kinh nghiệm thực tập tại các công ty tài chính, tôi tin rằng mình phù hợp với vị trí Data Analyst Intern tại Tiki. Tôi đã học SQL, Python và các công cụ phân tích dữ liệu, đồng thời có kinh nghiệm làm việc với Excel và các công cụ BI.',
      lastModified: new Date('2024-04-16')
    },
    additionalInfo: {
      availableStartDate: new Date('2024-06-01'),
      expectedSalary: {
        amount: 6000000,
        currency: 'VND'
      },
      workPreference: 'hybrid',
      motivationLetter: 'Tôi quan tâm đến e-commerce và muốn học hỏi về cách phân tích dữ liệu để hỗ trợ các quyết định kinh doanh.'
    },
    aiAnalysis: {
      overallScore: 78,
      skillsMatch: {
        matched: ['SQL', 'Excel', 'Data Analysis'],
        missing: ['Python', 'Statistics'],
        additional: ['Business Analysis'],
        score: 75
      },
      experienceMatch: {
        relevantExperience: ['Financial analysis internship', 'Data analysis projects'],
        experienceGap: ['E-commerce analytics', 'Big data platforms'],
        score: 70
      },
      educationMatch: {
        relevantEducation: true,
        educationLevel: 'Bachelor',
        score: 85
      },
      strengthsWeaknesses: {
        strengths: ['Good analytical thinking', 'Relevant internship experience', 'Strong academic background'],
        weaknesses: ['Limited Python skills', 'No e-commerce experience'],
        recommendations: ['Learn Python for data analysis', 'Study e-commerce metrics']
      },
      resumeQuality: {
        score: 80,
        feedback: ['Professional format', 'Clear experience descriptions'],
        suggestions: ['Add more quantitative achievements', 'Include data analysis project details']
      },
      fitScore: {
        cultural: 80,
        technical: 75,
        overall: 78
      },
      lastAnalyzed: new Date('2024-04-16')
    },
    feedback: {
      fromEmployer: {
        rating: 3,
        comments: 'Ứng viên có background phù hợp nhưng cần cải thiện kỹ năng technical',
        privateNotes: 'Cần đánh giá thêm về khả năng học Python',
        tags: ['potential', 'needs-assessment']
      }
    },
    communications: [
      {
        type: 'email',
        from: 'employer',
        subject: 'Xác nhận nộp đơn ứng tuyển',
        content: 'Cảm ơn bạn đã nộp đơn ứng tuyển vị trí Data Analyst Intern. Chúng tôi sẽ xem xét hồ sơ và liên hệ sớm nhất.',
        timestamp: new Date('2024-04-16T11:00:00Z'),
        read: true
      }
    ],
    timeline: [
      {
        action: 'applied',
        description: 'Ứng viên nộp đơn ứng tuyển',
        timestamp: new Date('2024-04-16T11:00:00Z'),
        actor: 'applicant'
      },
      {
        action: 'viewed',
        description: 'HR đã xem hồ sơ ứng viên',
        timestamp: new Date('2024-04-17T09:00:00Z'),
        actor: 'employer'
      }
    ],
    source: 'direct',
    priority: 'medium',
    viewedByEmployer: true,
    viewedAt: new Date('2024-04-17T09:00:00Z'),
    lastActivity: new Date('2024-04-17T09:00:00Z')
  },
  // Application 3: UI/UX Design Intern at VNG
  {
    job: null, // Will be set dynamically
    applicant: null, // Will be set dynamically
    status: 'interview',
    resume: {
      url: 'https://example.com/resumes/le-van-cuong-resume.pdf',
      filename: 'le-van-cuong-resume.pdf',
      uploadedAt: new Date('2024-04-14')
    },
    coverLetter: {
      content: 'Tôi là Lê Văn Cường, sinh viên năm 2 ngành Thiết kế đồ họa. Tôi đam mê UI/UX design và đã tham gia nhiều dự án thiết kế giao diện. Tôi thành thạo Figma, Adobe Creative Suite và có kinh nghiệm làm việc với các công cụ prototyping. Tôi mong muốn được học hỏi từ các designer chuyên nghiệp tại VNG.',
      lastModified: new Date('2024-04-14')
    },
    portfolio: {
      url: 'https://behance.net/le-van-cuong',
      description: 'Portfolio với các dự án UI/UX design cho mobile apps và web applications'
    },
    additionalInfo: {
      availableStartDate: new Date('2024-09-01'),
      expectedSalary: {
        amount: 10000000,
        currency: 'VND'
      },
      workPreference: 'hybrid',
      motivationLetter: 'Tôi muốn được làm việc với các sản phẩm có hàng triệu người dùng và học hỏi về design system.'
    },
    aiAnalysis: {
      overallScore: 92,
      skillsMatch: {
        matched: ['Figma', 'UI Design', 'UX Design', 'Prototyping'],
        missing: ['User Research'],
        additional: ['Adobe Creative Suite', 'Illustration'],
        score: 90
      },
      experienceMatch: {
        relevantExperience: ['UI/UX design projects', 'Mobile app design', 'Web design'],
        experienceGap: ['Enterprise design process', 'User research methods'],
        score: 85
      },
      educationMatch: {
        relevantEducation: true,
        educationLevel: 'Bachelor',
        score: 95
      },
      strengthsWeaknesses: {
        strengths: ['Strong design skills', 'Good portfolio', 'Creative thinking', 'Technical proficiency'],
        weaknesses: ['Limited user research experience', 'No enterprise experience'],
        recommendations: ['Learn user research methods', 'Study design systems']
      },
      resumeQuality: {
        score: 88,
        feedback: ['Excellent portfolio', 'Clear design process', 'Good visual presentation'],
        suggestions: ['Add more case studies', 'Include user research examples']
      },
      fitScore: {
        cultural: 90,
        technical: 88,
        overall: 89
      },
      lastAnalyzed: new Date('2024-04-14')
    },
    interviews: [
      {
        type: 'video',
        scheduledAt: new Date('2024-04-25T15:00:00Z'),
        duration: 60,
        interviewer: {
          name: 'Nguyễn Thị Mai',
          email: 'design@vng.com.vn',
          role: 'Senior UI/UX Designer'
        },
        status: 'scheduled'
      }
    ],
    feedback: {
      fromEmployer: {
        rating: 5,
        comments: 'Ứng viên có kỹ năng design xuất sắc và portfolio ấn tượng',
        privateNotes: 'Top candidate, schedule technical interview',
        tags: ['excellent', 'top-candidate']
      }
    },
    communications: [
      {
        type: 'email',
        from: 'employer',
        subject: 'Xác nhận nộp đơn ứng tuyển',
        content: 'Cảm ơn bạn đã nộp đơn ứng tuyển vị trí UI/UX Design Intern. Portfolio của bạn rất ấn tượng!',
        timestamp: new Date('2024-04-14T16:00:00Z'),
        read: true
      },
      {
        type: 'email',
        from: 'employer',
        subject: 'Mời phỏng vấn vòng 1',
        content: 'Chúc mừng! Bạn đã được mời tham gia phỏng vấn vòng 1 qua video call vào ngày 25/04/2024 lúc 22:00.',
        timestamp: new Date('2024-04-20T10:00:00Z'),
        read: true,
        important: true
      }
    ],
    timeline: [
      {
        action: 'applied',
        description: 'Ứng viên nộp đơn ứng tuyển',
        timestamp: new Date('2024-04-14T16:00:00Z'),
        actor: 'applicant'
      },
      {
        action: 'viewed',
        description: 'Design team đã xem hồ sơ và portfolio',
        timestamp: new Date('2024-04-15T11:00:00Z'),
        actor: 'employer'
      },
      {
        action: 'shortlisted',
        description: 'Ứng viên được shortlist cho vòng phỏng vấn',
        timestamp: new Date('2024-04-18T14:00:00Z'),
        actor: 'employer'
      },
      {
        action: 'interview_scheduled',
        description: 'Lịch phỏng vấn vòng 1 được sắp xếp',
        timestamp: new Date('2024-04-20T10:00:00Z'),
        actor: 'employer'
      }
    ],
    source: 'direct',
    priority: 'high',
    viewedByEmployer: true,
    viewedAt: new Date('2024-04-15T11:00:00Z'),
    lastActivity: new Date('2024-04-20T10:00:00Z')
  },
  // Application 4: Mobile Developer Intern at Grab
  {
    job: null, // Will be set dynamically
    applicant: null, // Will be set dynamically
    status: 'rejected',
    resume: {
      url: 'https://example.com/resumes/nguyen-van-a-mobile-resume.pdf',
      filename: 'nguyen-van-a-mobile-resume.pdf',
      uploadedAt: new Date('2024-04-10')
    },
    coverLetter: {
      content: 'Tôi là Nguyễn Văn An, sinh viên năm 3 ngành Công nghệ thông tin. Tôi đã học React Native và có một số dự án mobile app. Tôi mong muốn được học hỏi về mobile development tại Grab.',
      lastModified: new Date('2024-04-10')
    },
    additionalInfo: {
      availableStartDate: new Date('2024-09-01'),
      expectedSalary: {
        amount: 12000000,
        currency: 'VND'
      },
      workPreference: 'onsite'
    },
    aiAnalysis: {
      overallScore: 65,
      skillsMatch: {
        matched: ['JavaScript', 'React Native'],
        missing: ['Flutter', 'Mobile Development', 'API Integration'],
        additional: ['React'],
        score: 60
      },
      experienceMatch: {
        relevantExperience: ['Basic React Native projects'],
        experienceGap: ['Production mobile apps', 'API integration', 'Mobile testing'],
        score: 50
      },
      educationMatch: {
        relevantEducation: true,
        educationLevel: 'Bachelor',
        score: 85
      },
      strengthsWeaknesses: {
        strengths: ['Basic React Native knowledge', 'Good academic background'],
        weaknesses: ['Limited mobile development experience', 'No production app experience'],
        recommendations: ['Build more mobile apps', 'Learn Flutter', 'Practice API integration']
      },
      resumeQuality: {
        score: 70,
        feedback: ['Basic structure', 'Limited mobile projects'],
        suggestions: ['Add more mobile development projects', 'Include app store links']
      },
      fitScore: {
        cultural: 75,
        technical: 60,
        overall: 65
      },
      lastAnalyzed: new Date('2024-04-10')
    },
    feedback: {
      fromEmployer: {
        rating: 2,
        comments: 'Ứng viên có kiến thức cơ bản nhưng chưa đủ kinh nghiệm cho vị trí này',
        privateNotes: 'Cần nhiều kinh nghiệm hơn về mobile development',
        tags: ['insufficient-experience', 'reject']
      }
    },
    communications: [
      {
        type: 'email',
        from: 'employer',
        subject: 'Xác nhận nộp đơn ứng tuyển',
        content: 'Cảm ơn bạn đã nộp đơn ứng tuyển vị trí Mobile Developer Intern.',
        timestamp: new Date('2024-04-10T14:00:00Z'),
        read: true
      },
      {
        type: 'email',
        from: 'employer',
        subject: 'Thông báo kết quả ứng tuyển',
        content: 'Sau khi xem xét hồ sơ, chúng tôi rất tiếc phải thông báo rằng bạn chưa phù hợp với vị trí này. Chúng tôi khuyến khích bạn tiếp tục phát triển kỹ năng mobile development.',
        timestamp: new Date('2024-04-15T16:00:00Z'),
        read: true,
        important: true
      }
    ],
    timeline: [
      {
        action: 'applied',
        description: 'Ứng viên nộp đơn ứng tuyển',
        timestamp: new Date('2024-04-10T14:00:00Z'),
        actor: 'applicant'
      },
      {
        action: 'viewed',
        description: 'HR đã xem hồ sơ ứng viên',
        timestamp: new Date('2024-04-12T10:00:00Z'),
        actor: 'employer'
      },
      {
        action: 'application_rejected',
        description: 'Ứng viên không đủ kinh nghiệm cho vị trí',
        timestamp: new Date('2024-04-15T16:00:00Z'),
        actor: 'employer'
      }
    ],
    source: 'direct',
    priority: 'low',
    viewedByEmployer: true,
    viewedAt: new Date('2024-04-12T10:00:00Z'),
    lastActivity: new Date('2024-04-15T16:00:00Z')
  },
  // Application 5: Marketing Intern at Shopee
  {
    job: null, // Will be set dynamically
    applicant: null, // Will be set dynamically
    status: 'offered',
    resume: {
      url: 'https://example.com/resumes/tran-thi-b-marketing-resume.pdf',
      filename: 'tran-thi-b-marketing-resume.pdf',
      uploadedAt: new Date('2024-04-12')
    },
    coverLetter: {
      content: 'Tôi là Trần Thị Bình, sinh viên năm 4 ngành Marketing. Tôi có kinh nghiệm thực tập tại các agency và đã tham gia nhiều chiến dịch marketing. Tôi thành thạo các công cụ digital marketing và có khả năng sáng tạo content.',
      lastModified: new Date('2024-04-12')
    },
    additionalInfo: {
      availableStartDate: new Date('2024-06-01'),
      expectedSalary: {
        amount: 5000000,
        currency: 'VND'
      },
      workPreference: 'hybrid'
    },
    aiAnalysis: {
      overallScore: 88,
      skillsMatch: {
        matched: ['Digital Marketing', 'Content Creation', 'Social Media'],
        missing: ['E-commerce Marketing'],
        additional: ['Analytics', 'Communication'],
        score: 85
      },
      experienceMatch: {
        relevantExperience: ['Marketing internship', 'Campaign management', 'Content creation'],
        experienceGap: ['E-commerce specific experience'],
        score: 80
      },
      educationMatch: {
        relevantEducation: true,
        educationLevel: 'Bachelor',
        score: 90
      },
      strengthsWeaknesses: {
        strengths: ['Strong marketing background', 'Creative content skills', 'Good communication'],
        weaknesses: ['Limited e-commerce experience'],
        recommendations: ['Learn e-commerce marketing', 'Study Shopee platform']
      },
      resumeQuality: {
        score: 85,
        feedback: ['Well-structured', 'Good project descriptions'],
        suggestions: ['Add more campaign results', 'Include social media examples']
      },
      fitScore: {
        cultural: 90,
        technical: 85,
        overall: 88
      },
      lastAnalyzed: new Date('2024-04-12')
    },
    interviews: [
      {
        type: 'video',
        scheduledAt: new Date('2024-04-18T15:00:00Z'),
        duration: 45,
        interviewer: {
          name: 'Lê Văn Minh',
          email: 'marketing@shopee.com',
          role: 'Marketing Manager'
        },
        status: 'completed',
        feedback: {
          technical: {
            score: 8,
            comments: 'Có kiến thức marketing tốt, cần học thêm về e-commerce'
          },
          communication: {
            score: 9,
            comments: 'Giao tiếp tốt, có khả năng thuyết trình'
          },
          cultural: {
            score: 9,
            comments: 'Phù hợp với văn hóa công ty, có tinh thần học hỏi'
          },
          overall: {
            score: 9,
            recommendation: 'strong-hire',
            comments: 'Ứng viên xuất sắc, phù hợp với vị trí'
          }
        }
      }
    ],
    offer: {
      salary: {
        amount: 5500000,
        currency: 'VND',
        period: 'month'
      },
      benefits: ['Learning budget', 'Team building', 'Free lunch'],
      startDate: new Date('2024-06-01'),
      duration: '3 months',
      location: 'Hà Nội',
      terms: 'Thực tập 3 tháng với khả năng chuyển thành nhân viên chính thức',
      expiryDate: new Date('2024-05-01'),
      response: {
        decision: 'pending',
        responseDate: null
      }
    },
    feedback: {
      fromEmployer: {
        rating: 5,
        comments: 'Ứng viên xuất sắc, phù hợp hoàn hảo với vị trí',
        privateNotes: 'Top candidate, offer immediately',
        tags: ['excellent', 'top-candidate', 'offer']
      }
    },
    communications: [
      {
        type: 'email',
        from: 'employer',
        subject: 'Xác nhận nộp đơn ứng tuyển',
        content: 'Cảm ơn bạn đã nộp đơn ứng tuyển vị trí Marketing Intern.',
        timestamp: new Date('2024-04-12T11:00:00Z'),
        read: true
      },
      {
        type: 'email',
        from: 'employer',
        subject: 'Mời phỏng vấn',
        content: 'Chúc mừng! Bạn đã được mời tham gia phỏng vấn vào ngày 18/04/2024.',
        timestamp: new Date('2024-04-15T14:00:00Z'),
        read: true,
        important: true
      },
      {
        type: 'email',
        from: 'employer',
        subject: 'Thư mời nhận việc',
        content: 'Chúc mừng! Bạn đã được chọn cho vị trí Marketing Intern. Vui lòng xem chi tiết offer trong email đính kèm.',
        timestamp: new Date('2024-04-22T10:00:00Z'),
        read: true,
        important: true
      }
    ],
    timeline: [
      {
        action: 'applied',
        description: 'Ứng viên nộp đơn ứng tuyển',
        timestamp: new Date('2024-04-12T11:00:00Z'),
        actor: 'applicant'
      },
      {
        action: 'viewed',
        description: 'Marketing team đã xem hồ sơ',
        timestamp: new Date('2024-04-13T09:00:00Z'),
        actor: 'employer'
      },
      {
        action: 'shortlisted',
        description: 'Ứng viên được shortlist',
        timestamp: new Date('2024-04-15T14:00:00Z'),
        actor: 'employer'
      },
      {
        action: 'interview_scheduled',
        description: 'Lịch phỏng vấn được sắp xếp',
        timestamp: new Date('2024-04-15T15:00:00Z'),
        actor: 'employer'
      },
      {
        action: 'interview_completed',
        description: 'Hoàn thành phỏng vấn',
        timestamp: new Date('2024-04-18T15:45:00Z'),
        actor: 'employer'
      },
      {
        action: 'offer_made',
        description: 'Gửi thư mời nhận việc',
        timestamp: new Date('2024-04-22T10:00:00Z'),
        actor: 'employer'
      }
    ],
    source: 'direct',
    priority: 'high',
    viewedByEmployer: true,
    viewedAt: new Date('2024-04-13T09:00:00Z'),
    lastActivity: new Date('2024-04-22T10:00:00Z')
  }
];

module.exports = {
  sampleApplications
};
