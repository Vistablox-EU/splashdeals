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
      title: "Kontrolna tabla",
      url: "/admin/dashboard",
      icon: "dashboard",
      items: [
        {
          title: "Pregled",
          url: "/admin/dashboard",
          icon: "globe",
        },
      ],
    },
    {
      title: "Objekti",
      url: "/admin/facilities",
      icon: "store",
      items: [
        {
          title: "Spisak objekata",
          url: "/admin/facilities",
          icon: "list",
        },
        {
          title: "Novi objekat",
          url: "/admin/facilities/new",
          icon: "add_business",
          requiredRole: "SUPER_ADMIN",
        },
      ],
    },
    {
      title: "Bezbednost i operacije",
      url: "/admin/support",
      icon: "security",
      items: [
        {
          title: "Administratori",
          url: "/admin/users",
          icon: "people",
          requiredRole: "SUPER_ADMIN",
        },
        {
          title: "API ključevi",
          url: "/admin/api-keys",
          icon: "key",
          requiredRole: "SUPER_ADMIN",
        },
        {
          title: "Podrška",
          url: "/admin/support",
          icon: "support",
          requiredRole: "SUPER_ADMIN",
        },
      ],
    },
  ] as NavItem[],
}
