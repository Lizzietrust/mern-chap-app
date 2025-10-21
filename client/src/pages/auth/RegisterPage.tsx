import React from "react";
import { Link } from "react-router-dom";
import { useTheme } from "../../contexts/theme";
import { RegisterForm } from "../../components/auth/RegisterForm";

export const RegisterPage: React.FC = () => {
  const { isDark } = useTheme();

  return (
    <div
      className={`min-h-screen flex items-center justify-center px-3 md:px-0 ${
        isDark ? "bg-gray-900" : "bg-gray-50"
      }`}
    >
      <div
        className={`max-w-md w-full space-y-8 p-8 ${
          isDark ? "bg-gray-800" : "bg-white"
        } rounded-lg shadow-md`}
      >
        <Header />
        <RegisterForm />
      </div>
    </div>
  );
};

const Header: React.FC = () => {
  const { isDark } = useTheme();

  return (
    <div>
      <h2
        className={`text-center text-3xl font-extrabold ${
          isDark ? "text-white" : "text-gray-900"
        }`}
      >
        Create your account
      </h2>
      <p
        className={`mt-2 text-center text-sm ${
          isDark ? "text-gray-300" : "text-gray-600"
        }`}
      >
        Or{" "}
        <Link
          to="/login"
          className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
        >
          sign in to your existing account
        </Link>
      </p>
    </div>
  );
};

export default RegisterPage;
