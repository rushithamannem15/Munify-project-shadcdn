import { useMemo } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { ColumnDef } from "@/components/data-table/data-table"
import { DataTable } from "@/components/data-table/data-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { alerts } from "@/lib/alerts"
import { apiService } from "@/services/api"
import { Mail, RefreshCw, Send, Calendar as CalendarIcon } from "lucide-react"

type Invitation = {
  id: number
  email?: string
  fullName?: string
  userId?: string
  mobileNumber?: string
  roleId?: number
  roleName?: string
  organizationId?: number
  organizationTypeId?: number
  token?: string
  inviteLink?: string
  expiry?: string
  isUsed?: boolean
  createdAt?: string
  updatedAt?: string
}

type InvitationsApiResponse = {
  status?: string
  message?: string
  data?: Array<{
    id: number
    organization_id?: number
    organization_type_id?: number
    full_name?: string
    user_id?: string
    email?: string
    mobile_number?: string
    role_id?: number
    role_name?: string
    token?: string
    expiry?: string
    is_used?: boolean
    created_at?: string
    updated_at?: string
    invite_link?: string
  }>
}

export default function InvitationsManagement() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const skip = 0
  const limit = 50

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["invitations", { skip, limit }],
    queryFn: async () => {
      // GET /invitations/?skip=0&limit=50
      return await apiService.get<InvitationsApiResponse | Invitation[]>("/invitations/", { skip, limit })
    },
  })

  const invitations: Invitation[] = useMemo(() => {
    if (!data) return []
    if (Array.isArray(data)) return data as Invitation[]
    const items = (data as InvitationsApiResponse)?.data ?? []
    return items.map((r) => ({
      id: r.id,
      organizationId: r.organization_id,
      organizationTypeId: r.organization_type_id,
      fullName: r.full_name,
      userId: r.user_id,
      email: r.email,
      mobileNumber: r.mobile_number,
      roleId: r.role_id,
      roleName: r.role_name,
      token: r.token,
      inviteLink: r.invite_link,
      expiry: r.expiry,
      isUsed: r.is_used,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }))
  }, [data])

  const resendMutation = useMutation({
    mutationFn: async (invitationId: number) => {
      // POST /invitations/{invitation_id}/resend
      return await apiService.post<{ message?: string }>(`/invitations/${invitationId}/resend`)
    },
    onSuccess: (res) => {
      alerts.success("Invitation Resent", res?.message || "Resent successfully.")
      queryClient.invalidateQueries({ queryKey: ["invitations", { skip, limit }] })
    },
    onError: (err: any) => {
      const message = err?.response?.data?.error || err?.message || "Failed to resend invitation."
      alerts.error("Error", message)
    },
  })

  const columns: ColumnDef<Invitation, any>[] = useMemo(
    () => [
      {
        accessorKey: "id",
        header: "ID",
        cell: ({ row }) => <span className="text-muted-foreground">{row.original.id}</span>,
      },
      {
        accessorKey: "fullName",
        header: "Name",
        cell: ({ row }) => row.original.fullName || "-",
      },
      {
        accessorKey: "userId",
        header: "User ID",
        cell: ({ row }) => row.original.userId || "-",
      },
      {
        accessorKey: "email",
        header: "Email",
        cell: ({ row }) => (
          <span className="inline-flex items-center gap-1">
            <Mail className="h-3 w-3 text-muted-foreground" />
            {row.original.email || "-"}
          </span>
        ),
      },
      {
        accessorKey: "mobileNumber",
        header: "Mobile",
        cell: ({ row }) => row.original.mobileNumber || "-",
      },
      {
        accessorKey: "roleName",
        header: "Role",
        cell: ({ row }) => row.original.roleName || "-",
      },
      {
        accessorKey: "isUsed",
        header: "Registered",
        cell: ({ row }) => (
          <Badge variant={row.original.isUsed ? "secondary" : "outline"}>{row.original.isUsed ? "Registered" : "Not Registered"}</Badge>
        ),
      },
      {
        accessorKey: "expiry",
        header: "Expiry",
        cell: ({ row }) => (row.original.expiry ? new Date(row.original.expiry).toLocaleString() : "-"),
      },
      {
        accessorKey: "createdAt",
        header: "Created",
        cell: ({ row }) => (
          <span className="inline-flex items-center gap-1 text-muted-foreground">
            <CalendarIcon className="h-3 w-3" />
            {row.original.createdAt ? new Date(row.original.createdAt).toLocaleString() : "-"}
          </span>
        ),
      },
      {
        accessorKey: "inviteLink",
        header: "Invite Link",
        cell: ({ row }) => (
          <span className="inline-flex items-center gap-1 text-muted-foreground">
            <Link to={row.original.inviteLink || "-"} target="_blank">
                {row.original.inviteLink || "-"}
            </Link>
            
          </span>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        enableHiding: false,
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={resendMutation.isPending}
              onClick={() => resendMutation.mutate(row.original.id)}
            >
              {resendMutation.isPending ? (
                <span className="inline-flex items-center gap-1"><Spinner size={14} /> Resending</span>
              ) : (
                <span className="inline-flex items-center gap-1"><Send className="h-4 w-4" /> Resend</span>
              )}
            </Button>
          </div>
        ),
      },
    ],
    [resendMutation]
  )

  if (isLoading) {
    return (
      <Card className="p-6 flex items-center justify-center">
        <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          <Spinner size={16} /> Loading invitations...
        </span>
      </Card>
    )
  }

  if (isError) {
    return (
      <Card className="p-6">
        <div className="text-sm text-red-600">Failed to load invitations: {(error as any)?.message || "Unknown error"}</div>
        <div className="mt-4">
          <Button variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: ["invitations"] })}>
            <RefreshCw className="h-4 w-4 mr-2" /> Retry
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4 max-h-full">
      <DataTable<Invitation, any>
        columns={columns}
        data={invitations}
        title="Invitations"
        description="List of all user invitations"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="default" onClick={() => navigate("/main/admin/invitation")}> 
              <Send className="mr-2 h-4 w-4" /> Send Invitation
            </Button>
            <Button variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: ["invitations", { skip, limit }] })}>
              <RefreshCw className="mr-2 h-4 w-4" /> Refresh
            </Button>
          </div>
        }
        globalFilterPlaceholder="Search invitations..."
        pageSize={10}
        enableExport
        exportFilename="invitations.csv"
      />
    </div>
  )
}


