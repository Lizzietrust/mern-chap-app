import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../../contexts/appcontext/index";
import { useNotifications } from "../../contexts";
import { useRegister } from "../useAuthLogic";
import { validateRegisterForm } from "../../utils/validation/authSchemas";
import { transformUserData } from "../../utils/transformers/userTransformer";

export interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export const useRegisterForm = () => {
  const [formData, setFormData] = useState<RegisterFormData>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { login } = useApp();
  const { success, error } = useNotifications();
  const navigate = useNavigate();
  const registerMutation = useRegister();

  const validateForm = useCallback((): boolean => {
    const validation = validateRegisterForm(formData);
    setErrors(validation.errors);
    return validation.isValid;
  }, [formData]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!validateForm()) {
        return;
      }

      registerMutation.mutate(
        {
          email: formData.email.trim(),
          password: formData.password,
        },
        {
          onSuccess: (response) => {
            const userData = transformUserData(response.user);

            login(userData);
            success("Account created successfully!", "Welcome");
            navigate("/profile", { replace: true });
          },
          onError: (err: Error) => {
            const errorMessage = getErrorMessage(err);
            error(errorMessage);
          },
        }
      );
    },
    [formData, validateForm, registerMutation, login, success, error, navigate]
  );

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  }, []);

  const resetForm = useCallback(() => {
    setFormData({
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    });
    setErrors({});
  }, []);

  return {
    formData,
    errors,
    isLoading: registerMutation.isPending,
    handleChange,
    handleSubmit,
    resetForm,
    validateForm,
  };
};

const getErrorMessage = (err: Error): string => {
  const message = err.message?.toLowerCase() || "";

  if (message.includes("user with this email already exists")) {
    return "An account with this email already exists. Please try logging in instead.";
  }

  if (message.includes("server configuration error")) {
    return "Server is not properly configured. Please try again later.";
  }

  return "Registration failed. Please try again.";
};
