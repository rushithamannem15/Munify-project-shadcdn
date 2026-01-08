import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
 
import { Mail, Lock, Eye, EyeOff, User, UserCircle, Phone, Shield, Check, ChevronDown, CheckCircle2, MessageSquare } from "lucide-react"
import MunifyLogo from "@/assets/MunifyLOGO.png"
import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import Copyright from "@/components/Copyright"
import { apiService } from "@/services/api"
import { alerts } from "@/lib/alerts"
import { cn } from "@/lib/utils"
import { Spinner, LoadingOverlay } from "@/components/ui/spinner"
import { useQuery } from "@tanstack/react-query"

// Type for organization/organization type items
type OrganizationItem = {
  id: number
  branchName: string
  version?: number
}

export default function Register() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [agreeToTerms, setAgreeToTerms] = useState(false)

  const [form, setForm] = useState({
    userName: "",
    login: "",
    email: "",
    mobileNumber: "",
    password: "",
    confirmPassword: "",
    roleId: "",
  })

  const [orgFields, setOrgFields] = useState({
    organizationId: "",
    organizationTypeId: "",
    organizationName: "",
    organizationType: "",
    // Lender-specific
    designation: "",
    regulatoryRegistrationNo: "",
    // Municipality-specific
    municipalityStateDistrict: "",
    gstnOrUlbCode: "",
    annualBudgetSize: "",
  })

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [orgNameOpen, setOrgNameOpen] = useState(false)
  const [orgTypeOpen, setOrgTypeOpen] = useState(false)
  
  // OTP verification state
  const [otp, setOtp] = useState("")
  const [isMobileVerified, setIsMobileVerified] = useState(false)
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false)

  // Infer a coarse organization type label from a branch/type name
  const inferOrgType = (label: string): string => {
    const text = (label || "").toLowerCase()
    if (/(bank|nbfc|multilateral|philanthropy|finance|lender)/.test(text)) return "Lender"
    if (/(municipal|municipality|ulb|nagar|nigam|parishad)/.test(text)) return "Municipality"
    if (/(govt|government|niua)/.test(text)) return "Govt/NIUA"
    if (/munify/.test(text)) return "Munify"
    return ""
  }

  // Returns branch name for a given organization id, or empty string
  const getOrgBranchName = (id?: string, orgList?: OrganizationItem[]) => {
    if (!id || !orgList) return ""
    const match = orgList.find(o => o.id.toString() === id)
    return match?.branchName || ""
  }

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  // Fetch roles using React Query for consistency
  const {
    data: roles = [],
    isLoading: loadingRoles,
    error: rolesError,
    isError: isRolesError,
  } = useQuery<Array<{id: number, name: string, accessLevel: number}>>({
    queryKey: ["roles"],
    queryFn: async () => {
      const rolesData = await apiService.get("/master/roles")
      return rolesData as Array<{id: number, name: string, accessLevel: number}>
    },
  })

  // Handle roles error
  useEffect(() => {
    if (isRolesError && rolesError) {
      const message = (rolesError as any)?.response?.data?.error || (rolesError as any)?.message || "Failed to load user roles. Please refresh the page."
      alerts.error("Error", message)
    }
  }, [isRolesError, rolesError])

  // Fetch organization types using Perdix API with parent_branch_id: 999
  const {
    data: organizationTypes = [],
    isLoading: loadingOrgTypes,
    error: orgTypesError,
    isError: isOrgTypesError,
  } = useQuery<OrganizationItem[]>({
    queryKey: ["organizationTypes"],
    queryFn: async () => {
      const response = await apiService.post("/perdix/query", {
        identifier: "childBranch.list",
        limit: 0,
        offset: 0,
        parameters: {
          parent_branch_id: 999
        },
        skip_relogin: "yes"
      }, {
        usePerdixTimeout: true // Use extended timeout for Perdix queries
      })
      // Extract results array and map branch_name to branchName for consistency
      const results = (response as any)?.results || []
      return results.map((item: any): OrganizationItem => ({
        id: item.id,
        branchName: item.branch_name || item.branchName,
        version: item.version
      }))
    },
  })

  // Handle organization types error
  useEffect(() => {
    if (isOrgTypesError && orgTypesError) {
      const message = (orgTypesError as any)?.response?.data?.error || (orgTypesError as any)?.message || "Failed to load organization types. Please try again."
      alerts.error("Error", message)
    }
  }, [isOrgTypesError, orgTypesError])

  // Fetch organizations based on selected organization type
  const {
    data: organizations = [],
    isLoading: loadingOrganizations,
    error: organizationsError,
    isError: isOrganizationsError,
  } = useQuery<OrganizationItem[]>({
    queryKey: ["organizations", orgFields.organizationTypeId],
    queryFn: async () => {
      if (!orgFields.organizationTypeId) {
        return []
      }
      const response = await apiService.post("/perdix/query", {
        identifier: "childBranch.list",
        limit: 0,
        offset: 0,
        parameters: {
          parent_branch_id: Number(orgFields.organizationTypeId)
        },
        skip_relogin: "yes"
      }, {
        usePerdixTimeout: true // Use extended timeout for Perdix queries
      })
      // Extract results array and map branch_name to branchName for consistency
      const results = (response as any)?.results || []
      return results.map((item: any): OrganizationItem => ({
        id: item.id,
        branchName: item.branch_name || item.branchName,
        version: item.version
      }))
    },
    enabled: !!orgFields.organizationTypeId, // Only fetch when organization type is selected
  })

  // Handle organizations error
  useEffect(() => {
    if (isOrganizationsError && organizationsError) {
      const message = (organizationsError as any)?.response?.data?.error || (organizationsError as any)?.message || "Failed to load organizations. Please try again."
      alerts.error("Error", message)
    }
  }, [isOrganizationsError, organizationsError])

  // Ensure conditional fields reflect org type when IDs are prefilled
  useEffect(() => {
    // If invitation gave explicit type text, keep it; otherwise infer
    if (!orgFields.organizationType) {
      const label = getOrgBranchName(orgFields.organizationTypeId, organizationTypes) || getOrgBranchName(orgFields.organizationId, organizations)
      if (label) setOrgFields(prev => ({ ...prev, organizationType: inferOrgType(label) }))
    }
  }, [organizationTypes, organizations, orgFields.organizationType, orgFields.organizationTypeId, orgFields.organizationId])

  // Reset OTP verification when mobile number changes
  useEffect(() => {
    setIsMobileVerified(false)
    setOtp("")
  }, [form.mobileNumber])

  // Prefill via invitation token with request cancellation
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get("token")
    if (!token) return

    const abortController = new AbortController()

    const prefillFromInvitation = async () => {
      try {
        const data = await apiService.get(`/invitations/validate/${token}`, undefined, {
          signal: abortController.signal
        })
        // Only update state if component is still mounted and request wasn't aborted
        if (!abortController.signal.aborted) {
          setForm(prev => ({
            ...prev,
            userName: (data?.full_name || "").toString(),
            login: (data?.user_id || "").toString(),
            email: (data?.email || "").toString(),
            mobileNumber: (data?.mobile_number || "").toString(),
            roleId: data?.role_id ? String(data.role_id) : prev.roleId,
          }))
          setOrgFields(prev => ({
            ...prev,
            // IDs for controlled dropdown selection
            organizationId: data?.organization_id ? String(data.organization_id) : prev?.organizationId,
            organizationTypeId: data?.organization_type_id ? String(data.organization_type_id) : prev?.organizationTypeId,
            // Keep names for display/backward compatibility if needed
            organizationName: (data?.organization_name || "").toString(),
            organizationType: (data?.organization_type || "").toString(),
          }))
          // Reset OTP verification state when prefilling
          setIsMobileVerified(false)
          setOtp("")
          // If backend didn't send readable type, the effect above will infer once organizations load
        }
      } catch (err: any) {
        // Don't show error if request was aborted (component unmounted)
        if (err.name === 'AbortError' || abortController.signal.aborted) {
          return
        }
        const message = err?.response?.data?.error || err?.message || "Invalid or expired invitation link."
        alerts.error("Invitation Error", message)
      }
    }

    prefillFromInvitation()

    // Cleanup: abort request if component unmounts
    return () => {
      abortController.abort()
    }
  }, [])

  const handleVerifyOtp = async () => {
    if (!otp.trim()) {
      alerts.error("Validation Error", "Please enter OTP")
      return
    }
    if (otp.length !== 6) {
      alerts.error("Validation Error", "OTP must be 6 digits")
      return
    }
    
    setIsVerifyingOtp(true)
    
    // Simulate OTP verification (backend not ready)
    // In production, this would call: await apiService.post("/auth/verify-otp", { mobileNumber: form.mobileNumber, otp })
    setTimeout(() => {
      setIsMobileVerified(true)
      setIsVerifyingOtp(false)
      alerts.success("Success", "Mobile number verified successfully")
    }, 500)
  }

  const validate = () => {
    if (!form.userName.trim()) return "Full name is required"
    if (!form.login.trim()) return "User ID is required"
    if (!form.email.trim()) return "Email is required"
    if (!form.mobileNumber.trim()) return "Mobile number is required"
    if (form.mobileNumber && isNaN(Number(form.mobileNumber))) return "Mobile number must be a valid number"
    if (form.mobileNumber && form.mobileNumber.length !== 10) return "Mobile number must be 10 digits"
    if (!isMobileVerified) return "Please verify your mobile number with OTP"
    if (!form.roleId) return "User role is required"
    if (!form.password) return "Password is required"
    if (form.password !== form.confirmPassword) return "Passwords do not match"
    // Password policy: 8-15 chars, at least 1 uppercase, 1 digit, 1 special
    const pwd = form.password
    if (pwd.length < 8 || pwd.length > 15) return "Password must be 8-15 characters"
    if (!/[A-Z]/.test(pwd)) return "Password must include at least 1 uppercase letter"
    if (!/[0-9]/.test(pwd)) return "Password must include at least 1 number"
    if (!/[!@#$%^&*(),.?":{}|<>_\-\[\]\\/+=~`;'']/.test(pwd)) return "Password must include at least 1 special character"
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      alerts.error("Validation error", validationError)
      return
    }
    setError(null)
    setSubmitting(true)

    try {
      // Find the selected role object from role selection field
      const selectedRole = roles.find((r) => r.id.toString() === form.roleId)
      if (!selectedRole) {
        setError("Please select a valid user role")
        alerts.error("Validation error", "Please select a valid user role")
        setSubmitting(false)
        return
      }
      
      // Find the selected organization object from Organization select list
      const selectedOrganization = orgFields.organizationId 
        ? organizations.find((o: OrganizationItem) => o.id.toString() === orgFields.organizationId)
        : undefined
      // Find the selected organization type object from Organization Type select list
      const selectedOrgType = orgFields.organizationTypeId
        ? organizationTypes.find((o: OrganizationItem) => o.id.toString() === orgFields.organizationTypeId)
        : undefined
      
      const payload = {
        fullName: form.userName.trim(),
        login: form.login.trim(),
        password: form.password,
        confirmPassword: form.confirmPassword,
        email: form.email.trim(),
        mobileNumber: Number(form.mobileNumber),
        // Pass organization object with only id and branchName (as orgName) from Organization select list
        organization: selectedOrganization ? {
          id: selectedOrganization.id,
          orgName: selectedOrganization.branchName
        } : undefined,
        // Pass organization type object with only id and branchName (as orgTypeName) from Organization Type select list
        orgtypeObj: selectedOrgType ? {
          id: selectedOrgType.id,
          orgTypeName: selectedOrgType.branchName
        } : undefined,
        designation: orgFields.designation.trim() || undefined,
        regulatoryRegistrationNo: orgFields.regulatoryRegistrationNo.trim() || undefined,
        municipalityStateDistrict: orgFields.municipalityStateDistrict.trim() || undefined,
        gstnOrUlbCode: orgFields.gstnOrUlbCode.trim() || undefined,
        annualBudgetSize: orgFields.annualBudgetSize.trim() || undefined,
        // Pass userRoles with proper roleId and roleName from selected role
        userRoles: [
          {
            userId: form.login.trim(),
            userName: form.userName.trim(),
            roleId: selectedRole.id,
            roleName: selectedRole.name,
            userRoleId: null,
            id: null,
          },
        ],
      }

      const response = await apiService.post("/users/register", payload)
      alerts.success("Application Submitted", response?.data?.user_id + " user created successfully")
      navigate("/login")
    } catch (err: any) {
      const message = err?.response?.data?.error || err?.message || "Failed to register. Please try again."
      setError(message)
      alerts.error("Error", message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <LoadingOverlay show={submitting} />
      <div className="w-full max-w-3xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <img src={MunifyLogo} alt="Munify" className="h-11" />
            
          </div>
          <div className="text-sm text-muted-foreground">
            Already have an account? {""}
            <Link to="/login" className="text-blue-600 hover:underline">Sign in</Link>
          </div>
        </div>

        <Card>
          <CardHeader className="py-4">
            <CardTitle className="text-xl">Create Account</CardTitle>
            <CardDescription className="text-sm">
              Fill the details to get started
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            {error && (
              <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            <form className="space-y-4" onSubmit={handleSubmit}>
              {/* Grid layout to reduce scrolling */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Organization Type (ID-backed dropdown) */}
                <div className="space-y-1.5">
                  <Label htmlFor="organizationTypeId">Organization Type</Label>
                  <Popover open={orgTypeOpen} onOpenChange={setOrgTypeOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={orgTypeOpen}
                        className="w-full justify-between h-9"
                        disabled={true}
                      >
                        <div className="flex items-center text-gray-500 font-normal">
                          <UserCircle className="mr-3 h-4 w-4 text-gray-400" />
                          {loadingOrgTypes ? (
                            <span className="flex items-center gap-2"><Spinner size={16} /> Loading organization types...</span>
                          ) : orgFields.organizationTypeId ? (
                            organizationTypes.find((org: OrganizationItem) => org.id.toString() === orgFields.organizationTypeId)?.branchName || "Select organization type"
                          ) : (
                            "Select organization type"
                          )}
                        </div>
                        <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      {loadingOrgTypes ? (
                        <div className="flex items-center gap-2 p-3 text-sm text-muted-foreground"><Spinner size={16} /> Loading organization types...</div>
                      ) : (
                        <Command>
                          <CommandInput placeholder="Search organization types..." />
                          <CommandList>
                            <CommandEmpty>No organization type found.</CommandEmpty>
                            <CommandGroup>
                              {organizationTypes.map((org: OrganizationItem) => (
                                <CommandItem
                                  key={org.id}
                                  value={org.branchName}
                                  onSelect={() => {
                                    setOrgFields(prev => ({ 
                                      ...prev, 
                                      organizationTypeId: org.id.toString(),
                                      // Clear organization selection when organization type changes
                                      organizationId: "",
                                      // also set a human-readable type for conditional UI
                                      organizationType: inferOrgType(org.branchName)
                                    }))
                                    setOrgTypeOpen(false)
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      orgFields.organizationTypeId === org.id.toString() ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  <div className="flex flex-col">
                                    <span className="font-medium">{org.branchName}</span>
                                    <span className="text-xs text-muted-foreground">ID: {org.id}</span>
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      )}
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Organization Name (ID-backed dropdown) */}
                <div className="space-y-1.5">
                  <Label htmlFor="organizationId">Organization</Label>
                  <Popover open={orgNameOpen} onOpenChange={setOrgNameOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={orgNameOpen}
                        className="w-full justify-between h-9"
                        disabled={true}
                      >
                        <div className="flex items-center text-gray-500 font-normal">
                          <UserCircle className="mr-3 h-4 w-4 text-gray-400" />
                          {!orgFields.organizationTypeId ? (
                            "Please select organization type first"
                          ) : loadingOrganizations ? (
                            <span className="flex items-center gap-2"><Spinner size={16} /> Loading organizations...</span>
                          ) : orgFields.organizationId ? (
                            organizations.find((org: OrganizationItem) => org.id.toString() === orgFields.organizationId)?.branchName || "Select organization"
                          ) : (
                            "Select organization"
                          )}
                        </div>
                        <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      {!orgFields.organizationTypeId ? (
                        <div className="p-3 text-sm text-muted-foreground">Please select an organization type first</div>
                      ) : loadingOrganizations ? (
                        <div className="flex items-center gap-2 p-3 text-sm text-muted-foreground"><Spinner size={16} /> Loading organizations...</div>
                      ) : (
                        <Command>
                          <CommandInput placeholder="Search organizations..." />
                          <CommandList>
                            <CommandEmpty>No organization found.</CommandEmpty>
                            <CommandGroup>
                              {organizations.map((org: OrganizationItem) => (
                                <CommandItem
                                  key={org.id}
                                  value={org.branchName}
                                  onSelect={() => {
                                    setOrgFields(prev => ({ ...prev, organizationId: org.id.toString() }))
                                    setOrgNameOpen(false)
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      orgFields.organizationId === org.id.toString() ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  <div className="flex flex-col">
                                    <span className="font-medium">{org.branchName}</span>
                                    <span className="text-xs text-muted-foreground">ID: {org.id}</span>
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      )}
                    </PopoverContent>
                  </Popover>
                </div>
                

                {/* Full Name */}
                <div className="space-y-1.5">
                  <Label htmlFor="userName">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      id="userName"
                      type="text"
                      placeholder="Enter Full Name"
                      className="pl-10 bg-muted"
                      value={form.userName}
                      onChange={(e) => handleChange("userName", e.target.value)}
                      disabled={true}
                      readOnly
                      required
                    />
                  </div>
                </div>

                {/* User ID */}
                <div className="space-y-1.5">
                  <Label htmlFor="login">User ID</Label>
                  <div className="relative">
                    <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      id="login"
                      type="text"
                      placeholder="Enter User ID"
                      className="pl-10 bg-muted"
                      value={form.login}
                      onChange={(e) => handleChange("login", e.target.value)}
                      disabled={true}
                      readOnly
                      required
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="john.doe@example.com"
                      className="pl-10 bg-muted"
                      value={form.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                      disabled={true}
                      readOnly
                      required
                    />
                  </div>
                </div>

                {/* Mobile Number */}
                <div className="space-y-1.5">
                  <Label htmlFor="mobileNumber">Mobile Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      id="mobileNumber"
                      type="tel"
                      placeholder="9876543210"
                      className="pl-10 bg-muted"
                      value={form.mobileNumber}
                      onChange={(e) => handleChange("mobileNumber", e.target.value)}
                      maxLength={10}
                      disabled={true}
                      readOnly
                      required
                    />
                  </div>
                </div>

                {/* OTP Verification - Full width */}
                <div className="md:col-span-2 space-y-1.5">
                  <Label htmlFor="otp">Verify Mobile Number</Label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        id="otp"
                        type="text"
                        placeholder="Enter 6-digit OTP"
                        className={cn(
                          "pl-10 pr-10",
                          isMobileVerified && "border-green-500 bg-green-50"
                        )}
                        value={otp}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, "").slice(0, 6)
                          setOtp(value)
                          // Reset verification if OTP changes after being verified
                          if (isMobileVerified) {
                            setIsMobileVerified(false)
                          }
                        }}
                        maxLength={6}
                        disabled={isMobileVerified || isVerifyingOtp || submitting}
                      />
                      {isMobileVerified && (
                        <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 text-green-600 h-4 w-4" />
                      )}
                    </div>
                    <Button
                      type="button"
                      variant={isMobileVerified ? "outline" : "default"}
                      onClick={handleVerifyOtp}
                      disabled={isMobileVerified || isVerifyingOtp || submitting || !otp.trim() || otp.length !== 6}
                      className="sm:w-auto w-full"
                    >
                      {isVerifyingOtp ? (
                        <span className="inline-flex items-center gap-2">
                          <Spinner size={16} /> Verifying...
                        </span>
                      ) : isMobileVerified ? (
                        <span className="inline-flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4" /> Verified
                        </span>
                      ) : (
                        "Verify OTP"
                      )}
                    </Button>
                  </div>
                  {isMobileVerified && (
                    <p className="text-xs text-green-600 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Mobile number verified successfully
                    </p>
                  )}
                  {!isMobileVerified && form.mobileNumber && form.mobileNumber.length === 10 && (
                    <p className="text-xs text-muted-foreground">
                      Please enter the OTP sent to your mobile number to verify
                    </p>
                  )}
                </div>

                {/* User Role */}
                <div className="space-y-1.5">
                  <Label htmlFor="roleId">User Role</Label>
                  <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-full justify-between pl-3"
                        disabled={true}
                      >
                        <div className="flex items-center text-gray-500 font-normal">
                          <Shield className="mr-3 h-4 w-4 text-gray-400" />
                          {loadingRoles ? (
                            <span className="flex items-center gap-2"><Spinner size={16} /> Loading roles...</span>
                          ) : form.roleId ? (
                            roles.find((role) => role.id.toString() === form.roleId)?.name
                          ) : (
                            "Select user role"
                          )}
                        </div>
                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      {loadingRoles ? (
                        <div className="flex items-center gap-2 p-3 text-sm text-muted-foreground"><Spinner size={16} /> Loading roles...</div>
                      ) : (
                        <Command>
                          <CommandInput placeholder="Search roles..." />
                          <CommandList>
                            <CommandEmpty>No role found.</CommandEmpty>
                            <CommandGroup>
                              {roles.map((role) => (
                                <CommandItem
                                  key={role.id}
                                  value={role.name}
                                  onSelect={() => {
                                    handleChange("roleId", role.id.toString())
                                    setOpen(false)
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      form.roleId === role.id.toString() ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {role.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      )}
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a strong password"
                      className="pl-10 pr-10"
                      value={form.password}
                      onChange={(e) => handleChange("password", e.target.value)}
                      disabled={submitting}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm password"
                      className="pl-10 pr-10"
                      value={form.confirmPassword}
                      onChange={(e) => handleChange("confirmPassword", e.target.value)}
                      disabled={submitting}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Terms and Submit */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pt-1">
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="terms"
                    checked={agreeToTerms}
                    onCheckedChange={(checked) => setAgreeToTerms(checked === "indeterminate" ? false : checked)}
                    className="mt-1"
                  />
                  <Label htmlFor="terms" className="text-sm leading-relaxed">
                    I agree to the {""}
                    <Link to="/terms" className="text-blue-600 hover:underline">Terms of Service</Link>{" "}
                    and {""}
                    <Link to="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link>
                  </Label>
                </div>

                <Button 
                  type="submit" 
                  size="lg"
                  className="md:w-auto w-full"
                  disabled={!agreeToTerms || submitting || !isMobileVerified}
                >
                  {submitting ? (
                    <span className="inline-flex items-center gap-2"><Spinner size={16} /> Creating...</span>
                  ) : (
                    "Create Account"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="text-center mt-4 text-xs text-muted-foreground">
          By creating an account, you agree to our platform's terms and conditions.
        </div>
        <div className="text-center mt-2">
          <Copyright variant="minimal" />
        </div>
      </div>
    </div>
  )
}
