"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Mail, User, Phone, MapPin, Loader, Save, X } from "lucide-react";
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
      let payload;
       if(formData.phone !== "") {
        payload = {firstName: formData.firstName, lastName: formData.lastName, phone: formData.phone};
      } else {
        payload = {firstName: formData.firstName, lastName: formData.lastName};
      }
      const res = await fetch(`${API_BASE_URL}/me`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader className="w-10 h-10 animate-spin text-[#febd69] mb-4" />
          <p className="text-gray-600 font-medium">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-2xl shadow-sm border border-gray-100">
          <p className="text-gray-600 mb-4">Failed to load profile</p>
          <Link href="/home">
            <Button className="bg-[#febd69] hover:bg-[#f5a623] text-black font-bold rounded-xl">
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">My Profile</h1>
          <p className="text-gray-500 mt-2">Manage your personal information and account settings</p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-8 rounded-r shadow-sm animate-in fade-in slide-in-from-top-2">
            <p className="text-sm text-green-700 font-medium">{success}</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-8 rounded-r shadow-sm flex justify-between items-center animate-in fade-in slide-in-from-top-2">
            <p className="text-sm text-red-700 font-medium">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-red-700 hover:text-red-900"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Profile Card */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Cover / Header Background */}
          <div className="h-32 bg-gradient-to-r from-gray-900 to-gray-800 relative">
            <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
          </div>

          <div className="px-8 pb-8">
            {/* Profile Picture Section */}
            <div className="relative -mt-16 mb-8 flex flex-col items-center">
              <div className="relative group">
                <div className="w-32 h-32 rounded-full p-1 bg-white shadow-lg">
                  <img
                    src={previewUrl || "/avatar-placeholder.png"}
                    alt="Profile"
                    className="w-full h-full rounded-full object-cover bg-gray-100"
                  />
                </div>
                {isEditing && (
                  <label className="absolute bottom-1 right-1 bg-gray-700 hover:bg-gray-600 text-white p-2.5 rounded-full cursor-pointer shadow-lg transition-transform hover:scale-110 active:scale-95">
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
                  className="mt-4 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-xs"
                  size="sm"
                >
                  {uploadingImage ? "Uploading..." : "Save New Photo"}
                </Button>
              )}
              
              <div className="mt-4 text-center">
                <h2 className="text-2xl font-bold text-gray-900">{user.firstName} {user.lastName}</h2>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 capitalize mt-1 border border-blue-100">
                  {user.role}
                </span>
              </div>
            </div>

            {/* Personal Information Form */}
            <div className="space-y-6 max-w-2xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* First Name */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" /> First Name
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-400 focus:border-transparent outline-none transition-all disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>

                {/* Last Name */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" /> Last Name
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-400 focus:border-transparent outline-none transition-all disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>
              </div>

              {/* Email (Read-only) */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400" /> Email Address
                </label>
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed"
                />
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400" /> Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  placeholder="+1 (555) 000-0000"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-400 focus:border-transparent outline-none transition-all disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>

              {/* Member Since */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-400" /> Member Since
                </label>
                <div className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-500 flex items-center">
                  {new Date(user.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-8 mt-8 border-t border-gray-100 flex gap-4">
                {!isEditing ? (
                  <Button
                    onClick={() => setIsEditing(true)}
                    className="w-full bg-gray-900 hover:bg-gray-800 text-white font-bold py-6 rounded-xl shadow-sm hover:shadow-md transition-all"
                  >
                    Edit Profile
                  </Button>
                ) : (
                  <>
                    <Button
                      onClick={handleSaveProfile}
                      disabled={isSaving}
                      className="flex-1 bg-gray-900 hover:bg-gray-800 text-white font-bold py-6 rounded-xl shadow-sm hover:shadow-md transition-all"
                    >
                      {isSaving ? (
                        <span className="flex items-center gap-2">
                          <Loader className="w-4 h-4 animate-spin" /> Saving...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <Save className="w-4 h-4" /> Save Changes
                        </span>
                      )}
                    </Button>
                    <Button
                      onClick={handleCancel}
                      variant="outline"
                      className="flex-1 py-6 rounded-xl border-gray-200 hover:bg-gray-50"
                    >
                      Cancel
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
