import React from "react";
import { useTheme } from "../../contexts/theme";
import { InputField } from "../ui/form/InputField";
import { SubmitButton } from "../ui/form/SubmitButton";
import { useRegisterForm } from "../../hooks/auth/useRegisterform";

export const RegisterForm: React.FC = () => {
  const { isDark } = useTheme();
  const { formData, errors, isLoading, handleChange, handleSubmit } =
    useRegisterForm();

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
          placeholder="Create a password"
          required
          autoComplete="new-password"
          error={errors.password}
          isDark={isDark}
        />

        <InputField
          label="Confirm Password"
          type="password"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          placeholder="Confirm your password"
          required
          autoComplete="new-password"
          error={errors.confirmPassword}
          isDark={isDark}
        />
      </div>

      <TermsCheckbox isDark={isDark} />

      <SubmitButton isLoading={isLoading} loadingText="Creating account...">
        Create account
      </SubmitButton>
    </form>
  );
};

const TermsCheckbox: React.FC<{ isDark: boolean }> = ({ isDark }) => (
  <div className="flex items-center">
    <input
      id="agree-terms"
      name="agree-terms"
      type="checkbox"
      required
      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
    />
    <label
      htmlFor="agree-terms"
      className={`ml-2 block text-sm ${
        isDark ? "text-gray-300" : "text-gray-900"
      }`}
    >
      I agree to the{" "}
      <a
        href="#"
        className="text-blue-600 hover:text-blue-500 transition-colors"
      >
        Terms of Service
      </a>{" "}
      and{" "}
      <a
        href="#"
        className="text-blue-600 hover:text-blue-500 transition-colors"
      >
        Privacy Policy
      </a>
    </label>
  </div>
);
