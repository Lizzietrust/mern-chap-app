import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useApp } from "../../contexts/AppContext";
import { useNotifications } from "../../contexts/NotificationContext";
import { useTheme } from "../../contexts/ThemeContext";
import { useLogin } from "../../hooks/useAuth";

export function LoginPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {}
  );

  const { login } = useApp();
  const { success, error } = useNotifications();
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const loginMutation = useLogin();

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    loginMutation.mutate(
      {
        email: formData.email,
        password: formData.password,
      },
      {
        onSuccess: (response) => {
          console.log("Login successful response:", response);

          // Convert server response to match our app's user format
          const userData = {
            id: parseInt(response.user._id) || 1,
            name:
              response.user.firstName && response.user.lastName
                ? `${response.user.firstName} ${response.user.lastName}`
                : response.user.email.split("@")[0], // Use email prefix as fallback name
            email: response.user.email,
          };

          console.log("Processed user data:", userData);

          login(userData);
          success("Successfully logged in!", "Welcome back");

          // Check if profile setup is needed
          if (!response.user.profileSetup) {
            // Redirect to profile setup page
            navigate("/profile-setup", { replace: true });
          } else {
            // Navigate to the intended destination or profile page
            const from = location.state?.from?.pathname || "/profile";
            navigate(from, { replace: true });
          }
        },
        onError: (err) => {
          console.error("Login error:", err);
          // Handle specific error messages from the server
          const errorMessage =
            err instanceof Error
              ? err.message
              : "Login failed. Please check your credentials.";
          error(errorMessage);
        },
      }
    );
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
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
            Sign in to your account
          </h2>
          <p
            className={`mt-2 text-center text-sm ${
              isDark ? "text-gray-300" : "text-gray-600"
            }`}
          >
            Or{" "}
            <Link
              to="/register"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              create a new account
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className={`block text-sm font-medium ${
                  isDark ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                className={`mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                  isDark ? "bg-gray-700 text-white" : "bg-white text-gray-900"
                }`}
                placeholder="Enter your email"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-500">{errors.email}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className={`block text-sm font-medium ${
                  isDark ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={formData.password}
                onChange={handleChange}
                className={`mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                  isDark ? "bg-gray-700 text-white" : "bg-white text-gray-900"
                }`}
                placeholder="Enter your password"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-500">{errors.password}</p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label
                htmlFor="remember-me"
                className={`ml-2 block text-sm ${
                  isDark ? "text-gray-300" : "text-gray-900"
                }`}
              >
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <a
                href="#"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Forgot your password?
              </a>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loginMutation.isPending ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Signing in...
                </div>
              ) : (
                "Sign in"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
