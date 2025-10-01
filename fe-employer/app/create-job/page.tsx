"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createJob, CreateJobPayload, submitJobForReview } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { X, Plus, Send } from "lucide-react";

export default function CreateJobPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [createdJobId, setCreatedJobId] = useState<string | null>(null);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState<CreateJobPayload>({
    title: "",
    description: "",
    skills: [],
    requirements: "",
    education: "",
    experience: "",
    salary: "",
    location: "",
    positions: 1,
    deadline: "",
  });

  const [newSkill, setNewSkill] = useState("");

  const handleInputChange = (
    field: keyof CreateJobPayload,
    value: string | number
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const addSkill = () => {
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      setFormData((prev) => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()],
      }));
      setNewSkill("");
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((skill) => skill !== skillToRemove),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const token =
        localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) {
        setError("Vui lòng đăng nhập để tạo bài tuyển dụng");
        return;
      }

      const result = await createJob(formData, token);

      if (result.success) {
        setCreatedJobId(result.data?._id || result.data?.id);
        setSuccess(true);
        setShowSubmitDialog(true);
      } else {
        setError(result.error || "Có lỗi xảy ra khi tạo bài tuyển dụng");
      }
    } catch (err) {
      setError("Có lỗi xảy ra khi tạo bài tuyển dụng");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitForReview = async () => {
    if (!createdJobId) return;

    try {
      setSubmitting(true);
      const token =
        localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) return;

      const result = await submitJobForReview(
        createdJobId,
        token,
        "Please review this job posting for approval",
        false
      );

      if (result.success) {
        setShowSubmitDialog(false);
        setTimeout(() => {
          router.push("/dashboard");
        }, 1500);
      } else {
        setError(result.error || "Không thể gửi duyệt bài tuyển dụng");
      }
    } catch (err) {
      setError("Có lỗi xảy ra khi gửi duyệt bài tuyển dụng");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkipSubmit = () => {
    setShowSubmitDialog(false);
    setTimeout(() => {
      router.push("/dashboard");
    }, 1500);
  };

  if (success && !showSubmitDialog) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-green-600 text-lg font-semibold mb-2">
              ✅ Tạo bài tuyển dụng thành công!
            </div>
            <p className="text-gray-600">
              Bài tuyển dụng đã được tạo và đang chờ duyệt. Bạn sẽ được chuyển
              về trang dashboard.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-2">Tạo bài tuyển dụng mới</h1>
        <p className="text-gray-600">
          Điền thông tin chi tiết về vị trí tuyển dụng
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Thông tin cơ bản</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Tiêu đề bài tuyển dụng *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                placeholder="Ví dụ: Frontend Developer Intern"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Mô tả công việc *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                placeholder="Mô tả chi tiết về công việc, trách nhiệm..."
                rows={4}
                required
              />
            </div>

            <div>
              <Label htmlFor="location">Địa điểm làm việc *</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => handleInputChange("location", e.target.value)}
                placeholder="Ví dụ: Ho Chi Minh City"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="positions">Số lượng vị trí *</Label>
                <Input
                  id="positions"
                  type="number"
                  min="1"
                  value={formData.positions}
                  onChange={(e) =>
                    handleInputChange(
                      "positions",
                      parseInt(e.target.value) || 1
                    )
                  }
                  required
                />
              </div>

              <div>
                <Label htmlFor="salary">Mức lương *</Label>
                <Input
                  id="salary"
                  value={formData.salary}
                  onChange={(e) => handleInputChange("salary", e.target.value)}
                  placeholder="Ví dụ: 8000000 - 12000000 VND"
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Yêu cầu và kỹ năng</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="requirements">Yêu cầu công việc *</Label>
              <Textarea
                id="requirements"
                value={formData.requirements}
                onChange={(e) =>
                  handleInputChange("requirements", e.target.value)
                }
                placeholder="Liệt kê các yêu cầu cụ thể..."
                rows={3}
                required
              />
            </div>

            <div>
              <Label htmlFor="education">Yêu cầu học vấn *</Label>
              <Input
                id="education"
                value={formData.education}
                onChange={(e) => handleInputChange("education", e.target.value)}
                placeholder="Ví dụ: Đang học hoặc tốt nghiệp ngành Công nghệ thông tin"
                required
              />
            </div>

            <div>
              <Label htmlFor="experience">Kinh nghiệm *</Label>
              <Input
                id="experience"
                value={formData.experience}
                onChange={(e) =>
                  handleInputChange("experience", e.target.value)
                }
                placeholder="Ví dụ: 0-1 năm kinh nghiệm hoặc sinh viên mới tốt nghiệp"
                required
              />
            </div>

            <div>
              <Label>Kỹ năng yêu cầu *</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  placeholder="Nhập kỹ năng và nhấn Enter"
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addSkill();
                    }
                  }}
                />
                <Button type="button" onClick={addSkill} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.skills.map((skill) => (
                  <Badge
                    key={skill}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    {skill}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => removeSkill(skill)}
                    />
                  </Badge>
                ))}
              </div>
              {formData.skills.length === 0 && (
                <p className="text-sm text-gray-500">
                  Chưa có kỹ năng nào được thêm
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Thời gian</CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <Label htmlFor="deadline">Hạn nộp hồ sơ *</Label>
              <Input
                id="deadline"
                type="datetime-local"
                value={formData.deadline}
                onChange={(e) => handleInputChange("deadline", e.target.value)}
                required
              />
            </div>
          </CardContent>
        </Card>

        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <p className="text-red-600">{error}</p>
            </CardContent>
          </Card>
        )}

        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={loading}
          >
            Hủy
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Đang tạo..." : "Tạo bài tuyển dụng"}
          </Button>
        </div>
      </form>

      {/* Submit for Review Dialog */}
      <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Gửi duyệt bài tuyển dụng</AlertDialogTitle>
            <AlertDialogDescription>
              Bài tuyển dụng đã được tạo thành công! Bạn có muốn gửi bài này để
              duyệt ngay bây giờ không?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleSkipSubmit} disabled={submitting}>
              Thoát
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSubmitForReview}
              disabled={submitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Đang gửi...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Gửi duyệt
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
