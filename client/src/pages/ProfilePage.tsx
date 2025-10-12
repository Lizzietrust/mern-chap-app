import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../contexts/AppContext";
import { useNotifications } from "../contexts/NotificationContext";
import { useTheme } from "../contexts/ThemeContext";
import { Layout } from "../components/Layout";
import { useUpdateProfile } from "../hooks/useAuth";
import { LogoutButton } from "../components/LogoutButton";

export function ProfilePage() {
  const { state, logout, dispatch } = useApp();
  const { success, error } = useNotifications();
  const { isDark, theme, setTheme } = useTheme();
  const navigate = useNavigate();

  const initialData = useMemo(
    () => ({
      name: state.user?.name || "",
      email: state.user?.email || "",
      bio:
        state.user?.bio ||
        "Tell people a bit about yourself. This will appear on your profile.",
      avatar:
        state.user?.avatar ||
        "https://api.dicebear.com/7.x/initials/svg?seed=" +
          encodeURIComponent(state.user?.name || state.user?.email || "User"),
      phone: state.user?.phone || "",
      location: state.user?.location || "",
      website: state.user?.website || "",
    }),
    [state.user]
  );

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(initialData);
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    bio?: string;
    phone?: string;
    location?: string;
    website?: string;
  }>({});
  const updateProfileMutation = useUpdateProfile();

  // Setup state (available when user has not completed profile setup)
  const initialFirst = useMemo(
    () => state.user?.name?.split(" ")?.[0] || "",
    [state.user]
  );
  const initialLast = useMemo(
    () => state.user?.name?.split(" ")?.slice(1).join(" ") || "",
    [state.user]
  );
  const [setupData, setSetupData] = useState({
    firstName: initialFirst,
    lastName: initialLast,
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setFormData((prev) => ({ ...prev, avatar: String(reader.result) }));
    };
    reader.readAsDataURL(file);
  };

  const handleSetupChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSetupData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSetupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullName = `${setupData.firstName} ${setupData.lastName}`.trim();
    if (!setupData.firstName.trim() || !setupData.lastName.trim()) {
      error("Please enter your first and last name");
      return;
    }
    updateProfileMutation.mutate(
      {
        firstName: setupData.firstName.trim(),
        lastName: setupData.lastName.trim(),
        image: formData.avatar,
        bio: formData.bio,
        phone: formData.phone,
        location: formData.location,
        website: formData.website,
      },
      {
        onSuccess: (response) => {
          const updatedUser = {
            ...state.user!,
            name: fullName,
            profileSetup: response.user.profileSetup,
            avatar: response.user.image || formData.avatar,
            bio: response.user.bio,
            phone: response.user.phone,
            location: response.user.location,
            website: response.user.website,
          };
          dispatch({ type: "SET_USER", payload: updatedUser });
          success("Profile setup complete!");
        },
        onError: () => {
          error("Failed to complete setup. Please try again.");
        },
      }
    );
  };

  const validate = () => {
    const nextErrors: {
      name?: string;
      email?: string;
      bio?: string;
      phone?: string;
      location?: string;
      website?: string;
    } = {};
    if (!formData.name.trim()) nextErrors.name = "Name is required";
    if (formData.bio && formData.bio.length > 500)
      nextErrors.bio = "Bio must be less than 500 characters";
    if (formData.website && !isValidUrl(formData.website))
      nextErrors.website = "Please enter a valid URL";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const isValidUrl = (string: string) => {
    try {
      new URL(string);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    // Parse first and last name from the full name
    const nameParts = formData.name.trim().split(" ");
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    updateProfileMutation.mutate(
      {
        firstName,
        lastName,
        image: formData.avatar,
        bio: formData.bio,
        phone: formData.phone,
        location: formData.location,
        website: formData.website,
      },
      {
        onSuccess: (response) => {
          const updatedUser = {
            ...state.user!,
            name: formData.name,
            profileSetup: response.user.profileSetup,
            avatar: response.user.image || formData.avatar,
            bio: response.user.bio,
            phone: response.user.phone,
            location: response.user.location,
            website: response.user.website,
          };
          dispatch({ type: "SET_USER", payload: updatedUser });
          success("Profile updated successfully!");
          setIsEditing(false);
        },
        onError: () => {
          error("Failed to update profile. Please try again.");
        },
      }
    );
  };

  const handleCancel = () => {
    setFormData(initialData);
    setErrors({});
    setIsEditing(false);
  };

  const handleLogout = () => {
    logout();
    success("You have been logged out successfully");
    navigate("/login");
  };

  const handleGoToChat = () => {
    navigate("/chat");
  };

  const hasUnsavedChanges =
    JSON.stringify(formData) !== JSON.stringify(initialData);

  // Guard: unauthenticated (placed after hooks to satisfy React Hooks rules)
  if (!state.user) {
    return (
      <Layout>
        <div
          className={`min-h-screen flex items-center justify-center ${
            isDark ? "bg-gray-900" : "bg-gray-50"
          }`}
        >
          <div className="text-center">
            <h2
              className={`text-2xl font-bold ${
                isDark ? "text-white" : "text-gray-900"
              }`}
            >
              Please log in to view your profile
            </h2>
          </div>
        </div>
      </Layout>
    );
  }

  const needsSetup = !state.user.profileSetup;

  if (needsSetup) {
    const accentOptions: Array<{
      key: "blue" | "emerald" | "violet" | "rose" | "amber";
      label: string;
      className: string;
    }> = [
      { key: "blue", label: "Blue", className: "bg-blue-500" },
      { key: "emerald", label: "Emerald", className: "bg-emerald-500" },
      { key: "violet", label: "Violet", className: "bg-violet-500" },
      { key: "rose", label: "Rose", className: "bg-rose-500" },
      { key: "amber", label: "Amber", className: "bg-amber-500" },
    ];
    return (
      <Layout>
        <div
          className={`min-h-screen ${isDark ? "bg-gray-900" : "bg-gray-50"}`}
        >
          <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div
              className={`${
                isDark ? "bg-gray-800" : "bg-white"
              } rounded-lg shadow-md overflow-hidden`}
            >
              <div
                className={`px-6 py-5 border-b ${
                  isDark ? "border-gray-700" : "border-gray-200"
                }`}
              >
                <h2
                  className={`text-xl font-semibold ${
                    isDark ? "text-white" : "text-gray-900"
                  }`}
                >
                  Complete Your Profile
                </h2>
                <p className={`${isDark ? "text-gray-300" : "text-gray-600"}`}>
                  Tell us your name and choose your color theme.
                </p>
              </div>
              <form
                onSubmit={handleSetupSubmit}
                className="px-6 py-6 space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label
                      className={`block text-sm font-medium ${
                        isDark ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      First Name
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={setupData.firstName}
                      onChange={handleSetupChange}
                      className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-[var(--accent-500)] focus:border-[var(--accent-500)] ${
                        isDark
                          ? "border-gray-600 bg-gray-700 text-white"
                          : "border-gray-300 bg-white text-gray-900"
                      }`}
                      placeholder="Jane"
                    />
                  </div>
                  <div>
                    <label
                      className={`block text-sm font-medium ${
                        isDark ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Last Name
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={setupData.lastName}
                      onChange={handleSetupChange}
                      className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-[var(--accent-500)] focus:border-[var(--accent-500)] ${
                        isDark
                          ? "border-gray-600 bg-gray-700 text-white"
                          : "border-gray-300 bg-white text-gray-900"
                      }`}
                      placeholder="Doe"
                    />
                  </div>
                </div>

                <div>
                  <h3
                    className={`text-sm font-semibold uppercase tracking-wider ${
                      isDark ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Profile Image
                  </h3>
                  <div className="mt-3 flex items-center gap-4">
                    <div className="relative">
                      <img
                        src={formData.avatar}
                        alt="Avatar preview"
                        className="w-16 h-16 rounded-full object-cover border border-gray-200 dark:border-gray-700"
                      />
                    </div>
                    <label className="inline-flex items-center px-3 py-2 rounded-md border bg-blue-600 text-white text-sm cursor-pointer hover:bg-blue-700">
                      Change
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarChange}
                      />
                    </label>
                  </div>
                </div>

                <div>
                  <h3
                    className={`text-sm font-semibold uppercase tracking-wider ${
                      isDark ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Additional Information
                  </h3>
                  <div className="mt-3 space-y-4">
                    <div>
                      <label
                        className={`block text-sm font-medium ${
                          isDark ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Bio
                      </label>
                      <textarea
                        name="bio"
                        rows={3}
                        value={formData.bio}
                        onChange={handleChange}
                        className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-[var(--accent-500)] focus:border-[var(--accent-500)] ${
                          isDark
                            ? "border-gray-600 bg-gray-700 text-white"
                            : "border-gray-300 bg-white text-gray-900"
                        }`}
                        placeholder="Tell people a bit about yourself..."
                      />
                      {errors.bio && (
                        <p className="mt-1 text-sm text-red-500">
                          {errors.bio}
                        </p>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label
                          className={`block text-sm font-medium ${
                            isDark ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          Phone
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-[var(--accent-500)] focus:border-[var(--accent-500)] ${
                            isDark
                              ? "border-gray-600 bg-gray-700 text-white"
                              : "border-gray-300 bg-white text-gray-900"
                          }`}
                          placeholder="+1 (555) 123-4567"
                        />
                      </div>
                      <div>
                        <label
                          className={`block text-sm font-medium ${
                            isDark ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          Location
                        </label>
                        <input
                          type="text"
                          name="location"
                          value={formData.location}
                          onChange={handleChange}
                          className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-[var(--accent-500)] focus:border-[var(--accent-500)] ${
                            isDark
                              ? "border-gray-600 bg-gray-700 text-white"
                              : "border-gray-300 bg-white text-gray-900"
                          }`}
                          placeholder="City, Country"
                        />
                      </div>
                    </div>
                    <div>
                      <label
                        className={`block text-sm font-medium ${
                          isDark ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Website
                      </label>
                      <input
                        type="url"
                        name="website"
                        value={formData.website}
                        onChange={handleChange}
                        className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-[var(--accent-500)] focus:border-[var(--accent-500)] ${
                          isDark
                            ? "border-gray-600 bg-gray-700 text-white"
                            : "border-gray-300 bg-white text-gray-900"
                        }`}
                        placeholder="https://example.com"
                      />
                      {errors.website && (
                        <p className="mt-1 text-sm text-red-500">
                          {errors.website}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3
                      className={`text-sm font-semibold uppercase tracking-wider ${
                        isDark ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Appearance
                    </h3>
                    <div className="mt-3 flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setTheme("light")}
                        className={`px-3 py-2 rounded-md border cursor-pointer ${
                          theme === "light"
                            ? "ring-2 ring-[var(--accent-500)]"
                            : ""
                        } ${
                          isDark
                            ? "border-gray-600 text-gray-200"
                            : "border-gray-300 text-gray-700"
                        }`}
                      >
                        Light
                      </button>
                      <button
                        type="button"
                        onClick={() => setTheme("dark")}
                        className={`px-3 py-2 rounded-md border cursor-pointer ${
                          theme === "dark"
                            ? "ring-2 ring-[var(--accent-500)]"
                            : ""
                        } ${
                          isDark
                            ? "border-gray-600 text-gray-200"
                            : "border-gray-300 text-gray-700"
                        }`}
                      >
                        Dark
                      </button>
                    </div>
                  </div>
                  {/* <div>
                    <h3
                      className={`text-sm font-semibold uppercase tracking-wider ${
                        isDark ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Appearance
                    </h3>
                    <div className="mt-3 flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setTheme("light")}
                        className={`px-3 py-2 rounded-md border cursor-pointer ${
                          theme === "light" ? "ring-2 ring-blue-500" : ""
                        } ${
                          isDark
                            ? "border-gray-600 text-gray-200"
                            : "border-gray-300 text-gray-700"
                        }`}
                      >
                        Light
                      </button>
                      <button
                        type="button"
                        onClick={() => setTheme("dark")}
                        className={`px-3 py-2 rounded-md border cursor-pointer ${
                          theme === "dark" ? "ring-2 ring-blue-500" : ""
                        } ${
                          isDark
                            ? "border-gray-600 text-gray-200"
                            : "border-gray-300 text-gray-700"
                        }`}
                      >
                        Dark
                      </button>
                    </div>
                  </div> */}
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={updateProfileMutation.isPending}
                    className="btn btn-primary w-full cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {updateProfileMutation.isPending ? (
                      <span className="inline-flex items-center">
                        <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>{" "}
                        Saving...
                      </span>
                    ) : (
                      "Save and Continue"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className={`min-h-screen ${isDark ? "bg-gray-900" : "bg-gray-50"}`}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div
            className={`${
              isDark ? "bg-gray-800" : "bg-white"
            } rounded-lg shadow-md overflow-hidden`}
          >
            {/* Header */}
            <div
              className={`px-6 py-5 border-b ${
                isDark ? "border-gray-700" : "border-gray-200"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex items-center gap-4 flex-1">
                  <div className="relative">
                    <div>
                      <img
                        src={formData.avatar}
                        alt="Avatar"
                        className="w-20 h-20 rounded-full object-cover border border-gray-200 dark:border-gray-700"
                      />
                    </div>
                    {isEditing && (
                      <label className="absolute bottom-0 right-0 bg-blue-600 text-white text-xs px-2 py-1 rounded cursor-pointer hover:bg-blue-700">
                        Change
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleAvatarChange}
                        />
                      </label>
                    )}
                  </div>
                  <div>
                    <h2
                      className={`text-2xl font-bold ${
                        isDark ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {formData.name}
                    </h2>
                    <p
                      className={`${
                        isDark ? "text-gray-300" : "text-gray-600"
                      }`}
                    >
                      {state.user?.email}
                    </p>
                    <p
                      className={`mt-1 text-sm ${
                        isDark ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Member since {new Date().toLocaleDateString()}
                    </p>
                    {formData.bio && (
                      <p
                        className={`mt-2 text-sm ${
                          isDark ? "text-gray-300" : "text-gray-600"
                        }`}
                      >
                        {formData.bio}
                      </p>
                    )}
                    <div
                      className={`mt-2 flex flex-wrap gap-3 text-xs ${
                        isDark ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      {formData.phone && (
                        <span className="flex items-center gap-1">
                          <svg
                            className="w-3 h-3"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                          </svg>
                          {formData.phone}
                        </span>
                      )}
                      {formData.location && (
                        <span className="flex items-center gap-1">
                          <svg
                            className="w-3 h-3"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                              clipRule="evenodd"
                            />
                          </svg>
                          {formData.location}
                        </span>
                      )}
                      {formData.website && (
                        <span className="flex items-center gap-1">
                          <svg
                            className="w-3 h-3"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 105.656 5.656l-3-3a4 4 0 00-5.656 0 1 1 0 00-1.414 1.414 6 6 0 108.486 8.486l-3-3a6 6 0 00-8.486 0 1 1 0 00-1.414 1.414 8 8 0 1111.314 11.314l-3-3a8 8 0 00-11.314 0 1 1 0 00-1.414 1.414A10 10 0 1117.07 17.07l-3-3a10 10 0 00-14.14 0 1 1 0 00-1.414 1.414z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <a
                            href={formData.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline"
                          >
                            {formData.website.replace(/^https?:\/\//, "")}
                          </a>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleGoToChat}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                  >
                    Go to Chat
                  </button>
                  <LogoutButton isNav={false} />
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="px-6 py-8">
              <form
                onSubmit={handleSubmit}
                className="grid grid-cols-1 lg:grid-cols-3 gap-8"
              >
                {/* Left column */}
                <div className="space-y-6 lg:col-span-1">
                  <div>
                    <h3
                      className={`text-sm font-semibold uppercase tracking-wider ${
                        isDark ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Profile
                    </h3>
                    <p
                      className={`mt-1 text-sm ${
                        isDark ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Basic information that will be visible to others.
                    </p>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label
                        className={`block text-sm font-medium ${
                          isDark ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Full Name
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                          isEditing
                            ? "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                        }`}
                        placeholder="John Doe"
                      />
                      {errors.name && (
                        <p className="mt-1 text-sm text-red-500">
                          {errors.name}
                        </p>
                      )}
                    </div>
                    <div>
                      <label
                        className={`block text-sm font-medium ${
                          isDark ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Bio
                      </label>
                      <textarea
                        name="bio"
                        rows={4}
                        value={formData.bio}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                          isEditing
                            ? "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                        }`}
                      />
                      {errors.bio && (
                        <p className="mt-1 text-sm text-red-500">
                          {errors.bio}
                        </p>
                      )}
                    </div>
                    <div>
                      <label
                        className={`block text-sm font-medium ${
                          isDark ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Phone
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                          isEditing
                            ? "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                        }`}
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>
                    <div>
                      <label
                        className={`block text-sm font-medium ${
                          isDark ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Location
                      </label>
                      <input
                        type="text"
                        name="location"
                        value={formData.location}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                          isEditing
                            ? "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                        }`}
                        placeholder="City, Country"
                      />
                    </div>
                    <div>
                      <label
                        className={`block text-sm font-medium ${
                          isDark ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Website
                      </label>
                      <input
                        type="url"
                        name="website"
                        value={formData.website}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                          isEditing
                            ? "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                        }`}
                        placeholder="https://example.com"
                      />
                      {errors.website && (
                        <p className="mt-1 text-sm text-red-500">
                          {errors.website}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right column */}
                <div className="space-y-6 lg:col-span-2">
                  <div>
                    <h3
                      className={`text-sm font-semibold uppercase tracking-wider ${
                        isDark ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Account
                    </h3>
                    <p
                      className={`mt-1 text-sm ${
                        isDark ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Email cannot be used by others and is kept private.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label
                        className={`block text-sm font-medium ${
                          isDark ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Email
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        disabled
                        // readOnly
                        className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm ${
                          isDark
                            ? "border-gray-700 bg-gray-800 text-gray-400"
                            : "border-gray-200 bg-gray-50 text-gray-500"
                        }`}
                        placeholder="john@example.com"
                      />
                    </div>
                    <div className="opacity-60">
                      <label
                        className={`block text-sm font-medium ${
                          isDark ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Password
                      </label>
                      <input
                        type="password"
                        disabled
                        value={"••••••••"}
                        className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm ${
                          isDark
                            ? "border-gray-700 bg-gray-800 text-gray-400"
                            : "border-gray-200 bg-gray-50 text-gray-500"
                        }`}
                      />
                      <p
                        className={`mt-1 text-xs ${
                          isDark ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        Password changes are managed in the security settings.
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div
                    className={`flex items-center justify-between pt-4 mt-2 border-t ${
                      isDark ? "border-gray-700" : "border-gray-200"
                    }`}
                  >
                    <div
                      className={`text-sm ${
                        isDark ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      {isEditing
                        ? hasUnsavedChanges
                          ? "You have unsaved changes"
                          : "No changes yet"
                        : "Click Edit to update your info"}
                    </div>
                    <div className="flex gap-3">
                      {!isEditing ? (
                        <button
                          type="button"
                          onClick={() => setIsEditing(true)}
                          className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-800 cursor-pointer"
                        >
                          Edit Profile
                        </button>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={handleCancel}
                            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={
                              updateProfileMutation.isPending ||
                              !hasUnsavedChanges
                            }
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                          >
                            {updateProfileMutation.isPending ? (
                              <span className="inline-flex items-center">
                                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>{" "}
                                Saving...
                              </span>
                            ) : (
                              "Save Changes"
                            )}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
