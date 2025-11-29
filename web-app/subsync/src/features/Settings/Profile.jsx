import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { User, Mail, KeyRound, Save, Eye, EyeOff, Loader2 } from "lucide-react";
import api from "@/lib/axiosInstance";
import { Button } from "@/components/ui/button.jsx";
import { Input } from "@/components/ui/input.jsx";
import { Label } from "@/components/ui/label.jsx";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card.jsx";
import { Badge } from "@/components/ui/badge.jsx";

export default function Profile() {
  const currentUser = useSelector((state) => state.auth.user);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!currentUser?.username) return;
      try {
        setFetching(true);
        const response = await api.get(`/users/${currentUser.username}`);
        setUserData(response.data);
        setForm({
          name: response.data.name || "",
          email: response.data.email || "",
          password: "",
          confirmPassword: "",
        });
      } catch (error) {
        toast.error("Failed to load profile data");
        console.error("Error fetching profile:", error);
      } finally {
        setFetching(false);
      }
    };

    fetchProfile();
  }, [currentUser?.username]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    if (!form.name.trim()) {
      toast.error("Name is required");
      return false;
    }
    if (!form.email.trim()) {
      toast.error("Email is required");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      toast.error("Please enter a valid email address");
      return false;
    }
    if (form.password && form.password.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return false;
    }
    if (form.password && form.password !== form.confirmPassword) {
      toast.error("Passwords do not match");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
      };

      // Only include password if it's been entered
      if (form.password) {
        payload.password = form.password;
      }

      await api.put(`/users/${currentUser.username}`, payload);
      toast.success("Profile updated successfully!");

      // Update local state
      setForm((prev) => ({
        ...prev,
        password: "",
        confirmPassword: "",
      }));

      // Refresh user data
      const response = await api.get(`/users/${currentUser.username}`);
      setUserData(response.data);
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Failed to update profile"
      );
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile</h1>
        <p className="text-gray-600">Manage your account information and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Overview Card */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-24 h-24 rounded-full bg-blue-500 flex items-center justify-center mb-4">
                <User className="w-12 h-12 text-white" />
              </div>
              <CardTitle className="text-xl">{userData?.name || "User"}</CardTitle>
              <CardDescription className="mt-2">
                <Badge variant="secondary" className="text-sm">
                  {userData?.role || "No Role"}
                </Badge>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-500">Username</div>
                <div className="text-base font-semibold text-gray-900">
                  {userData?.username || "-"}
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-500">Email</div>
                <div className="text-base text-gray-900">{userData?.email || "-"}</div>
              </div>
              {userData?.created_at && (
                <div className="space-y-2 pt-4 border-t">
                  <div className="text-sm font-medium text-gray-500">Member Since</div>
                  <div className="text-sm text-gray-600">
                    {new Date(userData.created_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Edit Profile Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                Edit Profile
              </CardTitle>
              <CardDescription>
                Update your personal information and change your password
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name Field */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Full Name
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                    placeholder="Enter your full name"
                    className="w-full"
                  />
                </div>

                {/* Email Field */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    placeholder="Enter your email address"
                    className="w-full"
                  />
                </div>

                {/* Password Section */}
                <div className="pt-4 border-t space-y-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <KeyRound className="w-4 h-4" />
                      New Password
                    </Label>
                    <p className="text-sm text-gray-500 mb-2">
                      Leave blank if you don't want to change your password
                    </p>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={form.password}
                        onChange={handleChange}
                        placeholder="Enter new password"
                        className="w-full pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  {form.password && (
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          name="confirmPassword"
                          value={form.confirmPassword}
                          onChange={handleChange}
                          placeholder="Confirm new password"
                          className="w-full pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="min-w-[120px]"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

