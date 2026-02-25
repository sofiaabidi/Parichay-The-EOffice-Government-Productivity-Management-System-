import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { UserPlus, Users, Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { hqOrgAPI } from '../../../services/api';

interface AddAccountModalProps {
  open: boolean;
  onClose: () => void;
}

interface FormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  department: string;
  designation: string;
  phone: string;
  joiningMonth: string;
  joiningYear: string;
  qualifications: string;
}

const initialFormData: FormData = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  department: '',
  designation: '',
  phone: '',
  joiningMonth: '',
  joiningYear: '',
  qualifications: ''
};

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 50 }, (_, i) => currentYear - 25 + i);

export function AddAccountModal({ open, onClose }: AddAccountModalProps) {
  const [activeTab, setActiveTab] = useState('employee');
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState<string[]>([]);
  const [loadingDepartments, setLoadingDepartments] = useState(false);

  // Load departments when modal opens
  useEffect(() => {
    if (open) {
      loadDepartments();
    }
  }, [open]);

  const loadDepartments = async () => {
    try {
      setLoadingDepartments(true);
      const response = await hqOrgAPI.getDepartments();
      setDepartments(response.data || []);
    } catch (error: any) {
      console.error('Failed to load departments:', error);
      toast.error('Failed to load departments');
    } finally {
      setLoadingDepartments(false);
    }
  };

  const validatePhone = (phone: string): boolean => {
    // Indian phone number validation: 10 digits, can start with 6-9
    const phoneRegex = /^[6-9]\d{9}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string): boolean => {
    // At least 8 characters, one uppercase, one lowercase, one number, one special character
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.name || !formData.email || !formData.password || 
        !formData.confirmPassword || !formData.department) {
      toast.error('Please fill in all required fields (Name, Email, Password, Department)');
      return;
    }

    // Validate email
    if (!validateEmail(formData.email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    // Validate password strength
    if (!validatePassword(formData.password)) {
      toast.error('Password must be at least 8 characters with uppercase, lowercase, number, and special character');
      return;
    }

    // Validate password match
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    // Validate phone if provided
    if (formData.phone && !validatePhone(formData.phone)) {
      toast.error('Please enter a valid 10-digit Indian phone number starting with 6-9');
      return;
    }

    try {
      setLoading(true);
      const role = activeTab === 'manager' ? 'MANAGER' : 'EMPLOYEE';
      
      await hqOrgAPI.createUser({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: role as 'EMPLOYEE' | 'MANAGER',
        department: formData.department,
        designation: formData.designation || undefined,
      });

      const accountType = activeTab === 'manager' ? 'Manager' : 'Employee';
      toast.success(`${accountType} account created successfully! The user can now log in with their email and password.`);
      
      // Reset form
      setFormData(initialFormData);
      setShowPassword(false);
      setShowConfirmPassword(false);
      onClose();
    } catch (error: any) {
      console.error('Failed to create user:', error);
      const errorMessage = error.response?.data?.message || 'Failed to create user account';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setFormData(initialFormData);
      setShowPassword(false);
      setShowConfirmPassword(false);
    }
  }, [open]);

  const formContent = (
    <form onSubmit={handleSubmit} className="mt-6 space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-gray-700">Full Name *</Label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="John Doe"
            className="rounded-xl border-gray-300"
            required
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="text-gray-700">Email Address *</Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="john.doe@company.com"
            className="rounded-xl border-gray-300"
            required
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="department" className="text-gray-700">Department *</Label>
          <Select 
            value={formData.department && departments.includes(formData.department) ? formData.department : "custom"} 
            onValueChange={(value) => {
              if (value === "custom") {
                setFormData({ ...formData, department: '' });
              } else {
                handleSelectChange('department', value);
              }
            }}
            disabled={loading || loadingDepartments}
          >
            <SelectTrigger className="rounded-xl border-gray-300">
              <SelectValue placeholder={loadingDepartments ? "Loading departments..." : "Select or enter department"} />
            </SelectTrigger>
            <SelectContent>
              {departments.map((dept) => (
                <SelectItem key={dept} value={dept}>
                  {dept}
                </SelectItem>
              ))}
              <SelectItem value="custom">Enter new department...</SelectItem>
            </SelectContent>
          </Select>
          {(!formData.department || !departments.includes(formData.department)) && (
            <Input
              id="department"
              name="department"
              value={formData.department}
              onChange={handleChange}
              placeholder="Enter department name"
              className="rounded-xl border-gray-300"
              required
              disabled={loading}
            />
          )}
          <p className="text-xs text-gray-500">Select from existing departments or enter a new one</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="designation" className="text-gray-700">Designation</Label>
          <Input
            id="designation"
            name="designation"
            value={formData.designation}
            onChange={handleChange}
            placeholder="e.g., Software Engineer, Senior Manager"
            className="rounded-xl border-gray-300"
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone" className="text-gray-700">Phone Number</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            value={formData.phone}
            onChange={handleChange}
            placeholder="9876543210"
            className="rounded-xl border-gray-300"
            maxLength={10}
            disabled={loading}
          />
          <p className="text-xs text-gray-500">Optional - Enter 10-digit Indian mobile number</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="qualifications" className="text-gray-700">Qualifications</Label>
          <Input
            id="qualifications"
            name="qualifications"
            value={formData.qualifications}
            onChange={handleChange}
            placeholder="Bachelor's in Computer Science"
            className="rounded-xl border-gray-300"
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-gray-700">Password *</Label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              className="rounded-xl border-gray-300 pr-10"
              required
              disabled={loading}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="size-4 text-gray-500" />
              ) : (
                <Eye className="size-4 text-gray-500" />
              )}
            </Button>
          </div>
          <p className="text-xs text-gray-500">Minimum 8 characters, including uppercase, lowercase, number & special character</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="text-gray-700">Confirm Password *</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="••••••••"
              className="rounded-xl border-gray-300 pr-10"
              required
              disabled={loading}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? (
                <EyeOff className="size-4 text-gray-500" />
              ) : (
                <Eye className="size-4 text-gray-500" />
              )}
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="joiningMonth" className="text-gray-700">Joining Month</Label>
          <Select 
            value={formData.joiningMonth} 
            onValueChange={(value) => handleSelectChange('joiningMonth', value)}
            disabled={loading}
          >
            <SelectTrigger className="rounded-xl border-gray-300">
              <SelectValue placeholder="Select month (optional)" />
            </SelectTrigger>
            <SelectContent>
              {months.map((month) => (
                <SelectItem key={month} value={month}>
                  {month}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="joiningYear" className="text-gray-700">Joining Year</Label>
          <Select 
            value={formData.joiningYear} 
            onValueChange={(value) => handleSelectChange('joiningYear', value)}
            disabled={loading}
          >
            <SelectTrigger className="rounded-xl border-gray-300">
              <SelectValue placeholder="Select year (optional)" />
            </SelectTrigger>
            <SelectContent className="max-h-[200px]">
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200/50">
        <Button
          type="button"
          variant="outline"
          className="rounded-xl"
          onClick={onClose}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl px-6"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            `Create ${activeTab === 'manager' ? 'Manager' : 'Employee'} Account`
          )}
        </Button>
      </div>
    </form>
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-white/95 backdrop-blur-xl rounded-2xl border-gray-200/50 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <UserPlus className="size-5 text-white" />
            </div>
            <span>Add New Account</span>
          </DialogTitle>
          <DialogDescription className="text-gray-500">
            Enter the details of the new account to be added.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="bg-gray-100/80 p-1 rounded-xl mb-6 grid w-full grid-cols-2">
            <TabsTrigger value="employee" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <Users className="size-4 mr-2" />
              Employee
            </TabsTrigger>
            <TabsTrigger value="manager" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <UserPlus className="size-4 mr-2" />
              Manager
            </TabsTrigger>
          </TabsList>

          <TabsContent value="employee" className="mt-0">
            {formContent}
          </TabsContent>

          <TabsContent value="manager" className="mt-0">
            {formContent}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
