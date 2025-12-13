class EmailTemplate {
  static verificationEmail(user, otp) {
    return {
      from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM_ADDRESS}>`,
      to: user.email,
      subject: 'Xác thực email - Internship Recruitment Platform',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #4F46E5; color: white; padding: 20px; text-align: center;">
            <h1>Xác thực email của bạn</h1>
          </div>
          <div style="padding: 20px; background-color: #f9f9f9;">
            <p>Xin chào ${user.fullName},</p>
            <p>Cảm ơn bạn đã đăng ký tài khoản. Để hoàn tất quá trình đăng ký, vui lòng nhập mã OTP sau:</p>
            <div style="text-align: center; margin: 30px 0;">
              <p style="font-size: 32px; font-weight: bold; color: #4F46E5; letter-spacing: 5px; background-color: #f0f0f0; padding: 20px; border-radius: 10px; display: inline-block;">
                ${otp}
              </p>
            </div>
            <p style="text-align: center; color: #666; font-size: 14px;">Mã OTP này sẽ hết hạn sau 10 phút.</p>
            <p style="text-align: center; color: #666; font-size: 14px;">Nếu bạn không đăng ký tài khoản này, vui lòng bỏ qua email này.</p>
          </div>
        </div>
      `,
    };
  }

  static passwordResetEmail(user, otp) {
    return {
      from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM_ADDRESS}>`,
      to: user.email,
      subject: 'Đặt lại mật khẩu - Internship Recruitment Platform',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #4F46E5; color: white; padding: 20px; text-align: center;">
            <h1>Đặt lại mật khẩu</h1>
          </div>
          <div style="padding: 20px; background-color: #f9f9f9;">
            <p>Xin chào ${user.fullName},</p>
            <p>Bạn đã yêu cầu đặt lại mật khẩu. Vui lòng sử dụng mã OTP sau để đặt lại mật khẩu:</p>
            <div style="text-align: center; margin: 30px 0;">
              <p style="font-size: 32px; font-weight: bold; color: #4F46E5; letter-spacing: 5px; background-color: #f0f0f0; padding: 20px; border-radius: 10px; display: inline-block;">${otp}</p>
            </div>
            <p>Mã OTP này sẽ hết hạn sau 10 phút.</p>
            <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
          </div>
        </div>
      `,
    };
  }

  static loginOTPEmail(user, otp) {
    return {
      from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM_ADDRESS}>`,
      to: user.email,
      subject: 'Mã OTP Đăng nhập - Internship Recruitment Platform',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #4F46E5; color: white; padding: 20px; text-align: center;">
            <h1>Mã OTP Đăng nhập</h1>
          </div>
          <div style="padding: 20px; background-color: #f9f9f9;">
            <p>Xin chào ${user.fullName},</p>
            <p>Đây là mã OTP để đăng nhập vào tài khoản của bạn:</p>
            <div style="text-align: center; margin: 30px 0;">
              <p style="font-size: 24px; font-weight: bold;">${otp}</p>
            </div>
            <p>Mã OTP này sẽ hết hạn sau 5 phút.</p>
            <p>Nếu bạn không yêu cầu đăng nhập, vui lòng bỏ qua email này.</p>
          </div>
        </div>
      `,
    };
  }

  static testEmail(email) {
    return {
      from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM_ADDRESS}>`,
      to: email,
      subject: 'Test Email - Internship Recruitment Platform',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #4F46E5; color: white; padding: 20px; text-align: center;">
            <h1>Test Email</h1>
          </div>
          <div style="padding: 20px; background-color: #f9f9f9;">
            <p>Đây là email test để kiểm tra tính hợp lệ của địa chỉ email.</p>
            <p>Nếu bạn nhận được email này, địa chỉ email của bạn là hợp lệ.</p>
            <p>Bạn có thể bỏ qua email này.</p>
          </div>
        </div>
      `,
    };
  }

  static jobInvitationEmail(data) {
    const {
      candidateName,
      candidateEmail,
      companyName,
      companyLogo,
      jobTitle,
      jobLocation,
      salaryMin,
      salaryMax,
      currency,
      jobDescription,
      invitationLink,
      employerName,
      employerEmail,
    } = data;

    // Format salary
    let salaryText = 'Thỏa thuận';
    if (salaryMin || salaryMax) {
      const min = salaryMin ? salaryMin.toLocaleString('vi-VN') : '';
      const max = salaryMax ? salaryMax.toLocaleString('vi-VN') : '';
      salaryText = min && max ? `${min} - ${max}` : min || max;
      salaryText += ` ${currency || 'VND'}`;
    }

    // Format location
    const locationText = jobLocation?.fullAddress || jobLocation?.city || jobLocation || 'Không xác định';

    return {
      from: `"${process.env.EMAIL_FROM_NAME || 'InternBridge'}" <${process.env.EMAIL_FROM_ADDRESS || process.env.SMTP_USER}>`,
      to: candidateEmail,
      subject: `Lời mời ứng tuyển: ${jobTitle} tại ${companyName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #4F46E5; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">Lời mời ứng tuyển</h1>
          </div>
          <div style="padding: 20px; background-color: #f9f9f9;">
            ${companyLogo ? `
              <div style="text-align: center; margin-bottom: 20px;">
                <img src="${companyLogo}" alt="${companyName}" style="max-width: 120px; height: auto; border-radius: 8px;">
              </div>
            ` : ''}
            
            <p style="font-size: 16px; line-height: 1.6; color: #333;">Xin chào <strong>${candidateName}</strong>,</p>
            
            <p style="font-size: 16px; line-height: 1.6; color: #333;">
              Chúng tôi là <strong>${companyName}</strong>, và chúng tôi rất ấn tượng với hồ sơ của bạn.
              Chúng tôi muốn mời bạn ứng tuyển vào vị trí <strong>${jobTitle}</strong>.
            </p>

            <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e5e7eb;">
              <h3 style="margin: 0 0 15px 0; color: #1f2937; font-size: 20px;">${jobTitle}</h3>
              
              <div style="margin: 10px 0;">
                <p style="margin: 5px 0; color: #6b7280; font-size: 14px;">
                  <strong style="color: #374151;">🏢 Công ty:</strong> ${companyName}
                </p>
              </div>
              
              <div style="margin: 10px 0;">
                <p style="margin: 5px 0; color: #6b7280; font-size: 14px;">
                  <strong style="color: #374151;">📍 Địa điểm:</strong> ${locationText}
                </p>
              </div>
              
              <div style="margin: 10px 0;">
                <p style="margin: 5px 0; color: #6b7280; font-size: 14px;">
                  <strong style="color: #374151;">💰 Mức lương:</strong> ${salaryText}
                </p>
              </div>
            </div>

            ${jobDescription ? `
              <div style="background-color: #f0f9ff; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0ea5e9;">
                <p style="margin: 0 0 10px 0; color: #0c4a6e; font-weight: 600;">Mô tả công việc:</p>
                <p style="margin: 0; color: #075985; font-size: 14px; line-height: 1.6;">
                  ${jobDescription.substring(0, 300)}${jobDescription.length > 300 ? '...' : ''}
                </p>
              </div>
            ` : ''}

            <p style="font-size: 16px; line-height: 1.6; color: #333; margin: 20px 0;">
              Chúng tôi tin rằng kỹ năng và kinh nghiệm của bạn rất phù hợp với yêu cầu của vị trí này.
              Hãy xem chi tiết công việc và nộp hồ sơ của bạn qua liên kết dưới đây:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${invitationLink}" 
                 style="background-color: #4F46E5; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600; font-size: 16px;">
                Xem chi tiết và ứng tuyển
              </a>
            </div>

            <p style="color: #6b7280; font-size: 14px; margin-top: 30px; line-height: 1.6;">
              Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với chúng tôi qua email này.
            </p>

            <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
            
            <p style="color: #6b7280; font-size: 12px; margin: 0; line-height: 1.6;">
              Email này được gửi tự động từ hệ thống InternBridge.<br>
              Người gửi: ${employerName}${employerEmail ? ` (${employerEmail})` : ''}
            </p>
          </div>
        </div>
      `,
    };
  }
}

module.exports = EmailTemplate;
