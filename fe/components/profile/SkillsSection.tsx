"use client";

import React, { useState } from "react";
import { Plus, Edit, Trash2, Code, Users, Globe, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { useSkills } from "@/hooks/useProfile";
import { Skill, LanguageSkill, SkillFormData } from "@/lib/api";

interface SkillsSectionProps {
  className?: string;
}

export default function SkillsSection({ className }: SkillsSectionProps) {
  const { skills, loading, error, addSkill, updateSkill, deleteSkill } =
    useSkills();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Skill | LanguageSkill | null>(
    null
  );
  const [formType, setFormType] = useState<"technical" | "soft" | "language">(
    "technical"
  );
  const [formData, setFormData] = useState<SkillFormData>({
    type: "technical",
    name: "",
    level: "intermediate",
    projects: [],
    selfAssessment: undefined,
    certificate: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await updateSkill(editingItem._id!, formData);
      } else {
        await addSkill(formData);
      }
      setIsDialogOpen(false);
      setEditingItem(null);
      resetForm();
    } catch (error) {
      console.error("Error saving skill:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      type: "technical",
      name: "",
      level: "intermediate",
      projects: [],
      selfAssessment: undefined,
      certificate: "",
    });
  };

  const handleEdit = (item: Skill | LanguageSkill) => {
    setEditingItem(item);
    setFormType(item.type);
    setFormData({
      type: item.type,
      name: item.name,
      level: item.level,
      projects: item.projects || [],
      selfAssessment: item.selfAssessment,
      certificate: item.certificate || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa kỹ năng này?")) {
      try {
        await deleteSkill(id);
      } catch (error) {
        console.error("Error deleting skill:", error);
      }
    }
  };

  const getSkillIcon = (type: string) => {
    switch (type) {
      case "technical":
        return <Code className="w-4 h-4 text-blue-600" />;
      case "soft":
        return <Users className="w-4 h-4 text-green-600" />;
      case "language":
        return <Globe className="w-4 h-4 text-purple-600" />;
      default:
        return <Code className="w-4 h-4" />;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case "beginner":
        return "bg-red-100 text-red-800";
      case "intermediate":
        return "bg-yellow-100 text-yellow-800";
      case "advanced":
        return "bg-blue-100 text-blue-800";
      case "expert":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getLevelLabel = (level: string) => {
    switch (level) {
      case "beginner":
        return "Mới bắt đầu";
      case "intermediate":
        return "Trung bình";
      case "advanced":
        return "Nâng cao";
      case "expert":
        return "Chuyên gia";
      default:
        return level;
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="animate-pulse">Đang tải dữ liệu kỹ năng...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-red-500">Lỗi: {error}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Code className="w-5 h-5" />
          Kỹ năng
        </CardTitle>
        <div className="flex gap-2">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                onClick={() => {
                  setEditingItem(null);
                  setFormType("technical");
                  resetForm();
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Thêm kỹ năng
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingItem ? "Chỉnh sửa kỹ năng" : "Thêm kỹ năng mới"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="skillType">Loại kỹ năng</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(
                        value: "technical" | "soft" | "language"
                      ) => {
                        setFormData((prev) => ({ ...prev, type: value }));
                        setFormType(value);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="technical">Kỹ thuật</SelectItem>
                        <SelectItem value="soft">Kỹ năng mềm</SelectItem>
                        <SelectItem value="language">Ngoại ngữ</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="skillName">Tên kỹ năng *</Label>
                    <Input
                      id="skillName"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="skillLevel">Mức độ</Label>
                    <Select
                      value={formData.level}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, level: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Mới bắt đầu</SelectItem>
                        <SelectItem value="intermediate">Trung bình</SelectItem>
                        <SelectItem value="advanced">Nâng cao</SelectItem>
                        <SelectItem value="expert">Chuyên gia</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {formData.type === "soft" && (
                    <div>
                      <Label htmlFor="selfAssessment">Đánh giá (1-5)</Label>
                      <Select
                        value={formData.selfAssessment?.toString() || ""}
                        onValueChange={(value) =>
                          setFormData((prev) => ({
                            ...prev,
                            selfAssessment: parseInt(value),
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn mức độ" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 - Rất yếu</SelectItem>
                          <SelectItem value="2">2 - Yếu</SelectItem>
                          <SelectItem value="3">3 - Trung bình</SelectItem>
                          <SelectItem value="4">4 - Tốt</SelectItem>
                          <SelectItem value="5">5 - Xuất sắc</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                {formData.type === "language" && (
                  <div>
                    <Label htmlFor="certificate">Chứng chỉ</Label>
                    <Input
                      id="certificate"
                      value={formData.certificate}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          certificate: e.target.value,
                        }))
                      }
                      placeholder="Ví dụ: IELTS 7.5, TOEIC 800"
                    />
                  </div>
                )}

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
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Technical Skills */}
          {skills?.technical && skills.technical.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Code className="w-5 h-5 text-blue-600" />
                Kỹ năng kỹ thuật
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {skills.technical.map((skill, index) => (
                  <div key={index} className="border rounded-lg p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getSkillIcon(skill.type)}
                          <span className="font-medium">{skill.name}</span>
                        </div>
                        <Badge
                          className={`text-xs ${getLevelColor(skill.level)}`}
                        >
                          {getLevelLabel(skill.level)}
                        </Badge>
                        {skill.verified && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            <Star className="w-3 h-3 mr-1" />
                            Đã xác thực
                          </Badge>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(skill)}
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(skill._id!)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Soft Skills */}
          {skills?.soft && skills.soft.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Users className="w-5 h-5 text-green-600" />
                Kỹ năng mềm
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {skills.soft.map((skill, index) => (
                  <div key={index} className="border rounded-lg p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getSkillIcon(skill.type)}
                          <span className="font-medium">{skill.name}</span>
                        </div>
                        <div className="flex gap-2">
                          <Badge
                            className={`text-xs ${getLevelColor(skill.level)}`}
                          >
                            {getLevelLabel(skill.level)}
                          </Badge>
                          {skill.selfAssessment && (
                            <Badge variant="outline" className="text-xs">
                              {skill.selfAssessment}/5
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(skill)}
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(skill._id!)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Language Skills */}
          {skills?.languages && skills.languages.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Globe className="w-5 h-5 text-purple-600" />
                Ngoại ngữ
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {skills.languages.map((skill, index) => (
                  <div key={index} className="border rounded-lg p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getSkillIcon(skill.type)}
                          <span className="font-medium">{skill.name}</span>
                        </div>
                        <div className="space-y-1">
                          <Badge
                            className={`text-xs ${getLevelColor(skill.level)}`}
                          >
                            {skill.level}
                          </Badge>
                          {skill.certificate && (
                            <div className="text-xs text-gray-600">
                              {skill.certificate}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(skill)}
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(skill._id!)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(!skills?.technical || skills.technical.length === 0) &&
            (!skills?.soft || skills.soft.length === 0) &&
            (!skills?.languages || skills.languages.length === 0) && (
              <div className="text-center py-8 text-gray-500">
                <Code className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Chưa có thông tin kỹ năng</p>
                <p className="text-sm">Thêm kỹ năng để hoàn thiện hồ sơ</p>
              </div>
            )}
        </div>
      </CardContent>
    </Card>
  );
}
