"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Mail, User, Phone, MapPin, Loader } from "lucide-react";
import Link from "next/link";

type UserProfile = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  profilePictureUrl?: string;
  role: "customer" | "retailer" | "wholesaler";
  createdAt: string;
};

const API_BASE_URL = "http://localhost:8000";

export default function ProfilePage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
  });
  
  // Upload state
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  // Edit mode
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setSaving] = useState(false);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/me`, {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      const data = await res.json();
      console.log("User profile:", data);

      if (res.ok) {
        setUser(data.user);
        setFormData({
          firstName: data.user.firstName || "",
          lastName: data.user.lastName || "",
          phone: data.user.phone || "",
        });
        if (data.user.profilePictureUrl) {
          setPreviewUrl(data.user.profilePictureUrl);
        }
      } else {
        setError(data.message || "Failed to load profile");
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
      setError("Error loading profile");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setError("Please select a valid image file");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size must be less than 5MB");
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadImage = async () => {
    if (!imageFile) {
      setError("No image selected");
      return;
    }

    setUploadingImage(true);
    setError(null);
    try {
      // Generate filename with extension
      const fileExtension = imageFile.name.split('.').pop() || 'jpg';
      const fileName = `profile-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`;
      const fileType = imageFile.type; // e.g., "image/jpeg", "image/png"

      console.log("Requesting upload URL with:", { fileName, fileType });

      // Get upload URL from backend with query parameters
      const urlParams = new URLSearchParams({
        fileName: fileName,
        fileType: fileType,
      });

      const urlRes = await fetch(
        `${API_BASE_URL}/me/upload-url?${urlParams.toString()}`,
        {
          method: "GET",
          credentials: "include",
          headers: {
            Accept: "application/json",
          },
        }
      );

      console.log("Upload URL response status:", urlRes.status);
      const urlData = await urlRes.json();
      console.log("Upload URL response:", urlData);

      if (!urlRes.ok) {
        throw new Error(urlData.message || urlData.error || `Failed to get upload URL: ${urlRes.status}`);
      }

      // Upload to the provided URL (likely S3 or similar)
      const uploadUrl = urlData.uploadUrl || urlData.url;
      if (!uploadUrl) {
        throw new Error("No upload URL provided by server");
      }

      console.log("🔗 Presigned URL:", uploadUrl);
      console.log("📤 Starting S3 upload...");

      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": fileType,
        },
        body: imageFile,
      });

      console.log("Upload response status:", uploadRes.status);
      console.log("Upload response headers:", {
        contentType: uploadRes.headers.get("content-type"),
        etag: uploadRes.headers.get("etag"),
      });

      if (!uploadRes.ok) {
        const uploadError = await uploadRes.text();
        console.error("❌ S3 Upload Error Response:", uploadError);
        
        // Check if it's an XML error from S3
        if (uploadError.includes("<?xml")) {
          const errorMatch = uploadError.match(/<Message>(.*?)<\/Message>/);
          const s3ErrorMsg = errorMatch ? errorMatch[1] : "S3 Upload Error";
          throw new Error(`S3 Error: ${s3ErrorMsg}`);
        }
        
        throw new Error(`Failed to upload image to S3: ${uploadRes.status} ${uploadRes.statusText}`);
      }

      console.log("✅ S3 Upload successful!");

      // Get the final image URL from response
      const imageUrl = urlData.finalUrl || uploadUrl.split("?")[0];
      
      console.log("📸 Final image URL:", imageUrl);

      // Update user profile with new image URL
      const updateRes = await fetch(`${API_BASE_URL}/me`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          profilePictureUrl: imageUrl,
        }),
      });

      const updateData = await updateRes.json();
      console.log("Profile update response:", updateData);

      if (updateRes.ok) {
        setUser(updateData.user);
        setSuccess("Profile picture updated successfully!");
        setImageFile(null);
        setPreviewUrl(imageUrl); // Update preview with final URL
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(updateData.message || "Failed to update profile picture");
      }
    } catch (err: any) {
      console.error("❌ Error uploading image:", err);
      setError(err.message || "Error uploading image");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/me`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      console.log("Update response:", data);

      if (res.ok) {
        setUser(data.user);
        setIsEditing(false);
        setSuccess("Profile updated successfully!");
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.message || "Failed to update profile");
      }
    } catch (err: any) {
      console.error("Error updating profile:", err);
      setError("Error updating profile");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        phone: user.phone || "",
      });
    }
    setIsEditing(false);
    setImageFile(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFE4C4] flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin mx-auto mb-4 text-gray-600" />
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#FFE4C4] flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Failed to load profile</p>
          <Link href="/home">
            <Button className="bg-[#febd69] hover:bg-[#f5a623] text-black">
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFE4C4]">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-600 mt-2">Manage your personal information</p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="bg-green-100 text-green-700 p-4 rounded mb-6">
            {success}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 text-red-700 p-4 rounded mb-6 flex justify-between items-center">
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="text-red-700 hover:text-red-900 font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* Profile Card */}
        <div className="bg-white rounded-lg shadow-md p-8 space-y-8">
          {/* Profile Picture Section */}
          <div className="flex flex-col items-center">
            <div className="relative">
              <img
                src={previewUrl || "/avatar-placeholder.png"}
                alt="Profile"
                className="w-32 h-32 rounded-full object-cover border-4 border-gray-200"
              />
              {isEditing && (
                <label className="absolute bottom-0 right-0 bg-[#febd69] hover:bg-[#f5a623] text-black p-2 rounded-full cursor-pointer shadow-lg">
                  <Camera className="w-5 h-5" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {isEditing && imageFile && (
              <Button
                onClick={handleUploadImage}
                disabled={uploadingImage}
                className="mt-4 bg-[#febd69] hover:bg-[#f5a623] text-black"
              >
                {uploadingImage ? "Uploading..." : "Upload Photo"}
              </Button>
            )}
          </div>

          {/* Personal Information */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Personal Information</h2>

            {/* Role Badge */}
            <div>
              <label className="text-sm font-medium text-gray-600">Account Type</label>
              <div className="mt-2 inline-block">
                <span className="px-4 py-2 rounded-full text-sm font-semibold bg-blue-100 text-blue-800 capitalize">
                  {user.role}
                </span>
              </div>
            </div>

            {/* First Name */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                <User className="w-4 h-4 inline mr-2" />
                First Name
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#febd69] disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                <User className="w-4 h-4 inline mr-2" />
                Last Name
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#febd69] disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>

            {/* Email (Read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                <Mail className="w-4 h-4 inline mr-2" />
                Email
              </label>
              <input
                type="email"
                value={user.email}
                disabled
                className="w-full px-4 py-2 border rounded-lg bg-gray-100 cursor-not-allowed text-gray-600"
              />
              <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                <Phone className="w-4 h-4 inline mr-2" />
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                disabled={!isEditing}
                placeholder="Enter your phone number"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#febd69] disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>

            {/* Member Since */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                <MapPin className="w-4 h-4 inline mr-2" />
                Member Since
              </label>
              <input
                type="text"
                value={new Date(user.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
                disabled
                className="w-full px-4 py-2 border rounded-lg bg-gray-100 cursor-not-allowed text-gray-600"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-6 border-t">
            {!isEditing ? (
              <Button
                onClick={() => setIsEditing(true)}
                className="flex-1 bg-[#febd69] hover:bg-[#f5a623] text-black font-bold"
              >
                Edit Profile
              </Button>
            ) : (
              <>
                <Button
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold"
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
                <Button
                  onClick={handleCancel}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Back Link */}
        <Link href="/home" className="mt-6 inline-block">
          <Button variant="outline">Back to Home</Button>
        </Link>
      </div>
    </div>
  );
}
