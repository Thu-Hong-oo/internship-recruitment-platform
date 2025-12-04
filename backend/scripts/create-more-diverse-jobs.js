/**
 * Script to create MORE diverse job posts across different industries
 * 
 * Additional positions:
 * - Accounting/Finance: Nhân viên chứng từ, Kế toán, Kiểm toán
 * - Logistics: Nhân viên giao nhận, Điều phối vận tải
 * - Sales: Nhân viên kinh doanh, Telesales
 * - Customer Service: Chăm sóc khách hàng
 * - Education: Giảng viên, Trợ giảng
 * - Healthcare: Y tá, Dược sĩ
 * - Hospitality: Lễ tân, Nhân viên phục vụ
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Job = require('../src/models/Job');
const Skill = require('../src/models/Skill');
const Industry = require('../src/models/Industry');

// BlueWave Agency info
const EMPLOYER_ID = '69305b50efb9cf755b1a25cc';
const POSTED_BY = '68dbe2ca3d23475eda22b398';

const additionalJobs = [
  // ==================== ACCOUNTING/FINANCE ====================
  {
    title: 'Nhân viên Chứng từ',
    description: `BlueWave Agency cần Nhân viên Chứng từ để xử lý các chứng từ kế toán và hồ sơ tài chính.

**Trách nhiệm công việc:**
- Kiểm tra, sắp xếp và lưu trữ chứng từ kế toán
- Nhập liệu các chứng từ vào hệ thống kế toán
- Đối chiếu công nợ với khách hàng và nhà cung cấp
- Hỗ trợ kế toán trong việc lập báo cáo tài chính
- Quản lý hóa đơn mua hàng và bán hàng
- Lưu trữ và bảo quản hồ sơ chứng từ theo quy định

**Yêu cầu:**
- Tốt nghiệp Trung cấp/Cao đẳng chuyên ngành Kế toán
- Có kinh nghiệm làm chứng từ 1-2 năm
- Nắm vững các loại chứng từ kế toán
- Thành thạo Excel, biết sử dụng phần mềm kế toán (MISA, Fast)
- Tỉ mỉ, cẩn thận, có trách nhiệm`,
    requirements: 'Tốt nghiệp Trung cấp/Cao đẳng Kế toán, 1-2 năm kinh nghiệm',
    benefits: 'Lương 8-12 triệu, làm việc giờ hành chính, bảo hiểm đầy đủ',
    skills: ['Accounting', 'Microsoft Excel', 'MISA', 'Document Management', 'Data Entry', 'Attention to Detail'],
    industryCode: 'accounting-auditing',
    level: 'Junior',
    jobType: 'Fulltime',
    workingMode: 'Onsite',
    salaryMin: 8000000,
    salaryMax: 12000000,
    experience: '1-2 năm',
    education: 'Cao đẳng',
    positions: 2
  },
  {
    title: 'Kế toán Tổng hợp',
    description: `Tuyển dụng Kế toán Tổng hợp để quản lý toàn bộ công tác kế toán của công ty.

**Trách nhiệm công việc:**
- Hạch toán các nghiệp vụ phát sinh hàng ngày
- Kiểm tra và đối chiếu số liệu kế toán
- Lập báo cáo tài chính định kỳ (tháng, quý, năm)
- Theo dõi công nợ phải thu, phải trả
- Kê khai thuế, quyết toán thuế với cơ quan thuế
- Lập báo cáo quản trị cho ban giám đốc

**Yêu cầu:**
- Tốt nghiệp Đại học chuyên ngành Kế toán, Tài chính
- 2-3 năm kinh nghiệm kế toán tổng hợp
- Có chứng chỉ hành nghề kế toán là lợi thế
- Thành thạo phần mềm kế toán MISA, SAP
- Am hiểu luật thuế và chế độ kế toán Việt Nam`,
    requirements: 'Tốt nghiệp Đại học Kế toán, 2-3 năm kinh nghiệm',
    benefits: 'Lương 12-18 triệu, thưởng cuối năm, đào tạo nâng cao',
    skills: ['Accounting', 'Financial Reporting', 'Tax Declaration', 'MISA', 'SAP', 'Excel'],
    industryCode: 'accounting-auditing',
    level: 'Senior',
    jobType: 'Fulltime',
    workingMode: 'Onsite',
    salaryMin: 12000000,
    salaryMax: 18000000,
    experience: '2-3 năm',
    education: 'Đại học',
    positions: 1
  },
  {
    title: 'Kiểm toán Nội bộ',
    description: `Cần Kiểm toán Nội bộ để đảm bảo tuân thủ quy định và phát hiện rủi ro tài chính.

**Trách nhiệm công việc:**
- Kiểm tra tính chính xác của các báo cáo tài chính
- Đánh giá hệ thống kiểm soát nội bộ
- Phát hiện sai phạm và đề xuất biện pháp khắc phục
- Lập báo cáo kiểm toán và trình ban giám đốc
- Tư vấn cải tiến quy trình kế toán

**Yêu cầu:**
- Tốt nghiệp Đại học Kế toán, Kiểm toán
- 3-4 năm kinh nghiệm kiểm toán nội bộ
- Có chứng chỉ CIA, ACCA là lợi thế lớn
- Kỹ năng phân tích và đánh giá rủi ro tốt
- Độc lập, khách quan, có tư duy logic`,
    requirements: 'Tốt nghiệp Đại học, 3-4 năm kinh nghiệm kiểm toán',
    benefits: 'Lương 18-25 triệu, thưởng theo hiệu quả, môi trường chuyên nghiệp',
    skills: ['Internal Audit', 'Risk Assessment', 'Financial Analysis', 'Accounting Standards', 'Audit Report', 'Analytical Thinking'],
    industryCode: 'accounting-auditing',
    level: 'Manager',
    jobType: 'Fulltime',
    workingMode: 'Onsite',
    salaryMin: 18000000,
    salaryMax: 25000000,
    experience: '3-4 năm',
    education: 'Đại học',
    positions: 1
  },

  // ==================== LOGISTICS ====================
  {
    title: 'Nhân viên Giao nhận',
    description: `Tuyển Nhân viên Giao nhận để xử lý thủ tục xuất nhập khẩu và vận chuyển hàng hóa.

**Trách nhiệm công việc:**
- Xử lý các thủ tục hải quan xuất nhập khẩu
- Theo dõi lịch trình vận chuyển và giao nhận hàng hóa
- Làm việc với hãng tàu, hãng bay, kho bãi
- Lập và kiểm tra các chứng từ vận tải (Bill of Lading, Invoice, Packing List)
- Giải quyết các vấn đề phát sinh trong quá trình vận chuyển
- Báo cáo tình trạng hàng hóa cho khách hàng

**Yêu cầu:**
- Tốt nghiệp Cao đẳng/Đại học Logistics, Kinh doanh quốc tế
- 1-2 năm kinh nghiệm giao nhận xuất nhập khẩu
- Am hiểu quy trình hải quan và vận tải
- Tiếng Anh giao tiếp tốt (đọc hiểu email, document)
- Cẩn thận, tỉ mỉ, có khả năng làm việc dưới áp lực`,
    requirements: 'Tốt nghiệp Cao đẳng/Đại học, 1-2 năm kinh nghiệm logistics',
    benefits: 'Lương 9-14 triệu, thưởng hiệu quả, cơ hội thăng tiến',
    skills: ['Logistics', 'Import-Export', 'Customs Clearance', 'Document Management', 'English Communication', 'Problem Solving'],
    industryCode: 'logistics',
    level: 'Junior',
    jobType: 'Fulltime',
    workingMode: 'Onsite',
    salaryMin: 9000000,
    salaryMax: 14000000,
    experience: '1-2 năm',
    education: 'Cao đẳng',
    positions: 2
  },
  {
    title: 'Điều phối Vận tải',
    description: `Cần Điều phối Vận tải để quản lý và tối ưu hóa hoạt động vận chuyển.

**Trách nhiệm công việc:**
- Lập kế hoạch vận chuyển hàng hóa
- Điều phối xe và tài xế theo lịch trình
- Giám sát quá trình vận chuyển và xử lý sự cố
- Tối ưu hóa chi phí và thời gian vận chuyển
- Làm việc với đối tác vận tải và kho bãi
- Báo cáo hiệu quả vận hành

**Yêu cầu:**
- Tốt nghiệp Đại học Logistics, Quản trị vận tải
- 2-3 năm kinh nghiệm điều phối vận tải
- Kỹ năng quản lý và giải quyết vấn đề tốt
- Thành thạo phần mềm quản lý vận tải (TMS)
- Có khả năng làm việc ngoài giờ khi cần`,
    requirements: 'Tốt nghiệp Đại học, 2-3 năm kinh nghiệm',
    benefits: 'Lương 12-18 triệu, phụ cấp điện thoại, xăng xe',
    skills: ['Transport Coordination', 'Logistics Management', 'Route Optimization', 'TMS Software', 'Problem Solving', 'Communication'],
    industryCode: 'logistics',
    level: 'Senior',
    jobType: 'Fulltime',
    workingMode: 'Onsite',
    salaryMin: 12000000,
    salaryMax: 18000000,
    experience: '2-3 năm',
    education: 'Đại học',
    positions: 1
  },

  // ==================== SALES ====================
  {
    title: 'Nhân viên Kinh doanh B2B',
    description: `Tuyển Nhân viên Kinh doanh B2B để phát triển khách hàng doanh nghiệp.

**Trách nhiệm công việc:**
- Tìm kiếm và phát triển khách hàng doanh nghiệp mới
- Tư vấn giải pháp dịch vụ marketing/agency cho khách hàng
- Đàm phán và ký kết hợp đồng
- Duy trì và phát triển mối quan hệ khách hàng
- Theo dõi công nợ và thanh toán
- Đạt chỉ tiêu doanh số hàng tháng/quý

**Yêu cầu:**
- Tốt nghiệp Đại học Kinh doanh, Marketing
- 1-2 năm kinh nghiệm bán hàng B2B
- Kỹ năng giao tiếp và thuyết phục tốt
- Nhiệt huyết, năng động, chịu được áp lực
- Có mạng lưới khách hàng là lợi thế`,
    requirements: 'Tốt nghiệp Đại học, 1-2 năm kinh nghiệm sales B2B',
    benefits: 'Lương cơ bản 10-12 triệu + hoa hồng hấp dẫn (không giới hạn)',
    skills: ['B2B Sales', 'Negotiation', 'Client Development', 'Communication', 'Presentation', 'CRM'],
    industryCode: 'sales',
    level: 'Junior',
    jobType: 'Fulltime',
    workingMode: 'Onsite',
    salaryMin: 10000000,
    salaryMax: 12000000,
    experience: '1-2 năm',
    education: 'Đại học',
    positions: 3
  },
  {
    title: 'Telesales',
    description: `Cần Telesales để chăm sóc và tư vấn khách hàng qua điện thoại.

**Trách nhiệm công việc:**
- Gọi điện tư vấn sản phẩm/dịch vụ cho khách hàng tiềm năng
- Chăm sóc khách hàng cũ và phát triển doanh số
- Cập nhật thông tin khách hàng vào hệ thống CRM
- Giải đáp thắc mắc và xử lý khiếu nại
- Đạt chỉ tiêu cuộc gọi và doanh số

**Yêu cầu:**
- Tốt nghiệp Trung cấp/Cao đẳng trở lên
- Có kinh nghiệm telesales/bán hàng qua điện thoại
- Giọng nói dễ nghe, kỹ năng giao tiếp tốt
- Nhiệt tình, kiên trì, chịu được áp lực
- Thành thạo tin học văn phòng`,
    requirements: 'Tốt nghiệp Trung cấp trở lên, có kinh nghiệm telesales',
    benefits: 'Lương cơ bản 7-9 triệu + hoa hồng cao, thưởng tháng xuất sắc',
    skills: ['Telesales', 'Phone Communication', 'Customer Service', 'CRM', 'Persuasion', 'Time Management'],
    industryCode: 'sales',
    level: 'Fresher',
    jobType: 'Fulltime',
    workingMode: 'Onsite',
    salaryMin: 7000000,
    salaryMax: 9000000,
    experience: 'Không yêu cầu',
    education: 'Trung cấp',
    positions: 5
  },

  // ==================== CUSTOMER SERVICE ====================
  {
    title: 'Nhân viên Chăm sóc Khách hàng',
    description: `Tuyển Nhân viên Chăm sóc Khách hàng để hỗ trợ và giải quyết thắc mắc của khách hàng.

**Trách nhiệm công việc:**
- Tiếp nhận và xử lý yêu cầu hỗ trợ từ khách hàng (điện thoại, email, chat)
- Giải đáp thắc mắc về sản phẩm/dịch vụ
- Xử lý khiếu nại và phản hồi của khách hàng
- Cập nhật thông tin khách hàng vào hệ thống
- Báo cáo các vấn đề phát sinh cho quản lý
- Tư vấn và chăm sóc khách hàng sau bán hàng

**Yêu cầu:**
- Tốt nghiệp Trung cấp/Cao đẳng trở lên
- Kinh nghiệm CSKH 1-2 năm
- Kỹ năng giao tiếp tốt, giọng nói dễ nghe
- Kiên nhẫn, nhiệt tình, thân thiện
- Có khả năng xử lý tình huống linh hoạt`,
    requirements: 'Tốt nghiệp Trung cấp/Cao đẳng, 1-2 năm kinh nghiệm CSKH',
    benefits: 'Lương 8-12 triệu, làm việc ca (có phụ cấp), môi trường năng động',
    skills: ['Customer Service', 'Communication', 'Problem Solving', 'CRM', 'Microsoft Office', 'Patience'],
    industryCode: 'customer-service',
    level: 'Junior',
    jobType: 'Fulltime',
    workingMode: 'Onsite',
    salaryMin: 8000000,
    salaryMax: 12000000,
    experience: '1-2 năm',
    education: 'Cao đẳng',
    positions: 3
  },

  // ==================== EDUCATION ====================
  {
    title: 'Giảng viên Marketing',
    description: `Cần Giảng viên Marketing để giảng dạy các khóa học về marketing digital và truyền thông.

**Trách nhiệm công việc:**
- Giảng dạy các khóa học marketing (digital marketing, social media, content)
- Chuẩn bị giáo trình và tài liệu học tập
- Hướng dẫn sinh viên thực hành dự án thực tế
- Đánh giá và chấm điểm bài tập, bài kiểm tra
- Tham gia nghiên cứu và phát triển chương trình đào tạo

**Yêu cầu:**
- Tốt nghiệp Thạc sĩ Marketing, Truyền thông
- 3-5 năm kinh nghiệm làm marketing thực tế
- Có kinh nghiệm giảng dạy/đào tạo
- Kỹ năng trình bày và giao tiếp xuất sắc
- Cập nhật xu hướng marketing mới nhất`,
    requirements: 'Tốt nghiệp Thạc sĩ, 3-5 năm kinh nghiệm',
    benefits: 'Lương 15-25 triệu, thưởng theo học viên, môi trường học thuật',
    skills: ['Teaching', 'Marketing', 'Curriculum Development', 'Presentation', 'Communication', 'Digital Marketing'],
    industryCode: 'education',
    level: 'Senior',
    jobType: 'Fulltime',
    workingMode: 'Onsite',
    salaryMin: 15000000,
    salaryMax: 25000000,
    experience: '3-5 năm',
    education: 'Thạc sĩ',
    positions: 1
  },

  // ==================== HOSPITALITY ====================
  {
    title: 'Lễ tân - Receptionist',
    description: `Tuyển Lễ tân để đón tiếp khách và xử lý công việc văn phòng.

**Trách nhiệm công việc:**
- Đón tiếp khách đến công ty, làm thủ tục khách
- Trả lời điện thoại và chuyển máy nội bộ
- Sắp xếp lịch họp và chuẩn bị phòng họp
- Quản lý văn phòng phẩm và thiết bị văn phòng
- Hỗ trợ các công việc hành chính khác

**Yêu cầu:**
- Tốt nghiệp Trung cấp/Cao đẳng trở lên
- Ưu tiên có kinh nghiệm lễ tân
- Ngoại hình ưa nhìn, giao tiếp tốt
- Thành thạo tin học văn phòng
- Biết tiếng Anh cơ bản là lợi thế`,
    requirements: 'Tốt nghiệp Trung cấp/Cao đẳng, ưu tiên có kinh nghiệm',
    benefits: 'Lương 7-10 triệu, làm việc giờ hành chính, môi trường chuyên nghiệp',
    skills: ['Reception', 'Customer Service', 'Phone Etiquette', 'Microsoft Office', 'Communication', 'Organization'],
    industryCode: 'hospitality',
    level: 'Fresher',
    jobType: 'Fulltime',
    workingMode: 'Onsite',
    salaryMin: 7000000,
    salaryMax: 10000000,
    experience: 'Không yêu cầu',
    education: 'Trung cấp',
    positions: 1
  }
];

// Helper functions
async function findOrCreateSkills(skillNames) {
  const skillIds = [];
  
  for (const skillName of skillNames) {
    let skill = await Skill.findOne({ name: { $regex: new RegExp(`^${skillName}$`, 'i') } });
    
    if (!skill) {
      console.log(`   Creating new skill: ${skillName}`);
      
      // Determine category based on skill name
      let category = 'technical';
      const lowerName = skillName.toLowerCase();
      
      if (['communication', 'teamwork', 'leadership', 'problem solving', 'time management', 
           'attention to detail', 'patience', 'organization', 'analytical thinking'].some(soft => lowerName.includes(soft))) {
        category = 'soft-skills';
      }
      
      skill = await Skill.create({
        name: skillName,
        category: category,
        isActive: true
      });
    }
    
    skillIds.push(skill._id);
  }
  
  return skillIds;
}

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

async function createMoreJobs() {
  try {
    console.log('🚀 Creating additional diverse job posts...\n');

    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    const createdJobs = [];

    for (const [index, template] of additionalJobs.entries()) {
      console.log(`📝 Creating job ${index + 1}/${additionalJobs.length}: ${template.title}`);

      const skillIds = await findOrCreateSkills(template.skills);

      const deadline = new Date();
      deadline.setDate(deadline.getDate() + 30);

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
        status: 'active',
        views: Math.floor(Math.random() * 150) + 30
      };

      const job = await Job.create(jobData);
      createdJobs.push(job);

      console.log(`   ✅ Created: ${job.title} (${job._id})`);
      console.log(`   💰 Salary: ${(template.salaryMin / 1000000).toFixed(1)}-${(template.salaryMax / 1000000).toFixed(1)} triệu VND\n`);
    }

    console.log('🎉 All additional jobs created successfully!\n');
    console.log('📊 Summary:');
    console.log(`   Total jobs created: ${createdJobs.length}`);
    console.log(`   Industries covered: ${new Set(createdJobs.map(j => j.industryCode)).size}`);
    console.log(`   Total positions: ${createdJobs.reduce((sum, j) => sum + j.positions, 0)}`);
    console.log();
    console.log('📋 Created Jobs by Industry:');
    
    const byIndustry = createdJobs.reduce((acc, job) => {
      if (!acc[job.industryCode]) acc[job.industryCode] = [];
      acc[job.industryCode].push(job);
      return acc;
    }, {});
    
    for (const [industry, jobs] of Object.entries(byIndustry)) {
      console.log(`\n   🏢 ${industry.toUpperCase()}:`);
      jobs.forEach(job => {
        console.log(`      • ${job.title} - ${job.level} - ${job.positions} vị trí`);
      });
    }

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');

  } catch (error) {
    console.error('❌ Error creating jobs:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

createMoreJobs()
  .then(() => {
    console.log('\n🚀 Script completed successfully!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
