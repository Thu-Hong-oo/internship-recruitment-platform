import { Facebook, Youtube, Linkedin, Instagram } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-muted mt-16">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="text-2xl font-bold text-primary mb-4">topcv</div>
            <p className="text-sm text-muted-foreground mb-4">
              Ứng dụng tìm việc làm số 1 Việt Nam
            </p>
            <div className="flex space-x-4">
              <Facebook className="w-5 h-5 text-muted-foreground hover:text-primary cursor-pointer transition-colors duration-200" />
              <Youtube className="w-5 h-5 text-muted-foreground hover:text-primary cursor-pointer transition-colors duration-200" />
              <Linkedin className="w-5 h-5 text-muted-foreground hover:text-primary cursor-pointer transition-colors duration-200" />
              <Instagram className="w-5 h-5 text-muted-foreground hover:text-primary cursor-pointer transition-colors duration-200" />
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-4 text-foreground">Về TopCV</h3>
            <div className="space-y-2 text-sm text-muted-foreground font-medium">
              <div>Giới thiệu</div>
              <div>Góc báo chí</div>
              <div>Tuyển dụng</div>
              <div>Liên hệ</div>
              <div>Hỏi đáp</div>
              <div>Chính sách bảo mật</div>
              <div>Điều khoản dịch vụ</div>
              <div>Quy chế hoạt động</div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-4 text-foreground">Hồ sơ và CV</h3>
            <div className="space-y-2 text-sm text-muted-foreground font-medium">
              <div>Quản lý CV của bạn</div>
              <div>TopCV Profile</div>
              <div>Hướng dẫn viết CV</div>
              <div>Thư viện CV theo ngành nghề</div>
              <div>Review CV</div>
              <div>Mẫu CV đẹp</div>
              <div>Tạo CV online</div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-4 text-foreground">
              Xây dựng sự nghiệp
            </h3>
            <div className="space-y-2 text-sm text-muted-foreground font-medium">
              <div>Việc làm tốt nhất</div>
              <div>Việc làm lương cao</div>
              <div>Việc làm quản lý</div>
              <div>Việc làm IT</div>
              <div>Việc làm Senior</div>
              <div>Việc làm bán thời gian</div>
            </div>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-sm text-muted-foreground mb-4 md:mb-0">
              <strong>Công ty Cổ phần TopCV Việt Nam</strong>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-foreground rounded grid grid-cols-3 gap-px">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="bg-background rounded-sm"></div>
                ))}
              </div>
            </div>
          </div>
          <div className="text-xs text-muted-foreground mt-4">
            © 2014-2025 TopCV Vietnam JSC. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
