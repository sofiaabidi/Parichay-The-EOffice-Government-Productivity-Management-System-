import { useState } from 'react';
import { X, Eye, EyeOff, User, Briefcase, Calendar, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { fieldOrgAPI } from '../../../services/api';

interface AddAccountModalProps {
  onClose: () => void;
}

type AccountType = 'manager' | 'employee';

export function AddAccountModal({ onClose }: AddAccountModalProps) {
  const [activeTab, setActiveTab] = useState<AccountType>('manager');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    joiningMonth: '',
    joiningYear: '',
    qualifications: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validatePhone = (phone: string) => {
    const phoneRegex = /^[6-9]\d{9}$/;
    return phoneRegex.test(phone);
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    // Validation
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!validatePhone(formData.phone)) {
      newErrors.phone = 'Invalid Indian phone number';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    if (!formData.joiningMonth || !formData.joiningYear) {
      newErrors.joining = 'Joining date is required';
    }
    if (!formData.qualifications.trim()) {
      newErrors.qualifications = 'Qualifications are required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Submit to API
    try {
      setSubmitting(true);
      const role = activeTab === 'manager' ? 'FIELD_MANAGER' : 'FIELD_EMPLOYEE';
      const designation = activeTab === 'manager' ? 'Field Manager' : 'Field Employee';
      
      await fieldOrgAPI.createUser({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        role: role as 'FIELD_MANAGER' | 'FIELD_EMPLOYEE',
        department: 'Field Operations',
        designation: designation,
        phone: formData.phone.trim(),
        qualifications: formData.qualifications.trim(),
        joiningMonth: formData.joiningMonth,
        joiningYear: formData.joiningYear,
      });

      toast.success(`${activeTab === 'manager' ? 'Manager' : 'Employee'} account created successfully!`);
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        joiningMonth: '',
        joiningYear: '',
        qualifications: '',
      });
      setErrors({});
      
      onClose();
    } catch (error: any) {
      console.error('Failed to create user:', error);
      const errorMessage = error.response?.data?.message || 'Failed to create account. Please try again.';
      toast.error(errorMessage);
      
      // Set specific field errors if available
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 50 }, (_, i) => currentYear - i);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-t-2xl flex items-center justify-between">
          <h2>Add New Account</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 p-6 pb-0">
          <button
            onClick={() => setActiveTab('manager')}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl transition-all ${
              activeTab === 'manager'
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Briefcase className="w-5 h-5" />
            Manager
          </button>
          <button
            onClick={() => setActiveTab('employee')}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl transition-all ${
              activeTab === 'employee'
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <User className="w-5 h-5" />
            Employee
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Name */}
          <div>
            <label className="block text-sm text-gray-700 mb-2">Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={`w-full px-4 py-3 rounded-xl border ${errors.name ? 'border-red-300' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-indigo-500`}
              placeholder="Enter full name"
            />
            {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name}</p>}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm text-gray-700 mb-2">Email *</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className={`w-full px-4 py-3 rounded-xl border ${errors.email ? 'border-red-300' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-indigo-500`}
              placeholder="email@example.com"
            />
            {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email}</p>}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm text-gray-700 mb-2">Phone Number *</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              className={`w-full px-4 py-3 rounded-xl border ${errors.phone ? 'border-red-300' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-indigo-500`}
              placeholder="10-digit Indian mobile number"
              maxLength={10}
            />
            {errors.phone && <p className="text-sm text-red-600 mt-1">{errors.phone}</p>}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm text-gray-700 mb-2">Password *</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className={`w-full px-4 py-3 rounded-xl border ${errors.password ? 'border-red-300' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                placeholder="Minimum 6 characters"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.password && <p className="text-sm text-red-600 mt-1">{errors.password}</p>}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm text-gray-700 mb-2">Confirm Password *</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                className={`w-full px-4 py-3 rounded-xl border ${errors.confirmPassword ? 'border-red-300' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                placeholder="Re-enter password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.confirmPassword && <p className="text-sm text-red-600 mt-1">{errors.confirmPassword}</p>}
          </div>

          {/* Year of Joining */}
          <div>
            <label className="block text-sm text-gray-700 mb-2">Year of Joining *</label>
            <div className="grid grid-cols-2 gap-3">
              <select
                value={formData.joiningMonth}
                onChange={(e) => handleInputChange('joiningMonth', e.target.value)}
                className={`px-4 py-3 rounded-xl border ${errors.joining ? 'border-red-300' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-indigo-500`}
              >
                <option value="">Select Month</option>
                {months.map((month, index) => (
                  <option key={month} value={index + 1}>{month}</option>
                ))}
              </select>
              <select
                value={formData.joiningYear}
                onChange={(e) => handleInputChange('joiningYear', e.target.value)}
                className={`px-4 py-3 rounded-xl border ${errors.joining ? 'border-red-300' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-indigo-500`}
              >
                <option value="">Select Year</option>
                {years.map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            {errors.joining && <p className="text-sm text-red-600 mt-1">{errors.joining}</p>}
          </div>

          {/* Qualifications */}
          <div>
            <label className="block text-sm text-gray-700 mb-2">Qualifications *</label>
            <textarea
              value={formData.qualifications}
              onChange={(e) => handleInputChange('qualifications', e.target.value)}
              className={`w-full px-4 py-3 rounded-xl border ${errors.qualifications ? 'border-red-300' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none`}
              placeholder="Enter educational qualifications and certifications"
              rows={3}
            />
            {errors.qualifications && <p className="text-sm text-red-600 mt-1">{errors.qualifications}</p>}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Creating Account...
              </>
            ) : (
              <>
                <Check className="w-5 h-5" />
                Create Account
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
