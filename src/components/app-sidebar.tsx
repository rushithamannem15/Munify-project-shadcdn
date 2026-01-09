import * as React from "react"
import { LayoutDashboard, FolderKanban, Building2, Settings, Wrench, GalleryVerticalEnd, Table, Shield, Handshake, FileText,Activity } from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { SearchForm } from "./search-form"
import { useAuth } from "@/contexts/auth-context"

// This is sample data.
const data = {
  teams: [
    {
      name: "Munify",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
    },
    // {
    //   name: "Acme Corp.",
    //   logo: AudioWaveform,
    //   plan: "Startup",
    // },
    // {
    //   name: "Evil Corp.",
    //   logo: Command,
    //   plan: "Free",
    // },
  ],
  navMain: [
    {
      title: "Dashboard",
      url: "/main",
      icon: LayoutDashboard,
      items: [
        { title: "Overview", url: "/main" },
        { title: "Municipality Dashboard", url: "/main/dashboard/municipality" },
        { title: "Master Dashboard", url: "/main/admin/monitoring" },
        { title: "Lender Dashboard", url: "/main/lender/dashboard" },
      ],
    },
    {
      title: "Projects",
      url: "/main/projects",
      icon: FolderKanban,
      items: [
        { title: "Live Projects", url: "/main/projects/live" },
        { title: "Funded Projects", url: "/main/projects/funded" },
        { title: "My Projects", url: "/main/projects/my" },
        { title: "Favorites", url: "/main/projects/favorites" },
        { title: "Card Designs", url: "/main/designs/cards" },
      ],
    },
    {
      title: "Municipalities",
      url: "/main/municipalities",
      icon: Building2,
      items: [
        { title: "All Municipalities", url: "/main/municipalities" },
        { title: "Credit Ratings", url: "/main/municipal/ratings" },
        { title: "Financial Analysis", url: "/main/municipal/analysis" },
        { title: "Q&A Management", url: "/main/municipal/qa" },
        { title: "Project Progress", url: "/main/municipal/projects/progress" },
        { title: "Documents and Meetings", url: "/main/municipal/document-requests" },
      ],
    },
    {
      title: "Lender",
      url: "/main/lender",
      icon: Handshake,
      items: [
        { title: "Request Documents and Meetings", url: "/main/lender/requested-documents" },
      ],
    },
    {
      title: "Reports",
      url: "/main/reports",
      icon: FileText,
      items: [
        { title: "Lender Report", url: "/main/reports/lender-report" },
        { title: "Project-level Commitment Report", url: "/main/reports/project-level-commitment" },
        { title: "Project Success Report", url: "/main/reports/project-success" },
        { title: "Current Status Report", url: "/main/reports/current-status" },
        { title: "Project-level Commitment Report (Admin)", url: "/main/reports/project-level-commitment-admin" },
        { title: "Project Success Report (Admin)", url: "/main/reports/project-success-admin" },
      ],
    },
    {
      title: "Master",
      url: "/main/master",
      icon: Shield,
      items: [
        { title: "Roles Management", url: "/main/master/roles" },
        { title: "Organizations Management", url: "/main/master/organizations" },
        { title: "Fee Category Exemptions", url: "/main/master/fee-category-exemptions" },
        { title: "Common Master Excel", url: "/main/master/common-excel" },
      ],
    },
    {
      title: "Admin",
      url: "/main/admin",
      icon: Settings,
      items: [
        { title: "Project Management", url: "/main/admin/projects" },
        { title: "Create Project", url: "/main/admin/projects/create" },
        { title: "My Drafts", url: "/main/admin/projects/drafts" },
        // { title: "Validate Projects", url: "/main/admin/projects/validate" },
        { title: "User Management", url: "/main/admin/users" },
        { title: "Invitations Management", url: "/main/admin/invitations" },
        { title: "Send Invitation", url: "/main/admin/invitation" },
        { title: "Notifications", url: "/main/admin/notifications" },
        { title: "Commitments Overview", url: "/main/admin/commitments" },
        { title: "Reports", url: "/main/admin/reports" },
      ],
    },
    {
      title: "Trackings",
      url: "/main/admin/monitoring/lifecycle",
      icon: Activity,
      items: [
        { title: "Project Lifecycle Tracker", url: "/main/admin/monitoring/lifecycle" },
        { title: "Commitment Monitoring", url: "/main/admin/monitoring/commitments" },
        { title: "Q&A & Communication", url: "/main/admin/monitoring/qa" },
        { title: "Document Requests & Library", url: "/main/admin/monitoring/documents" },
        { title: "Allocation & Disbursement", url: "/main/admin/monitoring/allocation-disbursement" },
      ],
    },
    {
      title: "Components",
      url: "/main/components",
      icon: Table,
      items: [
        { title: "Data Table", url: "/main/components/datatable" },
      ],
    },
  ],
  projects: [
    {
      name: "Settings",
      url: "/main/projects",
      icon: Wrench,
    },
    // {
    //   name: "Sales & Marketing",
    //   url: "/main/projects/active",
    //   icon: PieChart,
    // },
    // {
    //   name: "Travel",
    //   url: "/main/projects/archived",
    //   icon: Map,
    // },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [query, setQuery] = React.useState("")
  const { user } = useAuth()
  const q = query.trim().toLowerCase()
  const filteredNavMain = data.navMain.map((section) => ({
    ...section,
    items: section.items?.filter((i) => i.title.toLowerCase().includes(q)),
  }))
  const filteredProjects = data.projects.filter((p) => p.name.toLowerCase().includes(q))

  // Extract user data from auth context
  const userData = {
    name: user?.data?.login,
    email: user?.data?.email,
    avatar: "/avatars/shadcn.jpg",
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
        <div className="group-data-[collapsible=icon]:hidden">
          <SearchForm value={query} onChange={setQuery} />
        </div>
       
      
       
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={filteredNavMain} />
        <NavProjects projects={filteredProjects} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
