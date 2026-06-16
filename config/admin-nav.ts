export interface NavItem {
  title: string
  url: string
  icon?: string
  requiredRole?: "SUPER_ADMIN" | "FACILITY_STAFF"
  items?: NavItem[]
}

export const adminNavData = {
  navMain: [
    {
      title: "Command Center",
      url: "/admin",
      icon: "dashboard",
      items: [
        {
          title: "Global Overview",
          url: "/admin",
          icon: "globe",
        },
      ],
    },
    {
      title: "Facilities Registry",
      url: "/admin/facilities",
      icon: "store",
      items: [
        {
          title: "Facility Directory",
          url: "/admin/facilities",
          icon: "list",
        },
        {
          title: "Register New Facility",
          url: "/admin/facilities/new",
          icon: "add_business",
          requiredRole: "SUPER_ADMIN",
        },
      ],
    },
    {
      title: "Security & Operations",
      url: "/admin/support",
      icon: "security",
      items: [
        {
          title: "Admin Users",
          url: "/admin/users",
          icon: "people",
          requiredRole: "SUPER_ADMIN",
        },
        {
          title: "Agent API Keys",
          url: "/admin/api-keys",
          icon: "key",
          requiredRole: "SUPER_ADMIN",
        },
        {
          title: "Customer Support Logs",
          url: "/admin/support",
          icon: "support",
          requiredRole: "SUPER_ADMIN",
        },
      ],
    },
  ] as NavItem[],
}
