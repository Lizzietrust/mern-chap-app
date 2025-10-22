import React from "react";

interface InputFieldProps {
  label: string;
  type: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  autoComplete?: string;
  error?: string;
  disabled?: boolean;
  isDark?: boolean;
  showPasswordToggle?: boolean;
  onTogglePasswordVisibility?: () => void;
  isPasswordVisible?: boolean;
}

export const InputField: React.FC<InputFieldProps> = ({
  label,
  type,
  name,
  value,
  onChange,
  placeholder,
  required = false,
  autoComplete,
  error,
  disabled = false,
  isDark = false,
  showPasswordToggle = false,
  onTogglePasswordVisibility,
  isPasswordVisible = false,
}) => {
  const inputType = showPasswordToggle && isPasswordVisible ? "text" : type;

  return (
    <div>
      <label
        htmlFor={name}
        className={`block text-sm font-medium ${
          isDark ? "text-gray-300" : "text-gray-700"
        }`}
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="mt-1 relative">
        <input
          id={name}
          name={name}
          type={inputType}
          autoComplete={autoComplete}
          required={required}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={`block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 transition-colors ${
            error
              ? "border-red-500 focus:ring-red-500 focus:border-red-500"
              : "border-gray-300 dark:border-gray-600"
          } ${
            isDark
              ? "bg-gray-700 text-white disabled:bg-gray-600"
              : "bg-white text-gray-900 disabled:bg-gray-100"
          } ${showPasswordToggle ? "pr-10" : ""}`}
          placeholder={placeholder}
        />
        {showPasswordToggle && (
          <button
            type="button"
            className={`absolute inset-y-0 right-0 pr-3 flex items-center ${
              isDark
                ? "text-gray-400 hover:text-gray-300"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={onTogglePasswordVisibility}
            disabled={disabled}
          >
            {isPasswordVisible ? (
              // Eye slash icon (visible -> hidden)
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L9 9m9 9l-3-3m-3-3l3 3m0 0l3 3M15 15l-3-3"
                />
              </svg>
            ) : (
              // Eye icon (hidden -> visible)
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            )}
          </button>
        )}
      </div>
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
};
