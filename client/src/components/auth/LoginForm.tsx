import React from "react";
import { useTheme } from "../../contexts/theme";
import { InputField } from "../ui/form/InputField";
import { SubmitButton } from "../ui/form/SubmitButton";
import { useLoginForm } from "../../hooks/auth/useLoginForm";

export const LoginForm: React.FC = () => {
  const { isDark } = useTheme();
  const { formData, errors, isLoading, handleChange, handleSubmit } =
    useLoginForm();

  const [isPasswordVisible, setIsPasswordVisible] = React.useState(false);

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  return (
    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
      <div className="space-y-4">
        <InputField
          label="Email address"
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="Enter your email"
          required
          autoComplete="email"
          error={errors.email}
          isDark={isDark}
          disabled={isLoading}
        />

        <InputField
          label="Password"
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="Enter your password"
          required
          autoComplete="current-password"
          error={errors.password}
          isDark={isDark}
          showPasswordToggle={true}
          isPasswordVisible={isPasswordVisible}
          onTogglePasswordVisibility={togglePasswordVisibility}
          disabled={isLoading}
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <input
            id="remember-me"
            name="remember-me"
            type="checkbox"
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          />
          <label
            htmlFor="remember-me"
            className={`ml-2 block text-sm ${
              isDark ? "text-gray-300" : "text-gray-900"
            } ${isLoading ? "opacity-50" : ""}`}
          >
            Remember me
          </label>
        </div>
      </div>

      <SubmitButton isLoading={isLoading} disabled={isLoading}>
        {isLoading ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
            Signing in
          </div>
        ) : (
          "Sign in"
        )}
      </SubmitButton>
    </form>
  );
};
