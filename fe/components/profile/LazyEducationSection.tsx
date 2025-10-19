"use client";

import React, { useState, useEffect } from "react";
import { Plus, Edit, Trash2, GraduationCap, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useLazyProfile } from "@/hooks/useLazyProfile";
import { EducationEntry, EducationFormData } from "@/lib/api";

interface LazyEducationSectionProps {
  className?: string;
}

export default function LazyEducationSection({
  className,
}: LazyEducationSectionProps) {
  const {
    education,
    loading,
    errors,
    fetchEducation,
    addEducation,
    updateEducation,
    deleteEducation,
  } = useLazyProfile();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<EducationEntry | null>(null);
  const [formData, setFormData] = useState<EducationFormData>({
    type: "certification",
    institution: "",
    degree: "",
    field: "",
    gpa: undefined,
    achievements: [],
  });

  // Lazy load data when component mounts
  useEffect(() => {
    fetchEducation();
  }, [fetchEducation]);

  // Debug log to see education data structure
  useEffect(() => {
    console.log("Education data:", education);
    console.log("Education university:", education?.university);
    console.log("Education certifications:", education?.certifications);
    console.log("Education data type:", typeof education);
    console.log(
      "Education data keys:",
      education ? Object.keys(education) : "null"
    );
  }, [education]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await updateEducation(editingItem._id!, formData);
      } else {
        await addEducation(formData);
      }
      setIsDialogOpen(false);
      setEditingItem(null);
      setFormData({
        type: "certification",
        institution: "",
        degree: "",
        field: "",
        gpa: undefined,
        achievements: [],
      });
    } catch (error) {
      console.error("Error saving education:", error);
    }
  };

  const handleEdit = (item: EducationEntry) => {
    console.log("Editing item:", item);
    setEditingItem(item);
    const formDataToSet = {
      type: item.type,
      institution: item.institution || (item as any).issuer || "",
      degree: item.degree || (item as any).name || "",
      field: item.field || "",
      gpa: item.gpa,
      achievements: item.achievements || [],
    };
    console.log("Setting form data:", formDataToSet);
    setFormData(formDataToSet);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa mục này?")) {
      try {
        await deleteEducation(id);
      } catch (error) {
        console.error("Error deleting education:", error);
      }
    }
  };

  const addAchievement = () => {
    setFormData((prev) => ({
      ...prev,
      achievements: [...(prev.achievements || []), ""],
    }));
  };

  const updateAchievement = (index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      achievements:
        prev.achievements?.map((item, i) => (i === index ? value : item)) || [],
    }));
  };

  const removeAchievement = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      achievements: prev.achievements?.filter((_, i) => i !== index) || [],
    }));
  };

  if (loading.education) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="animate-pulse">Đang tải dữ liệu học vấn...</div>
        </CardContent>
      </Card>
    );
  }

  if (errors.education) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-red-500">Lỗi: {errors.education}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <GraduationCap className="w-5 h-5" />
          Học vấn
        </CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={() => setEditingItem(null)}>
              <Plus className="w-4 h-4 mr-2" />
              Thêm học vấn/ chứng chỉ
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingItem
                  ? `Chỉnh sửa ${
                      editingItem.type === "certification"
                        ? "chứng chỉ"
                        : "học vấn"
                    }`
                  : "Thêm học vấn/ chứng chỉ mới"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type">Loại học vấn</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: "university" | "certification") =>
                      setFormData((prev) => ({ ...prev, type: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="university">Đại học</SelectItem>
                      <SelectItem value="certification">Chứng chỉ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="institution">
                    {formData.type === "certification"
                      ? "Tên tổ chức cấp chứng chỉ *"
                      : "Tên trường/tổ chức *"}
                  </Label>
                  <Input
                    id="institution"
                    value={formData.institution}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        institution: e.target.value,
                      }))
                    }
                    placeholder={
                      formData.type === "certification"
                        ? "Ví dụ: ETS, Microsoft, Google"
                        : "Ví dụ: Đại học Bách Khoa"
                    }
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="degree">
                    {formData.type === "certification"
                      ? "Tên chứng chỉ"
                      : "Bằng cấp"}
                  </Label>
                  <Input
                    id="degree"
                    value={formData.degree}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        degree: e.target.value,
                      }))
                    }
                    placeholder={
                      formData.type === "certification"
                        ? "Ví dụ: Chứng chỉ TOEIC"
                        : "Ví dụ: Cử nhân"
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="field">
                    {formData.type === "certification"
                      ? "Lĩnh vực"
                      : "Chuyên ngành"}
                  </Label>
                  <Input
                    id="field"
                    value={formData.field}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        field: e.target.value,
                      }))
                    }
                    placeholder={
                      formData.type === "certification"
                        ? "Ví dụ: Xử lý ảnh"
                        : "Ví dụ: Công nghệ thông tin"
                    }
                  />
                </div>
              </div>

              {formData.type === "university" && (
                <div>
                  <Label htmlFor="gpa">GPA</Label>
                  <Input
                    id="gpa"
                    type="number"
                    step="0.1"
                    min="0"
                    max="4"
                    value={formData.gpa || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        gpa: parseFloat(e.target.value) || undefined,
                      }))
                    }
                  />
                </div>
              )}

              <div>
                <Label>Thành tích</Label>
                {formData.achievements?.map((achievement, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <Input
                      value={achievement}
                      onChange={(e) => updateAchievement(index, e.target.value)}
                      placeholder="Nhập thành tích"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeAchievement(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addAchievement}
                  className="mt-2 ml-10"
                >
                  <Plus className="w-4 h-4 mr-" />
                  Thêm thành tích
                </Button>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Hủy
                </Button>
                <Button type="submit">
                  {editingItem ? "Cập nhật" : "Thêm"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* University Education */}
          {education?.university && (
            <div className="border rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <GraduationCap className="w-5 h-5 text-blue-600" />
                    <h3 className="font-semibold text-lg">
                      {education.university.institution}
                    </h3>
                    <Badge variant="secondary">
                      {education.university.type}
                    </Badge>
                  </div>
                  {education.university.degree && (
                    <p className="text-gray-600 mb-1">
                      {education.university.degree}
                    </p>
                  )}
                  {education.university.field && (
                    <p className="text-gray-600 mb-1">
                      {education.university.field}
                    </p>
                  )}
                  <div className="flex gap-4 text-sm text-gray-500 mb-2">
                    {education.university.startDate && (
                      <span>
                        {new Date(education.university.startDate).getFullYear()}
                      </span>
                    )}
                    {education.university.endDate && (
                      <span>
                        - {new Date(education.university.endDate).getFullYear()}
                      </span>
                    )}
                    {!education.university.startDate &&
                      !education.university.endDate && (
                        <span>Thông tin thời gian chưa được cập nhật</span>
                      )}
                    {education.university.gpa && (
                      <span>GPA: {education.university.gpa}</span>
                    )}
                  </div>
                  {education.university.achievements &&
                    education.university.achievements.length > 0 && (
                      <div className="mt-2">
                        <h4 className="text-sm font-medium mb-1">
                          Thành tích:
                        </h4>
                        <ul className="text-sm text-gray-600">
                          {education.university.achievements.map(
                            (achievement, index) => (
                              <li
                                key={index}
                                className="flex items-center gap-1"
                              >
                                <Award className="w-3 h-3 text-yellow-500" />
                                {achievement}
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                    )}
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(education.university!)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(education.university!._id!)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Certifications */}
          {education?.certifications && education.certifications.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Award className="w-5 h-5 text-green-600" />
                  Chứng chỉ ({education.certifications.length})
                </h3>
              </div>

              {/* Grid layout for certifications */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {education.certifications.map((cert, index) => (
                  <div
                    key={cert._id || index}
                    className="group relative bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-xl p-5 hover:shadow-lg hover:border-green-300 transition-all duration-300 hover:-translate-y-1"
                  >
                    {/* Header with icon and actions */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-sm">
                        <Award className="w-5 h-5 text-white" />
                      </div>

                      {/* Action buttons - only show on hover */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(cert)}
                            className="h-7 w-7 p-0 hover:bg-blue-100 rounded-lg"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(cert._id!)}
                            className="h-7 w-7 p-0 hover:bg-red-100 rounded-lg"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Content with clear hierarchy */}
                    <div className="space-y-3">
                      {/* 1. Tên chứng chỉ - Priority 1 */}
                      <div>
                        <h4 className="font-bold text-base text-gray-900 leading-tight">
                          {(cert as any).name ||
                            cert.degree ||
                            cert.institution ||
                            "Chứng chỉ"}
                        </h4>
                      </div>

                      {/* 2. Lĩnh vực - Priority 2 */}
                      {cert.field && (
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                          <span className="text-sm text-gray-700 font-medium">
                            {cert.field}
                          </span>
                        </div>
                      )}

                      {/* 3. Tổ chức cấp - Priority 3 */}
                      {(cert as any).issuer && (
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                          <span className="text-sm text-gray-600">
                            {(cert as any).issuer}
                          </span>
                        </div>
                      )}

                      {/* 4. Institution (if different from issuer) */}
                      {cert.institution &&
                        cert.institution !== (cert as any).issuer && (
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                            <span className="text-xs text-gray-500">
                              {cert.institution}
                            </span>
                          </div>
                        )}

                      {/* 5. Achievements - Priority 4 */}
                      {cert.achievements && cert.achievements.length > 0 && (
                        <div className="pt-2 border-t border-gray-100">
                          <div className="flex flex-wrap gap-1.5">
                            {cert.achievements
                              .slice(0, 2)
                              .map((achievement, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 font-medium"
                                >
                                  {achievement}
                                </span>
                              ))}
                            {cert.achievements.length > 2 && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600 font-medium">
                                +{cert.achievements.length - 2} khác
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!education?.university &&
            (!education?.certifications ||
              education.certifications.length === 0) && (
              <div className="text-center py-8 text-gray-500">
                <GraduationCap className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Chưa có thông tin học vấn</p>
                <p className="text-sm">
                  Thêm thông tin học vấn để hoàn thiện hồ sơ
                </p>
              </div>
            )}
        </div>
      </CardContent>
    </Card>
  );
}
