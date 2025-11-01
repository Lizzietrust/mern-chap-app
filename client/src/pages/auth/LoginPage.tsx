import React from "react";
import { Link } from "react-router-dom";
import { useTheme } from "../../contexts/theme";
import { LoginForm } from "../../components/auth/LoginForm";
import { ThemeToggle } from "../../components/ui/ThemeToggle";

export const LoginPage: React.FC = () => {
  const { isDark } = useTheme();

  return (
    <>
      {/* Theme Selector at top right */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div
        className={`min-h-screen flex items-center justify-center px-3 md:px-0 ${
          isDark ? "bg-gray-900" : "bg-gray-50"
        }`}
      >
        <div
          className={`max-w-md w-full space-y-8 p-8 relative ${
            isDark ? "bg-gray-800" : "bg-white"
          } rounded-lg shadow-md`}
        >
          <Header />
          <LoginForm />
        </div>
      </div>
    </>
  );
};

const Header: React.FC = () => {
  const { isDark } = useTheme();

  return (
    <div className="text-center">
      <h2
        className={`text-3xl font-extrabold ${
          isDark ? "text-white" : "text-gray-900"
        }`}
      >
        Sign in to your account
      </h2>
      <p
        className={`mt-2 text-sm ${isDark ? "text-gray-300" : "text-gray-600"}`}
      >
        Or{" "}
        <Link
          to="/register"
          className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
        >
          create a new account
        </Link>
      </p>
    </div>
  );
};

export default LoginPage;
