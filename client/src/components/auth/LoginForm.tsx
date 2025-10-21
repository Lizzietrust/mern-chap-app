import React from "react";
import { useTheme } from "../../contexts/theme";
import { InputField } from "../ui/form/InputField";
import { SubmitButton } from "../ui/form/SubmitButton";
import { useLoginForm } from "../../hooks/auth/useLoginForm";

export const LoginForm: React.FC = () => {
  const { isDark } = useTheme();
  const { formData, errors, isLoading, handleChange, handleSubmit } =
    useLoginForm();

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
        />
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
      </div>

      <SubmitButton isLoading={isLoading} loadingText="Signing in...">
        Sign in
      </SubmitButton>
    </form>
  );
};
