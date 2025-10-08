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
import { EducationEntry, EducationFormData } from "@/lib/types/profile";

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
    type: "university",
    institution: "",
    degree: "",
    field: "",
    startDate: "",
    endDate: "",
    gpa: undefined,
    achievements: [],
  });

  // Lazy load data when component mounts
  useEffect(() => {
    fetchEducation();
  }, [fetchEducation]);

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
        type: "university",
        institution: "",
        degree: "",
        field: "",
        startDate: "",
        endDate: "",
        gpa: undefined,
        achievements: [],
      });
    } catch (error) {
      console.error("Error saving education:", error);
    }
  };

  const handleEdit = (item: EducationEntry) => {
    setEditingItem(item);
    setFormData({
      type: item.type,
      institution: item.institution,
      degree: item.degree || "",
      field: item.field || "",
      startDate: item.startDate || "",
      endDate: item.endDate || "",
      gpa: item.gpa,
      achievements: item.achievements || [],
    });
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
              Thêm học vấn
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? "Chỉnh sửa học vấn" : "Thêm học vấn mới"}
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
                  <Label htmlFor="institution">Tên trường/tổ chức *</Label>
                  <Input
                    id="institution"
                    value={formData.institution}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        institution: e.target.value,
                      }))
                    }
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="degree">Bằng cấp</Label>
                  <Input
                    id="degree"
                    value={formData.degree}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        degree: e.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="field">Chuyên ngành</Label>
                  <Input
                    id="field"
                    value={formData.field}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        field: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">Ngày bắt đầu</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        startDate: e.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">Ngày kết thúc</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        endDate: e.target.value,
                      }))
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
                  className="mt-2"
                >
                  <Plus className="w-4 h-4 mr-2" />
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
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Chứng chỉ</h3>
              {education.certifications.map((cert, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Award className="w-5 h-5 text-green-600" />
                        <h4 className="font-semibold">{cert.institution}</h4>
                        <Badge variant="outline">{cert.type}</Badge>
                      </div>
                      {cert.degree && (
                        <p className="text-gray-600 mb-1">{cert.degree}</p>
                      )}
                      {cert.field && (
                        <p className="text-gray-600 mb-1">{cert.field}</p>
                      )}
                      <div className="flex gap-4 text-sm text-gray-500">
                        {cert.startDate && (
                          <span>{new Date(cert.startDate).getFullYear()}</span>
                        )}
                        {cert.endDate && (
                          <span>- {new Date(cert.endDate).getFullYear()}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(cert)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(cert._id!)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
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

