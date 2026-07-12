export interface NavItem {
  title: string;
  url: string;
  icon?: string;
  requiredRole?: "SUPER_ADMIN" | "FACILITY_STAFF";
  items?: NavItem[];
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
      title: "CMS",
      url: "/admin/cms",
      icon: "article",
      items: [
        {
          title: "Blog objave",
          url: "/admin/cms/posts",
          icon: "newspaper",
        },
        {
          title: "Strane",
          url: "/admin/cms/pages",
          icon: "file_text",
        },
        {
          title: "Kategorije",
          url: "/admin/cms/categories",
          icon: "folder",
        },
        {
          title: "Navigacija",
          url: "/admin/cms/navigation",
          icon: "menu_book",
        },
        {
          title: "Tagovi",
          url: "/admin/cms/tags",
          icon: "tags",
          requiredRole: "SUPER_ADMIN",
        },
        {
          title: "Vebhukovi",
          url: "/admin/cms/webhooks",
          icon: "webhook",
        },
        {
          title: "Media biblioteka",
          url: "/admin/media",
          icon: "photo_library",
        },
      ],
    },
    {
      title: "Bezbednost i operacije",
      url: "/admin/",
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
      ],
    },
  ] as NavItem[],
};
