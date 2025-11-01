import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../contexts/appcontext/index";
import { useNotifications } from "../contexts";
import { useTheme } from "../hooks/useTheme";

export function ProfileSetupPage() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
  });

  const { state, dispatch } = useApp();
  const { success, error } = useNotifications();
  const { isDark } = useTheme();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const updatedUser = {
        ...state.user!,
        name: `${formData.firstName} ${formData.lastName}`,
        profileSetup: true,
      };

      dispatch({ type: "SET_USER", payload: updatedUser });
      success("Profile updated successfully!", "Welcome to the app");
      navigate("/profile", { replace: true });
    } catch (err) {
      console.error("Profile setup error:", err);
      error("Failed to update profile. Please try again.");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div
      className={`min-h-screen flex items-center justify-center ${
        isDark ? "bg-gray-900" : "bg-gray-50"
      }`}
    >
      <div
        className={`max-w-md w-full space-y-8 p-8 ${
          isDark ? "bg-gray-800" : "bg-white"
        } rounded-lg shadow-md`}
      >
        <div>
          <h2
            className={`text-center text-3xl font-extrabold ${
              isDark ? "text-white" : "text-gray-900"
            }`}
          >
            Complete Your Profile
          </h2>
          <p
            className={`mt-2 text-center text-sm ${
              isDark ? "text-gray-300" : "text-gray-600"
            }`}
          >
            Please provide your name to complete your profile setup
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="firstName"
                className={`block text-sm font-medium ${
                  isDark ? "text-gray-300" : "text-gray-700"
                }`}
              >
                First Name
              </label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                autoComplete="given-name"
                required
                value={formData.firstName}
                onChange={handleChange}
                className={`mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                  isDark ? "bg-gray-700 text-white" : "bg-white text-gray-900"
                }`}
                placeholder="Enter your first name"
              />
            </div>

            <div>
              <label
                htmlFor="lastName"
                className={`block text-sm font-medium ${
                  isDark ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Last Name
              </label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                autoComplete="family-name"
                required
                value={formData.lastName}
                onChange={handleChange}
                className={`mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                  isDark ? "bg-gray-700 text-white" : "bg-white text-gray-900"
                }`}
                placeholder="Enter your last name"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Complete Setup
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
