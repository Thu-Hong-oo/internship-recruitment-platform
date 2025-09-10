import { PageLayout } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";

export default function AboutPage() {
  return (
    <PageLayout>
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Về InternBridge
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            InternBridge là nền tảng tìm việc làm hàng đầu tại Việt Nam, kết nối
            hàng nghìn ứng viên với các doanh nghiệp uy tín.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <Card className="card-hover">
            <CardContent className="p-6 text-center">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-xl font-semibold mb-2">Sứ mệnh</h3>
              <p className="text-muted-foreground">
                Kết nối người tìm việc với cơ hội nghề nghiệp phù hợp nhất
              </p>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardContent className="p-6 text-center">
              <div className="text-4xl mb-4">🌟</div>
              <h3 className="text-xl font-semibold mb-2">Tầm nhìn</h3>
              <p className="text-muted-foreground">
                Trở thành nền tảng tuyển dụng số 1 tại Việt Nam
              </p>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardContent className="p-6 text-center">
              <div className="text-4xl mb-4">💡</div>
              <h3 className="text-xl font-semibold mb-2">Giá trị cốt lõi</h3>
              <p className="text-muted-foreground">
                Chất lượng, uy tín và sự hài lòng của khách hàng
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="bg-muted rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-6 text-center">
            Thống kê ấn tượng
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">
                40,000+
              </div>
              <div className="text-sm text-muted-foreground">
                Tin tuyển dụng mỗi ngày
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">1,000+</div>
              <div className="text-sm text-muted-foreground">
                Doanh nghiệp đối tác
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">
                500,000+
              </div>
              <div className="text-sm text-muted-foreground">
                Ứng viên đã tìm được việc
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">95%</div>
              <div className="text-sm text-muted-foreground">
                Tỷ lệ hài lòng
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
