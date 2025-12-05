/**
 * Script to create diverse job posts for BlueWave Agency
 * 
 * Positions:
 * - Marketing: Digital Marketing Executive, Social Media Manager, Content Creator
 * - Design: Graphic Designer, UI/UX Designer
 * - Account Management: Account Executive, Client Relations Manager
 * - Business: Business Analyst, Project Manager
 * - IT Support: IT Support Specialist
 * - HR: HR Specialist
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Job = require('../src/models/Job');
const Skill = require('../src/models/Skill');
const Industry = require('../src/models/Industry');

// BlueWave Agency info
const EMPLOYER_ID = '69305b50efb9cf755b1a25cc';
const POSTED_BY = '68dbe2ca3d23475eda22b398'; // Nguyễn Thị Lan

// Job templates
const jobTemplates = [
  // ==================== MARKETING ====================
  {
    title: 'Chuyên viên Marketing Digital',
    description: `BlueWave Agency đang tìm kiếm Chuyên viên Marketing Digital năng động để tham gia đội ngũ sáng tạo của chúng tôi.

**Trách nhiệm công việc:**
- Xây dựng và triển khai chiến lược marketing digital cho khách hàng
- Quản lý và tối ưu hóa các chiến dịch quảng cáo trên Facebook, Google Ads, TikTok
- Phân tích dữ liệu và báo cáo hiệu quả chiến dịch
- Nghiên cứu xu hướng thị trường và đối thủ cạnh tranh
- Làm việc chặt chẽ với team creative để sản xuất nội dung

**Yêu cầu:**
- Tốt nghiệp Đại học chuyên ngành Marketing, Truyền thông hoặc liên quan
- Từ 1-2 năm kinh nghiệm trong lĩnh vực Digital Marketing
- Thành thạo Google Analytics, Facebook Ads Manager, Google Ads
- Kỹ năng phân tích số liệu và tư duy logic tốt
- Khả năng giao tiếp và làm việc nhóm hiệu quả`,
    requirements: 'Tốt nghiệp Đại học Marketing, 1-2 năm kinh nghiệm Digital Marketing',
    benefits: 'Lương cạnh tranh 12-18 triệu, thưởng KPI, bảo hiểm đầy đủ, môi trường năng động',
    skills: ['Digital Marketing', 'Google Analytics', 'Facebook Ads', 'Content Marketing', 'SEO', 'SEM'],
    industryCode: 'marketing',
    level: 'Junior',
    jobType: 'Fulltime',
    workingMode: 'Hybrid',
    salaryMin: 12000000,
    salaryMax: 18000000,
    experience: '1-2 năm',
    education: 'Đại học',
    positions: 2
  },
  {
    title: 'Social Media Manager',
    description: `Chúng tôi cần một Social Media Manager sáng tạo để quản lý và phát triển các kênh truyền thông xã hội cho khách hàng.

**Trách nhiệm công việc:**
- Xây dựng chiến lược nội dung cho các nền tảng social media (Facebook, Instagram, TikTok, LinkedIn)
- Quản lý và giám sát hoạt động đăng bài, tương tác với cộng đồng
- Phối hợp với team creative để sản xuất content hấp dẫn
- Theo dõi và phân tích hiệu quả các bài đăng
- Quản lý ngân sách quảng cáo social media
- Xử lý khủng hoảng truyền thông và phản hồi tiêu cực

**Yêu cầu:**
- Tốt nghiệp Đại học chuyên ngành Marketing, Truyền thông
- 2-3 năm kinh nghiệm quản lý social media cho thương hiệu/agency
- Thành thạo các công cụ quản lý social media (Hootsuite, Buffer)
- Kỹ năng viết content và storytelling xuất sắc
- Am hiểu xu hướng social media và văn hóa Gen Z`,
    requirements: 'Tốt nghiệp Đại học, 2-3 năm kinh nghiệm Social Media Marketing',
    benefits: 'Lương 15-22 triệu, thưởng dự án, team building, cơ hội thăng tiến',
    skills: ['Social Media Marketing', 'Content Strategy', 'Community Management', 'Facebook Marketing', 'Instagram Marketing', 'TikTok Marketing'],
    industryCode: 'marketing',
    level: 'Senior',
    jobType: 'Fulltime',
    workingMode: 'Onsite',
    salaryMin: 15000000,
    salaryMax: 22000000,
    experience: '2-3 năm',
    education: 'Đại học',
    positions: 1
  },
  {
    title: 'Content Creator',
    description: `BlueWave Agency tìm kiếm Content Creator đa năng để tạo ra nội dung sáng tạo cho các dự án của khách hàng.

**Trách nhiệm công việc:**
- Sáng tạo nội dung text, hình ảnh, video cho các kênh digital
- Viết bài blog, caption, script video marketing
- Nghiên cứu và đề xuất ý tưởng content viral
- Hợp tác với designer và video editor để hoàn thiện content
- Tối ưu nội dung theo SEO và xu hướng

**Yêu cầu:**
- Tốt nghiệp Đại học Báo chí, Truyền thông, Marketing
- 1-2 năm kinh nghiệm làm content creator/copywriter
- Kỹ năng viết lách xuất sắc, đa dạng phong cách
- Có khả năng quay dựng video cơ bản (CapCut, Premiere)
- Sáng tạo, cập nhật xu hướng nhanh`,
    requirements: 'Tốt nghiệp Đại học, 1-2 năm kinh nghiệm Content Creation',
    benefits: 'Lương 10-15 triệu, thưởng content viral, môi trường sáng tạo tự do',
    skills: ['Content Writing', 'Copywriting', 'Video Editing', 'SEO Writing', 'Storytelling', 'Social Media Content'],
    industryCode: 'marketing',
    level: 'Junior',
    jobType: 'Fulltime',
    workingMode: 'Hybrid',
    salaryMin: 10000000,
    salaryMax: 15000000,
    experience: '1-2 năm',
    education: 'Đại học',
    positions: 2
  },

  // ==================== DESIGN ====================
  {
    title: 'Graphic Designer',
    description: `Chúng tôi cần Graphic Designer tài năng để thiết kế các sản phẩm truyền thông cho khách hàng đa dạng.

**Trách nhiệm công việc:**
- Thiết kế visual cho các chiến dịch marketing (poster, banner, social post)
- Phát triển bộ nhận diện thương hiệu cho khách hàng
- Thiết kế catalogue, brochure, standee, backdrop
- Chuẩn bị artwork cho in ấn và digital
- Phối hợp với team marketing để conceptualize ý tưởng

**Yêu cầu:**
- Tốt nghiệp chuyên ngành Thiết kế đồ họa, Mỹ thuật
- 1-2 năm kinh nghiệm thiết kế cho agency/brand
- Thành thạo Adobe Creative Suite (Photoshop, Illustrator, InDesign)
- Có khiếu thẩm mỹ tốt, cập nhật xu hướng thiết kế
- Portfolio ấn tượng`,
    requirements: 'Tốt nghiệp chuyên ngành Thiết kế, 1-2 năm kinh nghiệm',
    benefits: 'Lương 10-16 triệu, thưởng dự án đẹp, công cụ thiết kế hiện đại',
    skills: ['Adobe Photoshop', 'Adobe Illustrator', 'InDesign', 'Graphic Design', 'Brand Identity', 'Typography'],
    industryCode: 'design',
    level: 'Junior',
    jobType: 'Fulltime',
    workingMode: 'Onsite',
    salaryMin: 10000000,
    salaryMax: 16000000,
    experience: '1-2 năm',
    education: 'Đại học',
    positions: 2
  },
  {
    title: 'UI/UX Designer',
    description: `BlueWave Agency tìm kiếm UI/UX Designer để thiết kế trải nghiệm người dùng cho các dự án digital.

**Trách nhiệm công việc:**
- Nghiên cứu và phân tích hành vi người dùng
- Thiết kế wireframe, prototype cho website/app
- Tạo UI design system và component library
- Tiến hành user testing và tối ưu UX
- Làm việc với developer để implement design

**Yêu cầu:**
- Tốt nghiệp chuyên ngành Thiết kế, CNTT
- 2-3 năm kinh nghiệm UI/UX Design
- Thành thạo Figma, Adobe XD, Sketch
- Hiểu biết về design thinking và UX research
- Portfolio các dự án UI/UX thực tế`,
    requirements: 'Tốt nghiệp Đại học, 2-3 năm kinh nghiệm UI/UX',
    benefits: 'Lương 15-25 triệu, thưởng dự án, đào tạo kỹ năng nâng cao',
    skills: ['UI Design', 'UX Design', 'Figma', 'User Research', 'Prototyping', 'Design System'],
    industryCode: 'design',
    level: 'Senior',
    jobType: 'Fulltime',
    workingMode: 'Hybrid',
    salaryMin: 15000000,
    salaryMax: 25000000,
    experience: '2-3 năm',
    education: 'Đại học',
    positions: 1
  },

  // ==================== ACCOUNT MANAGEMENT ====================
  {
    title: 'Account Executive',
    description: `Tìm kiếm Account Executive để làm cầu nối giữa agency và khách hàng, đảm bảo dự án được triển khai suôn sẻ.

**Trách nhiệm công việc:**
- Quản lý mối quan hệ với khách hàng hiện tại
- Tư vấn giải pháp marketing phù hợp cho khách hàng
- Điều phối nội bộ giữa các team để deliver dự án
- Lập kế hoạch và timeline cho các chiến dịch
- Báo cáo hiệu quả và tổ chức meeting với khách hàng

**Yêu cầu:**
- Tốt nghiệp Đại học Marketing, Kinh doanh
- 1-2 năm kinh nghiệm Account/Customer Relations
- Kỹ năng giao tiếp và đàm phán tốt
- Khả năng quản lý nhiều dự án đồng thời
- Thành thạo MS Office, biết tiếng Anh là lợi thế`,
    requirements: 'Tốt nghiệp Đại học, 1-2 năm kinh nghiệm Account Management',
    benefits: 'Lương 12-18 triệu + hoa hồng dự án, du lịch hàng năm',
    skills: ['Client Relations', 'Project Coordination', 'Communication', 'Negotiation', 'Microsoft Office', 'Presentation'],
    industryCode: 'business-administration',
    level: 'Junior',
    jobType: 'Fulltime',
    workingMode: 'Onsite',
    salaryMin: 12000000,
    salaryMax: 18000000,
    experience: '1-2 năm',
    education: 'Đại học',
    positions: 2
  },
  {
    title: 'Client Relations Manager',
    description: `Cần Client Relations Manager dày dạn kinh nghiệm để quản lý danh mục khách hàng lớn của công ty.

**Trách nhiệm công việc:**
- Quản lý và phát triển mối quan hệ với key clients
- Phát triển khách hàng mới và mở rộng hợp đồng
- Giám sát chất lượng dự án và satisfaction của khách hàng
- Giải quyết khiếu nại và xử lý tình huống khó
- Lập chiến lược duy trì và phát triển tài khoản khách hàng

**Yêu cầu:**
- Tốt nghiệp Đại học Marketing, Kinh doanh
- 3-5 năm kinh nghiệm quản lý khách hàng trong agency
- Kỹ năng leadership và team management
- Có network trong ngành marketing/agency
- Tiếng Anh thành thạo (giao tiếp + email)`,
    requirements: 'Tốt nghiệp Đại học, 3-5 năm kinh nghiệm Client Relations',
    benefits: 'Lương 20-30 triệu + bonus doanh số, thưởng hiệu quả cao',
    skills: ['Client Management', 'Business Development', 'Leadership', 'Negotiation', 'Strategic Planning', 'English Communication'],
    industryCode: 'business-administration',
    level: 'Manager',
    jobType: 'Fulltime',
    workingMode: 'Onsite',
    salaryMin: 20000000,
    salaryMax: 30000000,
    experience: '3-5 năm',
    education: 'Đại học',
    positions: 1
  },

  // ==================== BUSINESS ANALYSIS ====================
  {
    title: 'Business Analyst',
    description: `BlueWave Agency cần Business Analyst để phân tích dữ liệu và đưa ra insight cho các quyết định kinh doanh.

**Trách nhiệm công việc:**
- Thu thập và phân tích dữ liệu marketing, sales, operations
- Tạo dashboard và báo cáo business intelligence
- Phân tích hiệu quả ROI của các chiến dịch
- Đề xuất giải pháp tối ưu quy trình và tăng trưởng
- Làm việc với các team để hiểu business requirements

**Yêu cầu:**
- Tốt nghiệp Đại học Kinh tế, Quản trị kinh doanh, CNTT
- 2-3 năm kinh nghiệm Business Analysis
- Thành thạo Excel (pivot, vlookup, macro), Power BI hoặc Tableau
- Kỹ năng phân tích dữ liệu và tư duy logic tốt
- Biết SQL là lợi thế lớn`,
    requirements: 'Tốt nghiệp Đại học, 2-3 năm kinh nghiệm phân tích dữ liệu',
    benefits: 'Lương 15-22 triệu, thưởng theo hiệu quả, đào tạo data science',
    skills: ['Data Analysis', 'Microsoft Excel', 'Power BI', 'SQL', 'Business Intelligence', 'Problem Solving'],
    industryCode: 'business-administration',
    level: 'Senior',
    jobType: 'Fulltime',
    workingMode: 'Hybrid',
    salaryMin: 15000000,
    salaryMax: 22000000,
    experience: '2-3 năm',
    education: 'Đại học',
    positions: 1
  },

  // ==================== PROJECT MANAGEMENT ====================
  {
    title: 'Project Manager',
    description: `Tìm kiếm Project Manager để điều phối và quản lý các dự án marketing phức tạp.

**Trách nhiệm công việc:**
- Lập kế hoạch và quản lý timeline cho các dự án
- Điều phối nguồn lực giữa các team (creative, account, media)
- Giám sát tiến độ và chất lượng deliverables
- Quản lý rủi ro và giải quyết vấn đề phát sinh
- Báo cáo tiến độ cho leadership và stakeholders

**Yêu cầu:**
- Tốt nghiệp Đại học Quản trị dự án, Kinh doanh
- 3-4 năm kinh nghiệm quản lý dự án trong agency/marketing
- Thành thạo công cụ quản lý dự án (Jira, Asana, Trello)
- Có chứng chỉ PMP/Agile/Scrum là lợi thế
- Kỹ năng leadership và giải quyết vấn đề xuất sắc`,
    requirements: 'Tốt nghiệp Đại học, 3-4 năm kinh nghiệm Project Management',
    benefits: 'Lương 18-28 triệu, thưởng dự án hoàn thành xuất sắc, bảo hiểm cao cấp',
    skills: ['Project Management', 'Agile', 'Scrum', 'Jira', 'Leadership', 'Risk Management'],
    industryCode: 'business-administration',
    level: 'Manager',
    jobType: 'Fulltime',
    workingMode: 'Onsite',
    salaryMin: 18000000,
    salaryMax: 28000000,
    experience: '3-4 năm',
    education: 'Đại học',
    positions: 1
  },

  // ==================== IT SUPPORT ====================
  {
    title: 'IT Support Specialist',
    description: `BlueWave Agency cần IT Support Specialist để hỗ trợ hạ tầng IT và giải quyết vấn đề kỹ thuật.

**Trách nhiệm công việc:**
- Cài đặt và bảo trì máy tính, mạng nội bộ
- Hỗ trợ nhân viên về vấn đề phần cứng, phần mềm
- Quản lý hệ thống email, cloud storage (Google Workspace)
- Backup dữ liệu và đảm bảo bảo mật thông tin
- Cài đặt và quản lý phần mềm công ty (Adobe CC, Office 365)

**Yêu cầu:**
- Tốt nghiệp Cao đẳng/Đại học CNTT
- 1-2 năm kinh nghiệm IT Support
- Am hiểu Windows, Mac OS, mạng LAN/WAN
- Kỹ năng troubleshooting tốt
- Có thể làm việc ngoài giờ khi cần thiết`,
    requirements: 'Tốt nghiệp Cao đẳng/Đại học CNTT, 1-2 năm kinh nghiệm',
    benefits: 'Lương 10-14 triệu, thưởng Tết, môi trường tech-friendly',
    skills: ['IT Support', 'Windows', 'Mac OS', 'Networking', 'Troubleshooting', 'Google Workspace'],
    industryCode: 'information-technology',
    level: 'Junior',
    jobType: 'Fulltime',
    workingMode: 'Onsite',
    salaryMin: 10000000,
    salaryMax: 14000000,
    experience: '1-2 năm',
    education: 'Cao đẳng',
    positions: 1
  },

  // ==================== HR ====================
  {
    title: 'Chuyên viên Nhân sự (HR Specialist)',
    description: `Tìm kiếm Chuyên viên Nhân sự để quản lý và phát triển nguồn nhân lực cho công ty.

**Trách nhiệm công việc:**
- Tuyển dụng nhân sự các vị trí (marketing, creative, account)
- Quản lý hồ sơ nhân sự và chấm công
- Tổ chức đào tạo và phát triển kỹ năng cho nhân viên
- Xây dựng văn hóa doanh nghiệp và hoạt động team building
- Xử lý các vấn đề về lương thưởng, phúc lợi

**Yêu cầu:**
- Tốt nghiệp Đại học Quản trị nhân lực, Luật
- 2-3 năm kinh nghiệm HR, ưu tiên từ agency/công ty truyền thông
- Am hiểu luật lao động Việt Nam
- Kỹ năng giao tiếp và giải quyết conflict tốt
- Thành thạo MS Office, biết dùng phần mềm HR là lợi thế`,
    requirements: 'Tốt nghiệp Đại học, 2-3 năm kinh nghiệm HR',
    benefits: 'Lương 12-18 triệu, chế độ phúc lợi tốt, môi trường thân thiện',
    skills: ['Recruitment', 'HR Management', 'Labor Law', 'Employee Relations', 'Training & Development', 'Microsoft Office'],
    industryCode: 'human-resources',
    level: 'Senior',
    jobType: 'Fulltime',
    workingMode: 'Onsite',
    salaryMin: 12000000,
    salaryMax: 18000000,
    experience: '2-3 năm',
    education: 'Đại học',
    positions: 1
  }
];

// Helper: Find or create skills
async function findOrCreateSkills(skillNames) {
  const skillIds = [];
  
  for (const skillName of skillNames) {
    let skill = await Skill.findOne({ name: { $regex: new RegExp(`^${skillName}$`, 'i') } });
    
    if (!skill) {
      console.log(`Creating new skill: ${skillName}`);
      skill = await Skill.create({
        name: skillName,
        category: 'technical', // Default category
        isActive: true
      });
    }
    
    skillIds.push(skill._id);
  }
  
  return skillIds;
}

// Helper: Generate slug
function generateSlug(title) {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

// Main function
async function createJobs() {
  try {
    console.log('🚀 Starting job creation for BlueWave Agency...\n');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Verify industries exist
    const industries = await Industry.find({ code: { $in: ['marketing', 'design', 'business-administration', 'information-technology', 'human-resources'] } });
    console.log(`✅ Found ${industries.length} industries\n`);

    const createdJobs = [];

    for (const [index, template] of jobTemplates.entries()) {
      console.log(`📝 Creating job ${index + 1}/${jobTemplates.length}: ${template.title}`);

      // Find or create skills
      const skillIds = await findOrCreateSkills(template.skills);

      // Calculate deadline (30 days from now)
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + 30);

      // Create job
      const jobData = {
        employer: EMPLOYER_ID,
        postedBy: POSTED_BY,
        title: template.title,
        slug: generateSlug(template.title) + '-' + Date.now(),
        description: template.description,
        requirements: template.requirements,
        benefits: template.benefits,
        skills: template.skills,
        skillIds: skillIds,
        industryCode: template.industryCode,
        level: template.level,
        jobType: template.jobType,
        workingMode: template.workingMode,
        address: {
          street: '78 Nguyễn Thị Minh Khai',
          ward: 'Phường Bến Thành',
          district: 'Quận 1',
          city: 'Thành phố Hồ Chí Minh',
          country: 'Vietnam',
          fullAddress: '78 Nguyễn Thị Minh Khai, Phường Bến Thành, Quận 1, TP. Hồ Chí Minh'
        },
        salaryMin: template.salaryMin,
        salaryMax: template.salaryMax,
        currency: 'VND',
        experience: template.experience,
        education: template.education,
        deadline: deadline,
        positions: template.positions,
        status: 'active', // Set to active immediately
        views: Math.floor(Math.random() * 100) + 20 // Random views 20-120
      };

      const job = await Job.create(jobData);
      createdJobs.push(job);

      console.log(`   ✅ Created: ${job.title} (${job._id})`);
      console.log(`   📊 Skills: ${template.skills.join(', ')}`);
      console.log(`   💰 Salary: ${(template.salaryMin / 1000000).toFixed(1)}-${(template.salaryMax / 1000000).toFixed(1)} triệu VND`);
      console.log();
    }

    console.log('🎉 All jobs created successfully!\n');
    console.log('📊 Summary:');
    console.log(`   Total jobs created: ${createdJobs.length}`);
    console.log(`   Industries covered: ${new Set(createdJobs.map(j => j.industryCode)).size}`);
    console.log(`   Total positions: ${createdJobs.reduce((sum, j) => sum + j.positions, 0)}`);
    console.log();
    console.log('📋 Created Jobs:');
    createdJobs.forEach((job, i) => {
      console.log(`   ${i + 1}. ${job.title} - ${job.level} - ${job.positions} position(s)`);
    });

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');

  } catch (error) {
    console.error('❌ Error creating jobs:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Run the script
createJobs()
  .then(() => {
    console.log('\n🚀 Script completed successfully!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
