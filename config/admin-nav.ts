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
        {
          title: "Gradovi",
          url: "/admin/facilities/cities",
          icon: "city",
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
          title: "Aktivnosti",
          url: "/admin/cms/activity",
          icon: "history",
          requiredRole: "SUPER_ADMIN",
        },
        {
          title: "Kampanje",
          url: "/admin/cms/campaigns",
          icon: "campaign",
          requiredRole: "SUPER_ADMIN",
        },
        {
          title: "Navigacija",
          url: "/admin/cms/navigation",
          icon: "menu_book",
        },
        {
          title: "Preusmerenja",
          url: "/admin/cms/redirects",
          icon: "alt_route",
        },
        {
          title: "Provera linkova",
          url: "/admin/cms/broken-links",
          icon: "link_off",
          requiredRole: "SUPER_ADMIN",
        },
        {
          title: "Recenzije",
          url: "/admin/cms/reviews",
          icon: "star",
          requiredRole: "SUPER_ADMIN",
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
          title: "Zakazane objave",
          url: "/admin/cms/posts/scheduled",
          icon: "schedule",
        },
        {
          title: "Media biblioteka",
          url: "/admin/media",
          icon: "photo_library",
        },
        {
          title: "Widget embed kodovi",
          url: "/admin/cms/embed",
          icon: "code",
        },
        {
          title: "API dokumentacija",
          url: "/admin/cms/api-docs",
          icon: "api",
          requiredRole: "SUPER_ADMIN",
        },
        {
          title: "404 greške",
          url: "/admin/cms/not-found-logs",
          icon: "error_outline",
          requiredRole: "SUPER_ADMIN",
        },
        {
          title: "Neiskorišćeni mediji",
          url: "/admin/cms/orphaned-media",
          icon: "delete_sweep",
          requiredRole: "SUPER_ADMIN",
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
        {
          title: "Vlasnici objekata",
          url: "/admin/owners",
          icon: "people",
          requiredRole: "SUPER_ADMIN",
        },
        {
          title: "Korisnici",
          url: "/admin/customers",
          icon: "group",
          requiredRole: "SUPER_ADMIN",
        },
      ],
    },
  ] as NavItem[],
};
