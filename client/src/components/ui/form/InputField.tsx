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
}) => {
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
      <input
        id={name}
        name={name}
        type={type}
        autoComplete={autoComplete}
        required={required}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 transition-colors ${
          error
            ? "border-red-500 focus:ring-red-500 focus:border-red-500"
            : "border-gray-300 dark:border-gray-600"
        } ${
          isDark
            ? "bg-gray-700 text-white disabled:bg-gray-600"
            : "bg-white text-gray-900 disabled:bg-gray-100"
        }`}
        placeholder={placeholder}
      />
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
};
