"use client";

import React, { useState, useEffect } from "react";
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
import { useLazyProfile } from "@/hooks/useLazyProfile";
import {
  ExperienceEntry,
  ProjectEntry,
  ExperienceFormData,
  ProjectFormData,
} from "@/lib/api";

interface LazyExperienceSectionProps {
  className?: string;
}

export default function LazyExperienceSection({
  className,
}: LazyExperienceSectionProps) {
  const {
    experience,
    loading,
    errors,
    fetchExperience,
    addExperience,
    updateExperience,
    deleteExperience,
  } = useLazyProfile();

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
  } as ExperienceFormData);

  // Lazy load data when component mounts
  useEffect(() => {
    fetchExperience();
  }, [fetchExperience]);

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
    } as ExperienceFormData);
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
      } as ExperienceFormData);
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
    setFormData((prev) => {
      if ("skills" in prev) {
        return {
          ...prev,
          skills: [...(prev.skills || []), ""],
        };
      }
      return prev;
    });
  };

  const updateSkill = (index: number, value: string) => {
    setFormData((prev) => {
      if ("skills" in prev) {
        return {
          ...prev,
          skills:
            prev.skills?.map((item: string, i: number) =>
              i === index ? value : item
            ) || [],
        };
      }
      return prev;
    });
  };

  const removeSkill = (index: number) => {
    setFormData((prev) => {
      if ("skills" in prev) {
        return {
          ...prev,
          skills:
            prev.skills?.filter((_: string, i: number) => i !== index) || [],
        };
      }
      return prev;
    });
  };

  const addTechnology = () => {
    setFormData((prev) => {
      if ("technologies" in prev) {
        return {
          ...prev,
          technologies: [...(prev.technologies || []), ""],
        };
      }
      return prev;
    });
  };

  const updateTechnology = (index: number, value: string) => {
    setFormData((prev) => {
      if ("technologies" in prev) {
        return {
          ...prev,
          technologies:
            prev.technologies?.map((item: string, i: number) =>
              i === index ? value : item
            ) || [],
        };
      }
      return prev;
    });
  };

  const removeTechnology = (index: number) => {
    setFormData((prev) => {
      if ("technologies" in prev) {
        return {
          ...prev,
          technologies:
            prev.technologies?.filter((_: string, i: number) => i !== index) ||
            [],
        };
      }
      return prev;
    });
  };

  const addProject = () => {
    setFormData((prev) => {
      if ("projects" in prev) {
        return {
          ...prev,
          projects: [
            ...(prev.projects || []),
            { name: "", description: "", technologies: [] },
          ],
        };
      }
      return prev;
    });
  };

  const updateProject = (index: number, field: string, value: any) => {
    setFormData((prev) => {
      if ("projects" in prev) {
        return {
          ...prev,
          projects:
            prev.projects?.map((project: any, i: number) =>
              i === index ? { ...project, [field]: value } : project
            ) || [],
        };
      }
      return prev;
    });
  };

  const removeProject = (index: number) => {
    setFormData((prev) => {
      if ("projects" in prev) {
        return {
          ...prev,
          projects:
            prev.projects?.filter((_: any, i: number) => i !== index) || [],
        };
      }
      return prev;
    });
  };

  if (loading.experience) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="animate-pulse">
            Đang tải dữ liệu kinh nghiệm làm việc...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (errors.experience) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-red-500">Lỗi: {errors.experience}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Briefcase className="w-5 h-5" />
          Kinh nghiệm làm việc
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
                Thêm kinh nghiệm làm việc
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-6xl w-[90vw] h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <div
                    className={`w-6 h-6 bg-gradient-to-br ${
                      formType === "experience"
                        ? "from-blue-500 to-blue-600"
                        : "from-green-500 to-green-600"
                    } rounded-lg flex items-center justify-center`}
                  >
                    {formType === "experience" ? (
                      <Briefcase className="w-3 h-3 text-white" />
                    ) : (
                      <Code className="w-3 h-3 text-white" />
                    )}
                  </div>
                  {editingItem
                    ? formType === "experience"
                      ? "Chỉnh sửa kinh nghiệm làm việc"
                      : "Chỉnh sửa dự án cá nhân"
                    : formType === "experience"
                    ? "Thêm kinh nghiệm làm việc mới"
                    : "Thêm dự án cá nhân mới"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Left Column */}
                  <div className="space-y-6">
                    {/* Basic Information */}
                    <div className="space-y-4">
                      <h4 className="font-semibold text-lg text-gray-800 border-b border-gray-200 pb-2">
                        {formType === "experience"
                          ? "Thông tin cơ bản"
                          : "Thông tin dự án cá nhân"}
                      </h4>

                      <div className="grid grid-cols-1 gap-4">
                        {formType === "experience" ? (
                          <>
                            <div>
                              <Label
                                htmlFor="type"
                                className="text-sm font-medium"
                              >
                                Loại kinh nghiệm làm việc *
                              </Label>
                              <Select
                                value={formData.type}
                                onValueChange={(
                                  value:
                                    | "internship"
                                    | "full-time"
                                    | "part-time"
                                    | "contract"
                                ) =>
                                  setFormData((prev) => {
                                    if ("type" in prev) {
                                      return { ...prev, type: value } as
                                        | ExperienceFormData
                                        | ProjectFormData;
                                    }
                                    return prev;
                                  })
                                }
                              >
                                <SelectTrigger className="mt-1">
                                  <SelectValue placeholder="Chọn loại kinh nghiệm làm việc" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="internship">
                                    Thực tập
                                  </SelectItem>
                                  <SelectItem value="full-time">
                                    Toàn thời gian
                                  </SelectItem>
                                  <SelectItem value="part-time">
                                    Bán thời gian
                                  </SelectItem>
                                  <SelectItem value="contract">
                                    Hợp đồng
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label
                                htmlFor="company"
                                className="text-sm font-medium"
                              >
                                Công ty *
                              </Label>
                              <Input
                                id="company"
                                value={
                                  "company" in formData ? formData.company : ""
                                }
                                onChange={(e) =>
                                  setFormData((prev) => {
                                    if ("company" in prev) {
                                      return {
                                        ...prev,
                                        company: e.target.value,
                                      };
                                    }
                                    return prev;
                                  })
                                }
                                placeholder="Nhập tên công ty"
                                className="mt-1"
                                required
                              />
                            </div>
                            <div>
                              <Label
                                htmlFor="position"
                                className="text-sm font-medium"
                              >
                                Vị trí công việc *
                              </Label>
                              <Input
                                id="position"
                                value={
                                  "position" in formData
                                    ? formData.position
                                    : ""
                                }
                                onChange={(e) =>
                                  setFormData((prev) => {
                                    if ("position" in prev) {
                                      return {
                                        ...prev,
                                        position: e.target.value,
                                      };
                                    }
                                    return prev;
                                  })
                                }
                                placeholder="Nhập vị trí công việc"
                                className="mt-1"
                                required
                              />
                            </div>
                          </>
                        ) : (
                          <div>
                            <Label
                              htmlFor="projectName"
                              className="text-sm font-medium"
                            >
                              Tên dự án cá nhân *
                            </Label>
                            <Input
                              id="projectName"
                              value={"name" in formData ? formData.name : ""}
                              onChange={(e) =>
                                setFormData((prev) => {
                                  if ("name" in prev) {
                                    return {
                                      ...prev,
                                      name: e.target.value,
                                    };
                                  }
                                  return prev;
                                })
                              }
                              placeholder="Nhập tên dự án cá nhân"
                              className="mt-1"
                              required
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Timeline - Only for Experience */}
                    {formType === "experience" && (
                      <div className="space-y-4">
                        <h4 className="font-semibold text-lg text-gray-800 border-b border-gray-200 pb-2">
                          Thời gian làm việc
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label
                              htmlFor="startDate"
                              className="text-sm font-medium"
                            >
                              Ngày bắt đầu *
                            </Label>
                            <Input
                              id="startDate"
                              type="date"
                              value={
                                "startDate" in formData
                                  ? formData.startDate || ""
                                  : ""
                              }
                              onChange={(e) =>
                                setFormData((prev) => {
                                  if ("startDate" in prev) {
                                    return {
                                      ...prev,
                                      startDate: e.target.value,
                                    };
                                  }
                                  return prev;
                                })
                              }
                              className="mt-1"
                              required
                            />
                          </div>
                          <div>
                            <Label
                              htmlFor="endDate"
                              className="text-sm font-medium"
                            >
                              Ngày kết thúc
                            </Label>
                            <Input
                              id="endDate"
                              type="date"
                              value={
                                "endDate" in formData
                                  ? formData.endDate || ""
                                  : ""
                              }
                              onChange={(e) =>
                                setFormData((prev) => {
                                  if ("endDate" in prev) {
                                    return {
                                      ...prev,
                                      endDate: e.target.value,
                                    };
                                  }
                                  return prev;
                                })
                              }
                              className="mt-1"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Để trống nếu đang làm việc
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Project Details - Only for Project */}
                    {formType === "project" && (
                      <div className="space-y-4">
                        <h4 className="font-semibold text-lg text-gray-800 border-b border-gray-200 pb-2">
                          Chi tiết dự án cá nhân
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label
                              htmlFor="role"
                              className="text-sm font-medium"
                            >
                              Vai trò của bạn
                            </Label>
                            <Input
                              id="role"
                              value={
                                "role" in formData ? formData.role || "" : ""
                              }
                              onChange={(e) =>
                                setFormData((prev) => {
                                  if ("role" in prev) {
                                    return {
                                      ...prev,
                                      role: e.target.value,
                                    };
                                  }
                                  return prev;
                                })
                              }
                              placeholder="Ví dụ: Frontend Developer, Full-stack Developer"
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label
                              htmlFor="url"
                              className="text-sm font-medium"
                            >
                              URL dự án cá nhân
                            </Label>
                            <Input
                              id="url"
                              type="url"
                              value={
                                "url" in formData ? formData.url || "" : ""
                              }
                              onChange={(e) =>
                                setFormData((prev) => {
                                  if ("url" in prev) {
                                    return {
                                      ...prev,
                                      url: e.target.value,
                                    };
                                  }
                                  return prev;
                                })
                              }
                              placeholder="https://example.com"
                              className="mt-1"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label
                              htmlFor="projectStartDate"
                              className="text-sm font-medium"
                            >
                              Ngày bắt đầu
                            </Label>
                            <Input
                              id="projectStartDate"
                              type="date"
                              value={
                                "startDate" in formData
                                  ? formData.startDate || ""
                                  : ""
                              }
                              onChange={(e) =>
                                setFormData((prev) => {
                                  if ("startDate" in prev) {
                                    return {
                                      ...prev,
                                      startDate: e.target.value,
                                    };
                                  }
                                  return prev;
                                })
                              }
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label
                              htmlFor="projectEndDate"
                              className="text-sm font-medium"
                            >
                              Ngày kết thúc
                            </Label>
                            <Input
                              id="projectEndDate"
                              type="date"
                              value={
                                "endDate" in formData
                                  ? formData.endDate || ""
                                  : ""
                              }
                              onChange={(e) =>
                                setFormData((prev) => {
                                  if ("endDate" in prev) {
                                    return {
                                      ...prev,
                                      endDate: e.target.value,
                                    };
                                  }
                                  return prev;
                                })
                              }
                              className="mt-1"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Để trống nếu dự án cá nhân đang thực hiện
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Skills - Only for Experience */}
                    {formType === "experience" && (
                      <div className="space-y-4">
                        <h4 className="font-semibold text-lg text-gray-800 border-b border-gray-200 pb-2">
                          Kỹ năng sử dụng
                        </h4>
                        <div className="space-y-3">
                          {"skills" in formData &&
                            formData.skills?.map(
                              (skill: string, index: number) => (
                                <div
                                  key={index}
                                  className="flex gap-2 items-center"
                                >
                                  <Input
                                    value={skill}
                                    onChange={(e) =>
                                      updateSkill(index, e.target.value)
                                    }
                                    placeholder="Nhập kỹ năng (ví dụ: JavaScript, React, Node.js)"
                                    className="flex-1"
                                  />
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => removeSkill(index)}
                                    className="px-3 py-2 hover:bg-red-50 hover:border-red-200"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              )
                            )}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={addSkill}
                            className="w-full border-dashed border-2 border-gray-300 hover:border-blue-400 hover:bg-blue-50"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Thêm kỹ năng
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Technologies - Only for Project */}
                    {formType === "project" && (
                      <div className="space-y-4">
                        <h4 className="font-semibold text-lg text-gray-800 border-b border-gray-200 pb-2">
                          Công nghệ sử dụng
                        </h4>
                        <div className="space-y-3">
                          {"technologies" in formData &&
                            formData.technologies?.map(
                              (tech: string, index: number) => (
                                <div
                                  key={index}
                                  className="flex gap-2 items-center"
                                >
                                  <Input
                                    value={tech}
                                    onChange={(e) =>
                                      updateTechnology(index, e.target.value)
                                    }
                                    placeholder="Nhập công nghệ (ví dụ: React, Node.js, MongoDB)"
                                    className="flex-1"
                                  />
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => removeTechnology(index)}
                                    className="px-3 py-2 hover:bg-red-50 hover:border-red-200"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              )
                            )}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={addTechnology}
                            className="w-full border-dashed border-2 border-gray-300 hover:border-green-400 hover:bg-green-50"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Thêm công nghệ
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Projects within Experience - Only for Experience */}
                    {formType === "experience" && (
                      <div className="space-y-4">
                        <h4 className="font-semibold text-lg text-gray-800 border-b border-gray-200 pb-2">
                          Dự án trong quá trình làm việc
                        </h4>
                        <div className="space-y-3">
                          {"projects" in formData &&
                            formData.projects?.map(
                              (project: any, index: number) => (
                                <div
                                  key={index}
                                  className="border border-gray-200 rounded-lg p-4 space-y-3"
                                >
                                  <div className="flex items-center justify-between">
                                    <h5 className="font-medium text-sm text-gray-700">
                                      Dự án {index + 1}
                                    </h5>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() => removeProject(index)}
                                      className="h-6 w-6 p-0 hover:bg-red-50 hover:border-red-200"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </div>
                                  <div className="space-y-3">
                                    <div>
                                      <Label className="text-xs font-medium text-gray-600">
                                        Tên dự án
                                      </Label>
                                      <Input
                                        value={project.name || ""}
                                        onChange={(e) =>
                                          updateProject(
                                            index,
                                            "name",
                                            e.target.value
                                          )
                                        }
                                        placeholder="Nhập tên dự án"
                                        className="mt-1"
                                      />
                                    </div>
                                    <div>
                                      <Label className="text-xs font-medium text-gray-600">
                                        Mô tả dự án
                                      </Label>
                                      <Textarea
                                        value={project.description || ""}
                                        onChange={(e) =>
                                          updateProject(
                                            index,
                                            "description",
                                            e.target.value
                                          )
                                        }
                                        placeholder="Mô tả ngắn gọn về dự án"
                                        rows={2}
                                        className="mt-1"
                                      />
                                    </div>
                                    <div>
                                      <Label className="text-xs font-medium text-gray-600">
                                        Công nghệ sử dụng
                                      </Label>
                                      <Input
                                        value={
                                          project.technologies?.join(", ") || ""
                                        }
                                        onChange={(e) =>
                                          updateProject(
                                            index,
                                            "technologies",
                                            e.target.value
                                              .split(",")
                                              .map((t) => t.trim())
                                              .filter((t) => t)
                                          )
                                        }
                                        placeholder="Ví dụ: Node.js, React, MongoDB"
                                        className="mt-1"
                                      />
                                    </div>
                                  </div>
                                </div>
                              )
                            )}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={addProject}
                            className="w-full border-dashed border-2 border-gray-300 hover:border-blue-400 hover:bg-blue-50"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Thêm dự án
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Column */}
                  <div className="space-y-6">
                    {/* Description */}
                    <div className="space-y-4">
                      <h4 className="font-semibold text-lg text-gray-800 border-b border-gray-200 pb-2">
                        {formType === "experience"
                          ? "Mô tả công việc"
                          : "Mô tả dự án cá nhân"}
                      </h4>
                      <div>
                        <Label
                          htmlFor="description"
                          className="text-sm font-medium"
                        >
                          Mô tả chi tiết
                        </Label>
                        <Textarea
                          id="description"
                          value={formData.description || ""}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              description: e.target.value,
                            }))
                          }
                          placeholder={
                            formType === "experience"
                              ? "Mô tả chi tiết về công việc, trách nhiệm và thành tựu..."
                              : "Mô tả chi tiết về dự án cá nhân, chức năng chính và công nghệ sử dụng..."
                          }
                          rows={12}
                          className="mt-1"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          {formType === "experience"
                            ? "Sử dụng dấu • để tạo danh sách các nhiệm vụ chính"
                            : "Mô tả rõ ràng về mục đích, chức năng và kết quả đạt được"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    className="px-6"
                  >
                    Hủy
                  </Button>
                  <Button
                    type="submit"
                    className={`px-6 ${
                      formType === "experience"
                        ? "bg-blue-600 hover:bg-blue-700"
                        : "bg-green-600 hover:bg-green-700"
                    }`}
                  >
                    {editingItem
                      ? formType === "experience"
                        ? "Cập nhật kinh nghiệm làm việc"
                        : "Cập nhật dự án cá nhân"
                      : formType === "experience"
                      ? "Thêm kinh nghiệm làm việc"
                      : "Thêm dự án cá nhân"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

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
              setIsDialogOpen(true);
            }}
          >
            <Code className="w-4 h-4 mr-2" />
            Thêm dự án cá nhân
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Internships */}
          {experience?.internships && experience.internships.length > 0 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-xl flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <Briefcase className="w-4 h-4 text-white" />
                  </div>
                  Kinh nghiệm làm việc làm việc ({experience.internships.length}
                  )
                </h3>
              </div>

              {/* Timeline Layout */}
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-200 via-blue-300 to-blue-200"></div>

                <div className="space-y-8">
                  {experience.internships.map((internship, index) => {
                    const startDate = internship.startDate
                      ? new Date(internship.startDate)
                      : null;
                    const endDate = internship.endDate
                      ? new Date(internship.endDate)
                      : null;
                    const isCurrent = !endDate;
                    const duration =
                      startDate && endDate
                        ? Math.ceil(
                            (endDate.getTime() - startDate.getTime()) /
                              (1000 * 60 * 60 * 24 * 30)
                          )
                        : startDate
                        ? Math.ceil(
                            (new Date().getTime() - startDate.getTime()) /
                              (1000 * 60 * 60 * 24 * 30)
                          )
                        : null;

                    return (
                      <div
                        key={internship._id || index}
                        className="relative flex items-start group"
                      >
                        {/* Timeline dot */}
                        <div className="relative z-10 flex-shrink-0 w-12 h-12 bg-white border-4 border-blue-500 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200">
                          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        </div>

                        {/* Content card */}
                        <div className="ml-6 flex-1">
                          <div className="group-hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-2xl p-6 hover:border-blue-300 hover:-translate-y-1">
                            {/* Header */}
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h4 className="font-bold text-lg text-gray-900 group-hover:text-blue-700 transition-colors">
                                    {internship.position}
                                  </h4>
                                  <Badge
                                    variant={
                                      isCurrent ? "default" : "secondary"
                                    }
                                    className={`text-xs font-medium ${
                                      isCurrent
                                        ? "bg-green-100 text-green-800 border-green-200"
                                        : "bg-gray-100 text-gray-700 border-gray-200"
                                    }`}
                                  >
                                    {isCurrent ? "Hiện tại" : "Đã kết thúc"}
                                  </Badge>
                                </div>

                                <div className="flex items-center gap-2 mb-3">
                                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                                  <p className="text-gray-700 font-medium">
                                    {internship.company}
                                  </p>
                                </div>

                                {/* Date and duration */}
                                <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                                  <div className="flex items-center gap-2">
                                    <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                                    <span>
                                      {startDate?.toLocaleDateString("vi-VN", {
                                        month: "short",
                                        year: "numeric",
                                      })}
                                    </span>
                                    <span>-</span>
                                    <span>
                                      {endDate?.toLocaleDateString("vi-VN", {
                                        month: "short",
                                        year: "numeric",
                                      }) || "Hiện tại"}
                                    </span>
                                  </div>
                                  {duration && (
                                    <div className="flex items-center gap-1">
                                      <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                                      <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                                        {duration} tháng
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Action buttons */}
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEdit(internship)}
                                  className="h-8 w-8 p-0 hover:bg-blue-100 rounded-lg"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(internship._id!)}
                                  className="h-8 w-8 p-0 hover:bg-red-100 rounded-lg"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </div>

                            {/* Description */}
                            {internship.description && (
                              <div className="mb-4">
                                <div className="prose prose-sm max-w-none">
                                  <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                                    {internship.description}
                                  </p>
                                </div>
                              </div>
                            )}

                            {/* Skills */}
                            {internship.skills &&
                              internship.skills.length > 0 && (
                                <div className="pt-3 border-t border-gray-100">
                                  <div className="flex flex-wrap gap-2">
                                    {internship.skills.map(
                                      (skill, skillIndex) => (
                                        <Badge
                                          key={skillIndex}
                                          variant="outline"
                                          className="text-xs bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 transition-colors"
                                        >
                                          {skill}
                                        </Badge>
                                      )
                                    )}
                                  </div>
                                </div>
                              )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Projects */}
          {experience?.projects && experience.projects.length > 0 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-xl flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                    <Code className="w-4 h-4 text-white" />
                  </div>
                  Dự án cá nhân/học tập ({experience.projects.length})
                </h3>
              </div>

              {/* Grid Layout for Projects */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {experience.projects.map((project, index) => {
                  const startDate = project.startDate
                    ? new Date(project.startDate)
                    : null;
                  const endDate = project.endDate
                    ? new Date(project.endDate)
                    : null;
                  const isOngoing = !endDate;
                  const duration =
                    startDate && endDate
                      ? Math.ceil(
                          (endDate.getTime() - startDate.getTime()) /
                            (1000 * 60 * 60 * 24 * 30)
                        )
                      : startDate
                      ? Math.ceil(
                          (new Date().getTime() - startDate.getTime()) /
                            (1000 * 60 * 60 * 24 * 30)
                        )
                      : null;

                  return (
                    <div key={project._id || index} className="group">
                      <div className="h-full bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-2xl p-6 hover:shadow-xl hover:border-green-300 hover:-translate-y-1 transition-all duration-300">
                        {/* Header */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-bold text-lg text-gray-900 group-hover:text-green-700 transition-colors">
                                {project.name}
                              </h4>
                              {project.url && (
                                <a
                                  href={project.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-green-600 hover:text-green-800 transition-colors"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </a>
                              )}
                            </div>

                            {project.role && (
                              <div className="flex items-center gap-2 mb-3">
                                <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                                <p className="text-gray-700 font-medium">
                                  Vai trò: {project.role}
                                </p>
                              </div>
                            )}

                            {/* Date and duration */}
                            <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                              <div className="flex items-center gap-2">
                                <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                                <span>
                                  {startDate?.toLocaleDateString("vi-VN", {
                                    month: "short",
                                    year: "numeric",
                                  })}
                                </span>
                                <span>-</span>
                                <span>
                                  {endDate?.toLocaleDateString("vi-VN", {
                                    month: "short",
                                    year: "numeric",
                                  }) || "Đang thực hiện"}
                                </span>
                              </div>
                              {duration && (
                                <div className="flex items-center gap-1">
                                  <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                                    {duration} tháng
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Action buttons */}
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(project)}
                              className="h-8 w-8 p-0 hover:bg-green-100 rounded-lg"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(project._id!)}
                              className="h-8 w-8 p-0 hover:bg-red-100 rounded-lg"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>

                        {/* Description */}
                        {project.description && (
                          <div className="mb-4">
                            <div className="prose prose-sm max-w-none">
                              <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                                {project.description}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Technologies */}
                        {project.technologies &&
                          project.technologies.length > 0 && (
                            <div className="pt-3 border-t border-gray-100">
                              <div className="flex flex-wrap gap-2">
                                {project.technologies.map((tech, techIndex) => (
                                  <Badge
                                    key={techIndex}
                                    variant="outline"
                                    className="text-xs bg-green-50 text-green-700 border-green-200 hover:bg-green-100 transition-colors"
                                  >
                                    {tech}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {(!experience?.internships || experience.internships.length === 0) &&
            (!experience?.projects || experience.projects.length === 0) && (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Briefcase className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  Chưa có thông tin kinh nghiệm làm việc
                </h3>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">
                  Thêm kinh nghiệm làm việc làm việc và dự án cá nhân để hoàn
                  thiện hồ sơ của bạn
                </p>
                <div className="flex justify-center gap-3">
                  <Button
                    size="sm"
                    onClick={() => {
                      setEditingItem(null);
                      setFormType("experience");
                      resetForm();
                      setIsDialogOpen(true);
                    }}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Thêm kinh nghiệm làm việc
                  </Button>
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
                      setIsDialogOpen(true);
                    }}
                  >
                    <Code className="w-4 h-4 mr-2" />
                    Thêm dự án cá nhân
                  </Button>
                </div>
              </div>
            )}
        </div>
      </CardContent>
    </Card>
  );
}
