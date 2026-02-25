import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, Shield, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Alert, AlertDescription } from './ui/alert';
import { toast } from 'sonner@2.0.3';
import { useAuth } from '../contexts/AuthContext';

interface LoginFormProps {
  language: 'en' | 'hi';
}

export function LoginForm({ language }: LoginFormProps) {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    emailOrMobile: '',
    password: '',
    role: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sessionTimeout, setSessionTimeout] = useState(false);
  const [loginError, setLoginError] = useState<string>('');
  const [focusedField, setFocusedField] = useState<string>('');

  const t = {
    emailMobileLabel: "Email / Mobile Number",
    emailMobilePlaceholder: "Enter email or mobile number",
    passwordLabel: "Password",
    passwordPlaceholder: "Enter your password",
    roleLabel: "Select Role",
    rolePlaceholder: "Choose your role",
    signIn: "Sign In",
    signingIn: "Signing In...",
    sessionExpired: "Your session has expired. Please login again.",
    errors: {
      emailMobileRequired: "Email or mobile number is required",
      emailMobileInvalid: "Invalid email or mobile number",
      passwordRequired: "Password is required",
      passwordLength: "Password must be at least 8 characters",
      roleRequired: "Please select a role",
    },
    failed: "Wrong username or password",
    success: "Login Successful",
  };

  useEffect(() => {
    const timer = setTimeout(() => setSessionTimeout(true), 300000);
    return () => clearTimeout(timer);
  }, []);

  const validateEmailOrMobile = (value: string) => {
    const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const mobile = /^[6-9]\d{9}$/;
    return email.test(value) || mobile.test(value);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.emailOrMobile)
      newErrors.emailOrMobile = t.errors.emailMobileRequired;
    else if (!validateEmailOrMobile(formData.emailOrMobile))
      newErrors.emailOrMobile = t.errors.emailMobileInvalid;

    if (!formData.role) newErrors.role = t.errors.roleRequired;

    if (!formData.password)
      newErrors.password = t.errors.passwordRequired;
    else if (formData.password.length < 8)
      newErrors.password = t.errors.passwordLength;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      await login(formData.emailOrMobile, formData.password, formData.role);
      toast.success(t.success);
      setLoginError('');
    } catch (err: any) {
      // Extract error message from axios error response
      const errorMessage = err.response?.data?.message || err.message;
      // Always show "Wrong username or password" for authentication errors
      if (err.response?.status === 401 || err.response?.status === 403 || errorMessage?.toLowerCase().includes('invalid') || errorMessage?.toLowerCase().includes('credential')) {
        setLoginError(t.failed);
        toast.error(t.failed);
      } else {
        // For other errors, show the actual error message
        const displayError = errorMessage || t.failed;
        setLoginError(displayError);
        toast.error(displayError);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="shadow-2xl border-t-4 border-t-blue-600">
      <CardHeader className="space-y-1 pb-4">
        <CardTitle className="text-center text-blue-900 flex items-center justify-center gap-2">
          <Shield className="w-5 h-5" />
          Secure Access
        </CardTitle>
        <CardDescription className="text-center text-gray-600">
          Enter your credentials to access the portal
        </CardDescription>
      </CardHeader>

      <CardContent>
        {sessionTimeout && (
          <Alert className="mb-4 bg-yellow-50 border-yellow-200">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800 text-sm">
              {t.sessionExpired}
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {loginError && (
            <Alert className="mb-4 bg-red-50 border-red-200">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800 text-sm">
                {loginError}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label>{t.emailMobileLabel}</Label>
            <div className="relative">
              {focusedField !== 'emailOrMobile' && (
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              )}
              <Input
                value={formData.emailOrMobile}
                placeholder={focusedField === 'emailOrMobile' ? '' : t.emailMobilePlaceholder}
                onFocus={() => setFocusedField('emailOrMobile')}
                onBlur={() => setFocusedField('')}
                onChange={(e) => {
                  setFormData({ ...formData, emailOrMobile: e.target.value });
                  setLoginError('');
                }}
                className={`${focusedField === 'emailOrMobile' ? 'pl-3' : 'pl-10'} ${errors.emailOrMobile || loginError ? "border-red-500" : ""}`}
              />
            </div>
            {errors.emailOrMobile && <p className="text-red-500 text-sm">{errors.emailOrMobile}</p>}
          </div>

          <div className="space-y-2">
            <Label>{t.passwordLabel}</Label>
            <div className="relative">
              {focusedField !== 'password' && (
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              )}
              <Input
                type={showPassword ? "text" : "password"}
                placeholder={focusedField === 'password' ? '' : t.passwordPlaceholder}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField('')}
                value={formData.password}
                onChange={(e) => {
                  setFormData({ ...formData, password: e.target.value });
                  setLoginError('');
                }}
                className={`${focusedField === 'password' ? 'pl-3' : 'pl-10'} pr-10 ${errors.password || loginError ? "border-red-500" : ""}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-gray-400"
              >
                {showPassword ? <EyeOff /> : <Eye />}
              </button>
            </div>
            {errors.password && <p className="text-red-500 text-sm">{errors.password}</p>}
          </div>

          <div className="space-y-2">
            <Label>{t.roleLabel}</Label>

            <Select
              value={formData.role}
              onValueChange={(value) => setFormData({ ...formData, role: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder={t.rolePlaceholder} />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="HQ_ORG">HQ Organisation</SelectItem>
                <SelectItem value="HQ_MANAGER">HQ Manager</SelectItem>
                <SelectItem value="HQ_EMPLOYEE">HQ Employee</SelectItem>
                 <SelectItem value="FIELD_ORG">Field Organisation</SelectItem>
                <SelectItem value="FIELD_MANAGER">Field Manager</SelectItem>
                <SelectItem value="FIELD_EMPLOYEE">Field Employee</SelectItem>
              </SelectContent>
            </Select>

            {errors.role && <p className="text-red-500 text-sm">{errors.role}</p>}
          </div>

          <Button type="submit" className="w-full">
            {isLoading ? t.signingIn : t.signIn}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}


