import { Facebook, Youtube, Linkedin, Instagram } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-muted mt-16">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="text-2xl font-bold text-primary mb-4">
              InternBridge
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Nền tảng hoàn hảo cho sinh viên định hướng việc làm
            </p>
            {/* hover:scale-110 transform làm cho biểu tưởng lớn hơn 1.11 lần */}
            <div className="flex space-x-4">
              <Facebook className="w-5 h-5 text-muted-foreground hover:text-primary cursor-pointer transition-colors duration-200 hover:scale-110 transform" />
              <Youtube className="w-5 h-5 text-muted-foreground hover:text-primary cursor-pointer transition-colors duration-200 hover:scale-110 transform" />
              <Linkedin className="w-5 h-5 text-muted-foreground hover:text-primary cursor-pointer transition-colors duration-200 hover:scale-110 transform" />
              <Instagram className="w-5 h-5 text-muted-foreground hover:text-primary cursor-pointer transition-colors duration-200 hover:scale-110 transform" />
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-4 text-foreground">
              Về InternBridge
            </h3>
            <div className="space-y-2 text-sm text-muted-foreground font-medium">
              <div className="hover:text-primary cursor-pointer transition-colors duration-200">
                Giới thiệu
              </div>
              <div className="hover:text-primary cursor-pointer transition-colors duration-200">
                Góc báo chí
              </div>
              <div className="hover:text-primary cursor-pointer transition-colors duration-200">
                Tuyển dụng
              </div>
              <div className="hover:text-primary cursor-pointer transition-colors duration-200">
                Liên hệ
              </div>
              <div className="hover:text-primary cursor-pointer transition-colors duration-200">
                Hỏi đáp
              </div>
              <div className="hover:text-primary cursor-pointer transition-colors duration-200">
                Chính sách bảo mật
              </div>
              <div className="hover:text-primary cursor-pointer transition-colors duration-200">
                Điều khoản dịch vụ
              </div>
              <div className="hover:text-primary cursor-pointer transition-colors duration-200">
                Quy chế hoạt động
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-4 text-foreground">Hồ sơ và CV</h3>
            <div className="space-y-2 text-sm text-muted-foreground font-medium">
              <div className="hover:text-primary cursor-pointer transition-colors duration-200">
                Quản lý CV của bạn
              </div>
              <div className="hover:text-primary cursor-pointer transition-colors duration-200">
                TopCV Profile
              </div>
              <div className="hover:text-primary cursor-pointer transition-colors duration-200">
                Hướng dẫn viết CV
              </div>
              <div className="hover:text-primary cursor-pointer transition-colors duration-200">
                Thư viện CV theo ngành nghề
              </div>
              <div className="hover:text-primary cursor-pointer transition-colors duration-200">
                Review CV
              </div>
              <div className="hover:text-primary cursor-pointer transition-colors duration-200">
                Mẫu CV đẹp
              </div>
              <div className="hover:text-primary cursor-pointer transition-colors duration-200">
                Tạo CV online
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-4 text-foreground">
              Xây dựng sự nghiệp
            </h3>
            <div className="space-y-2 text-sm text-muted-foreground font-medium">
              <div className="hover:text-primary cursor-pointer transition-colors duration-200">
                Việc làm tốt nhất
              </div>
              <div className="hover:text-primary cursor-pointer transition-colors duration-200">
                Việc làm lương cao
              </div>
              <div className="hover:text-primary cursor-pointer transition-colors duration-200">
                Việc làm quản lý
              </div>
              <div className="hover:text-primary cursor-pointer transition-colors duration-200">
                Việc làm IT
              </div>
              <div className="hover:text-primary cursor-pointer transition-colors duration-200">
                Việc làm Senior
              </div>
              <div className="hover:text-primary cursor-pointer transition-colors duration-200">
                Việc làm bán thời gian
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-sm text-muted-foreground mb-4 md:mb-0">
              {/* text-muted-foreground màu xám nhạt */}
              <strong>
                Khóa luận tốt nghiệp N134 Nguyễn Ngọc Tường Vân và Nguyễn Thị
                Thu Hồng
              </strong>
            </div>
            <div className="flex items-center space-x-4">
              {/* dùng màu chữ chính đểlàm màu nền */}
              <div className="w-16 h-16 bg-foreground rounded grid grid-cols-3 gap-px">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="bg-background rounded-sm"></div>
                ))}
              </div>
            </div>
          </div>
          <div className="text-xs text-muted-foreground mt-4">InternBridge</div>
        </div>
      </div>
    </footer>
  );
}
