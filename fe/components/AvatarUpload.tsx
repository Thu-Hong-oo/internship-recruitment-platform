"use client";

import React, { useState, useRef } from "react";
import { Camera, Upload, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { getUserAvatar } from "@/lib/api";

interface AvatarUploadProps {
  currentAvatar?: string;
  userName: string;
  onAvatarChange?: (avatarUrl: string) => void;
  className?: string;
}

export default function AvatarUpload({ 
  currentAvatar, 
  userName, 
  onAvatarChange,
  className = "" 
}: AvatarUploadProps) {
  const { user } = useAuth();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadAvatar } = useAuth();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Vui lòng chọn file hình ảnh');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File quá lớn. Vui lòng chọn file nhỏ hơn 5MB');
      return;
    }

    setError(null);
    
    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleUpload = async () => {
    if (!fileInputRef.current?.files?.[0]) return;

    setIsUploading(true);
    setError(null);

    try {
      const response = await uploadAvatar(fileInputRef.current.files[0]);
      
      if (response.success && response.user) {
        // Clear preview
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
          setPreviewUrl(null);
        }
        
        // Call callback if provided
        if (response.user.profile?.avatar) {
          onAvatarChange?.(response.user.profile.avatar);
        }
        
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        setError(response.error || 'Upload thất bại');
      }
    } catch (err) {
      setError('Có lỗi xảy ra khi upload avatar');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setError(null);
  };

  const getInitials = () => {
    const names = userName.split(' ');
    return names.map(name => name[0]).join('').toUpperCase();
  };

  return (
    <div className={`flex flex-col items-center space-y-4 ${className}`}>
      {/* Avatar Display */}
      <div className="relative">
        <Avatar className="w-24 h-24">
          <AvatarImage
            src={previewUrl || currentAvatar || getUserAvatar(user) || "/placeholder-user.jpg"}
            alt="User avatar"
          />
          <AvatarFallback className="text-2xl font-semibold">
            {getInitials()}
          </AvatarFallback>
        </Avatar>
        
        {/* Upload Button Overlay */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="absolute bottom-0 right-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center hover:bg-primary/90 transition-colors duration-200 shadow-lg"
          disabled={isUploading}
        >
          <Camera className="w-4 h-4" />
        </button>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Preview Actions */}
      {previewUrl && (
        <div className="flex space-x-2">
          <Button
            size="sm"
            onClick={handleUpload}
            disabled={isUploading}
            className="bg-green-600 hover:bg-green-700"
          >
            {isUploading ? (
              <>
                <Upload className="w-4 h-4 mr-1 animate-spin" />
                Đang upload...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-1" />
                Lưu
              </>
            )}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleCancel}
            disabled={isUploading}
          >
            <X className="w-4 h-4 mr-1" />
            Hủy
          </Button>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2 text-center">
          {error}
        </div>
      )}

      {/* Upload Instructions */}
      {!previewUrl && (
        <div className="text-xs text-muted-foreground text-center max-w-48">
          Click vào icon camera để thay đổi avatar
        </div>
      )}
    </div>
  );
}
