import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { User, Mail, KeyRound, Save, Eye, EyeOff, Loader2, Palette, Zap, Calculator, Moon, Sun, Shield, Calendar, Cake } from "lucide-react";
import api from "@/lib/axiosInstance";
import { Button } from "@/components/ui/button.jsx";
import { Input } from "@/components/ui/input.jsx";
import { Label } from "@/components/ui/label.jsx";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card.jsx";
import { Badge } from "@/components/ui/badge.jsx";
import { Switch } from "@/components/ui/switch.jsx";
import { PageHeader } from "@/components/ui/breadcrumb.jsx";
import { useTheme } from "@/context/ThemeContext.jsx";

export default function Profile() {
  const currentUser = useSelector((state) => state.auth.user);
  const { theme, toggleTheme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    date_of_birth: "",
    password: "",
    confirmPassword: "",
  });
  const [userData, setUserData] = useState(null);

  // User Preferences State
  const [preferences, setPreferences] = useState({
    showQuickTools: true,
    showCalculator: true,
  });

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
          date_of_birth: response.data.date_of_birth || "",
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

  // Load preferences from localStorage
  useEffect(() => {
    const savedShowQuickTools = localStorage.getItem("showQuickTools") !== "false";
    const savedShowCalculator = localStorage.getItem("showCalculator") !== "false";

    setPreferences({
      showQuickTools: savedShowQuickTools,
      showCalculator: savedShowCalculator,
    });
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleThemeToggle = () => {
    toggleTheme();
    toast.success(`Theme changed to ${theme === "light" ? "dark" : "light"} mode`);
  };

  const handlePreferenceChange = (key, value) => {
    setPreferences((prev) => ({ ...prev, [key]: value }));
    localStorage.setItem(key, value.toString());
    toast.success("Preference updated successfully");
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

      // Include date_of_birth if provided
      if (form.date_of_birth) {
        payload.date_of_birth = form.date_of_birth;
      }

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
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto" />
          <p className="text-gray-600 dark:text-gray-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50 dark:from-gray-900 dark:via-blue-950/20 dark:to-gray-900 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <PageHeader
          title="Profile Settings"
          description="Manage your account and preferences"
          breadcrumbItems={[
            { label: "Settings", href: "settings" },
            { label: "Profile" }
          ]}
          actions={
            <Badge variant="outline" className="text-sm capitalize">
              <Shield className="w-3 h-3 mr-1" />
              {userData?.role || "User"}
            </Badge>
          }
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Profile Card */}
          <div className="lg:col-span-1 space-y-6">
            {/* Profile Overview */}
            <Card className="border-blue-200 dark:border-blue-800">
              <CardContent className="p-6">
                <div className="text-center space-y-4">
                  {/* Avatar */}
                  <div className="relative inline-block">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                      <User className="w-12 h-12 text-white" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 border-4 border-white dark:border-gray-800 rounded-full"></div>
                  </div>

                  {/* Name & Username */}
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                      {userData?.name || "User"}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      @{userData?.username || "-"}
                    </p>
                  </div>

                  {/* Info Grid */}
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        Email
                      </span>
                      <span className="font-medium text-gray-900 dark:text-gray-100 truncate ml-2">
                        {userData?.email || "-"}
                      </span>
                    </div>
                    {userData?.date_of_birth && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
                          <Cake className="w-4 h-4" />
                          Birthday
                        </span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {new Date(userData.date_of_birth).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    )}
                    {userData?.created_at && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          Joined
                        </span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {new Date(userData.created_at).toLocaleDateString("en-US", {
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Preferences Card */}
            <Card className="border-blue-200 dark:border-blue-800">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Palette className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  Preferences
                </CardTitle>
                <CardDescription>Customize your experience</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Theme Toggle */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <div className="flex items-center gap-3">
                    {theme === "dark" ? (
                      <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                        <Moon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                    ) : (
                      <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                        <Sun className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {theme === "dark" ? "Dark Mode" : "Light Mode"}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Theme preference
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={theme === "dark"}
                    onCheckedChange={handleThemeToggle}
                  />
                </div>

                {/* Quick Tools */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                      <Zap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        Quick Tools
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Show in header
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={preferences.showQuickTools}
                    onCheckedChange={(checked) =>
                      handlePreferenceChange("showQuickTools", checked)
                    }
                  />
                </div>

                {/* Calculator */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                      <Calculator className="w-4 h-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        Calculator
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Floating widget
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={preferences.showCalculator}
                    onCheckedChange={(checked) =>
                      handlePreferenceChange("showCalculator", checked)
                    }
                  />
                </div>

                <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                    💡 Changes are saved automatically
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Edit Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="border-b border-gray-200 dark:border-gray-700">
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  Account Information
                </CardTitle>
                <CardDescription>
                  Update your personal details and security settings
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Personal Information Section */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wide">
                      Personal Information
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Name */}
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-sm font-medium">
                          Full Name *
                        </Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <Input
                            id="name"
                            type="text"
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            required
                            placeholder="Enter your full name"
                            className="pl-10"
                          />
                        </div>
                      </div>

                      {/* Email */}
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-medium">
                          Email Address *
                        </Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <Input
                            id="email"
                            type="email"
                            name="email"
                            value={form.email}
                            onChange={handleChange}
                            required
                            placeholder="Enter your email"
                            className="pl-10"
                          />
                        </div>
                      </div>

                      {/* Date of Birth */}
                      <div className="space-y-2">
                        <Label htmlFor="date_of_birth" className="text-sm font-medium">
                          Date of Birth
                        </Label>
                        <div className="relative">
                          <Cake className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <Input
                            id="date_of_birth"
                            type="date"
                            name="date_of_birth"
                            value={form.date_of_birth}
                            onChange={handleChange}
                            placeholder="Select your birthday"
                            className="pl-10"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Security Section */}
                  <div className="pt-6 border-t border-gray-200 dark:border-gray-700 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wide">
                        Security Settings
                      </h3>
                      <Badge variant="outline" className="text-xs">
                        <KeyRound className="w-3 h-3 mr-1" />
                        Optional
                      </Badge>
                    </div>

                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Leave password fields blank if you don't want to change your password
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* New Password */}
                      <div className="space-y-2">
                        <Label htmlFor="password" className="text-sm font-medium">
                          New Password
                        </Label>
                        <div className="relative">
                          <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            name="password"
                            value={form.password}
                            onChange={handleChange}
                            placeholder="Enter new password"
                            className="pl-10 pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
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
                          <Label htmlFor="confirmPassword" className="text-sm font-medium">
                            Confirm Password
                          </Label>
                          <div className="relative">
                            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                              id="confirmPassword"
                              type={showConfirmPassword ? "text" : "password"}
                              name="confirmPassword"
                              value={form.confirmPassword}
                              onChange={handleChange}
                              placeholder="Confirm new password"
                              className="pl-10 pr-10"
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
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
                  </div>

                  {/* Submit Button */}
                  <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <Button
                      type="submit"
                      disabled={loading}
                      className="min-w-[140px] bg-blue-600 hover:bg-blue-700 text-white"
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
    </div>
  );
}
