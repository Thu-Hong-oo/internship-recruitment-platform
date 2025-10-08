"use client";

import React, { useState } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Briefcase,
  Code,
  ExternalLink,
} from "lucide-react";
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
import { useExperience } from "@/hooks/useProfile";
import {
  ExperienceEntry,
  ProjectEntry,
  ExperienceFormData,
  ProjectFormData,
} from "@/lib/api";

interface ExperienceSectionProps {
  className?: string;
}

export default function ExperienceSection({
  className,
}: ExperienceSectionProps) {
  const {
    experience,
    loading,
    error,
    addExperience,
    updateExperience,
    deleteExperience,
  } = useExperience();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<
    ExperienceEntry | ProjectEntry | null
  >(null);
  const [formType, setFormType] = useState<"experience" | "project">(
    "experience"
  );
  const [formData, setFormData] = useState<
    ExperienceFormData | ProjectFormData
  >({
    type: "internship",
    company: "",
    position: "",
    startDate: "",
    endDate: "",
    description: "",
    skills: [],
    projects: [],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await updateExperience(editingItem._id!, formData);
      } else {
        await addExperience(formData);
      }
      setIsDialogOpen(false);
      setEditingItem(null);
      resetForm();
    } catch (error) {
      console.error("Error saving experience:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      type: "internship",
      company: "",
      position: "",
      startDate: "",
      endDate: "",
      description: "",
      skills: [],
      projects: [],
    });
  };

  const handleEdit = (item: ExperienceEntry | ProjectEntry) => {
    setEditingItem(item);
    if ("company" in item) {
      // Experience entry
      setFormType("experience");
      setFormData({
        type: item.type,
        company: item.company,
        position: item.position,
        startDate: item.startDate || "",
        endDate: item.endDate || "",
        description: item.description || "",
        skills: item.skills || [],
        projects: item.projects || [],
      });
    } else {
      // Project entry
      setFormType("project");
      setFormData({
        type: "project",
        name: item.name,
        description: item.description,
        role: item.role || "",
        technologies: item.technologies || [],
        url: item.url || "",
        startDate: item.startDate || "",
        endDate: item.endDate || "",
      });
    }
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa mục này?")) {
      try {
        await deleteExperience(id);
      } catch (error) {
        console.error("Error deleting experience:", error);
      }
    }
  };

  const addSkill = () => {
    setFormData((prev) => ({
      ...prev,
      skills: [...(prev.skills || []), ""],
    }));
  };

  const updateSkill = (index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills?.map((item, i) => (i === index ? value : item)) || [],
    }));
  };

  const removeSkill = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills?.filter((_, i) => i !== index) || [],
    }));
  };

  const addTechnology = () => {
    setFormData((prev) => ({
      ...prev,
      technologies: [...(prev.technologies || []), ""],
    }));
  };

  const updateTechnology = (index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      technologies:
        prev.technologies?.map((item, i) => (i === index ? value : item)) || [],
    }));
  };

  const removeTechnology = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      technologies: prev.technologies?.filter((_, i) => i !== index) || [],
    }));
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="animate-pulse">Đang tải dữ liệu kinh nghiệm...</div>
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
          <Briefcase className="w-5 h-5" />
          Kinh nghiệm
        </CardTitle>
        <div className="flex gap-2">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                onClick={() => {
                  setEditingItem(null);
                  setFormType("experience");
                  resetForm();
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Thêm kinh nghiệm
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingItem
                    ? "Chỉnh sửa kinh nghiệm"
                    : "Thêm kinh nghiệm mới"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="type">Loại kinh nghiệm</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(
                        value:
                          | "internship"
                          | "full-time"
                          | "part-time"
                          | "contract"
                      ) => setFormData((prev) => ({ ...prev, type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="internship">Thực tập</SelectItem>
                        <SelectItem value="full-time">
                          Toàn thời gian
                        </SelectItem>
                        <SelectItem value="part-time">Bán thời gian</SelectItem>
                        <SelectItem value="contract">Hợp đồng</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="company">Công ty *</Label>
                    <Input
                      id="company"
                      value={formData.company}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          company: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="position">Vị trí *</Label>
                  <Input
                    id="position"
                    value={formData.position}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        position: e.target.value,
                      }))
                    }
                    required
                  />
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

                <div>
                  <Label htmlFor="description">Mô tả công việc</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    rows={3}
                  />
                </div>

                <div>
                  <Label>Kỹ năng sử dụng</Label>
                  {formData.skills?.map((skill, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <Input
                        value={skill}
                        onChange={(e) => updateSkill(index, e.target.value)}
                        placeholder="Nhập kỹ năng"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeSkill(index)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addSkill}
                    className="mt-2"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Thêm kỹ năng
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

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setEditingItem(null);
                  setFormType("project");
                  setFormData({
                    type: "project",
                    name: "",
                    description: "",
                    role: "",
                    technologies: [],
                    url: "",
                    startDate: "",
                    endDate: "",
                  });
                }}
              >
                <Code className="w-4 h-4 mr-2" />
                Thêm dự án
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingItem ? "Chỉnh sửa dự án" : "Thêm dự án mới"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="projectName">Tên dự án *</Label>
                  <Input
                    id="projectName"
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

                <div>
                  <Label htmlFor="projectDescription">Mô tả dự án</Label>
                  <Textarea
                    id="projectDescription"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="role">Vai trò</Label>
                    <Input
                      id="role"
                      value={formData.role}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          role: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="url">URL dự án</Label>
                    <Input
                      id="url"
                      type="url"
                      value={formData.url}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          url: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="projectStartDate">Ngày bắt đầu</Label>
                    <Input
                      id="projectStartDate"
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
                    <Label htmlFor="projectEndDate">Ngày kết thúc</Label>
                    <Input
                      id="projectEndDate"
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

                <div>
                  <Label>Công nghệ sử dụng</Label>
                  {formData.technologies?.map((tech, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <Input
                        value={tech}
                        onChange={(e) =>
                          updateTechnology(index, e.target.value)
                        }
                        placeholder="Nhập công nghệ"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeTechnology(index)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addTechnology}
                    className="mt-2"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Thêm công nghệ
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
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Internships */}
          {experience?.internships && experience.internships.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-blue-600" />
                Kinh nghiệm làm việc
              </h3>
              {experience.internships.map((internship, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-lg">
                          {internship.position}
                        </h4>
                        <Badge variant="secondary">{internship.type}</Badge>
                      </div>
                      <p className="text-gray-600 mb-2">{internship.company}</p>
                      <div className="flex gap-4 text-sm text-gray-500 mb-2">
                        {internship.startDate && (
                          <span>
                            {new Date(internship.startDate).toLocaleDateString(
                              "vi-VN"
                            )}
                          </span>
                        )}
                        {internship.endDate && (
                          <span>
                            -{" "}
                            {new Date(internship.endDate).toLocaleDateString(
                              "vi-VN"
                            )}
                          </span>
                        )}
                      </div>
                      {internship.description && (
                        <p className="text-gray-700 mb-2">
                          {internship.description}
                        </p>
                      )}
                      {internship.skills && internship.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {internship.skills.map((skill, skillIndex) => (
                            <Badge
                              key={skillIndex}
                              variant="outline"
                              className="text-xs"
                            >
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(internship)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(internship._id!)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Projects */}
          {experience?.projects && experience.projects.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Code className="w-5 h-5 text-green-600" />
                Dự án cá nhân
              </h3>
              {experience.projects.map((project, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-lg">
                          {project.name}
                        </h4>
                        {project.url && (
                          <a
                            href={project.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                      {project.role && (
                        <p className="text-gray-600 mb-1">
                          Vai trò: {project.role}
                        </p>
                      )}
                      <div className="flex gap-4 text-sm text-gray-500 mb-2">
                        {project.startDate && (
                          <span>
                            {new Date(project.startDate).toLocaleDateString(
                              "vi-VN"
                            )}
                          </span>
                        )}
                        {project.endDate && (
                          <span>
                            -{" "}
                            {new Date(project.endDate).toLocaleDateString(
                              "vi-VN"
                            )}
                          </span>
                        )}
                      </div>
                      {project.description && (
                        <p className="text-gray-700 mb-2">
                          {project.description}
                        </p>
                      )}
                      {project.technologies &&
                        project.technologies.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {project.technologies.map((tech, techIndex) => (
                              <Badge
                                key={techIndex}
                                variant="outline"
                                className="text-xs"
                              >
                                {tech}
                              </Badge>
                            ))}
                          </div>
                        )}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(project)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(project._id!)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {(!experience?.internships || experience.internships.length === 0) &&
            (!experience?.projects || experience.projects.length === 0) && (
              <div className="text-center py-8 text-gray-500">
                <Briefcase className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Chưa có thông tin kinh nghiệm</p>
                <p className="text-sm">
                  Thêm kinh nghiệm làm việc và dự án để hoàn thiện hồ sơ
                </p>
              </div>
            )}
        </div>
      </CardContent>
    </Card>
  );
}
