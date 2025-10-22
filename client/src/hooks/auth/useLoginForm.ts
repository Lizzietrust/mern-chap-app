import { useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useApp } from "../../contexts/appcontext/index";
import { useNotifications } from "../../contexts";
import { useLogin } from "../useAuthLogic";

export interface LoginFormData {
  email: string;
  password: string;
}

export interface FormErrors {
  email?: string;
  password?: string;
}

export const useLoginForm = () => {
  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const { login } = useApp();
  const { success, error } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();
  const loginMutation = useLogin();

  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.email.trim()) {
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
  }, [formData.email, formData.password]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!validateForm()) {
        return;
      }

      loginMutation.mutate(
        {
          email: formData.email.trim(),
          password: formData.password,
        },
        {
          onSuccess: (response) => {
            const userData = {
              _id: response.user._id,
              name:
                response.user.firstName && response.user.lastName
                  ? `${response.user.firstName} ${response.user.lastName}`
                  : response.user.name || "",
              email: response.user.email,
              profileSetup: response.user.profileSetup ?? false,
              avatar: response.user.avatar || response.user.image,
              bio: response.user.bio,
              phone: response.user.phone,
              location: response.user.location,
              website: response.user.website,
              image: response.user.image,
              firstName: response.user.firstName,
              lastName: response.user.lastName,
              createdAt: response.user.createdAt || new Date().toISOString(),
              updatedAt: response.user.updatedAt || new Date().toISOString(),
            };

            login(userData);
            success("Successfully logged in!", "Welcome back");

            const redirectPath = !userData.profileSetup
              ? "/profile"
              : location.state?.from?.pathname || "/profile";

            navigate(redirectPath, { replace: true });
          },
          onError: (err) => {
            const errorMessage =
              err instanceof Error
                ? err.message
                : "Login failed. Please check your credentials.";
            error(errorMessage);
          },
        }
      );
    },
    [
      formData,
      validateForm,
      loginMutation,
      login,
      success,
      error,
      navigate,
      location,
    ]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));

      if (errors[name as keyof FormErrors]) {
        setErrors((prev) => ({
          ...prev,
          [name]: undefined,
        }));
      }
    },
    [errors]
  );

  const resetForm = useCallback(() => {
    setFormData({ email: "", password: "" });
    setErrors({});
  }, []);

  return {
    formData,
    errors,
    isLoading: loginMutation.isPending,
    handleChange,
    handleSubmit,
    resetForm,
    validateForm,
  };
};
