import { revalidatePath } from "next/cache"

export const ADMIN_PATHS = {
  facilities: {
    list: () => "/admin/facilities" as const,
    detail: (id: string) => `/admin/facilities/${id}` as const,
    amenities: (id: string) => `/admin/facilities/${id}/amenities` as const,
    media: (id: string) => `/admin/facilities/${id}/media` as const,
  },
  users: {
    list: () => "/admin/users" as const,
  },
} as const;

export const PUBLIC_PATHS = {
  facilityDetail: (slug: string) => `/${slug}` as const,
} as const;

export function revalidateAdmin(route: string, type?: "layout") {
  revalidatePath(route, type);
}

export function revalidateAdminFacilities() {
  revalidatePath(ADMIN_PATHS.facilities.list());
}

export function revalidateAdminFacility(facilityId: string) {
  revalidatePath(ADMIN_PATHS.facilities.detail(facilityId), "layout");
}

export function revalidateAdminAmenities(facilityId: string) {
  revalidatePath(ADMIN_PATHS.facilities.amenities(facilityId));
}

export function revalidateAdminMedia(facilityId: string, slug?: string) {
  revalidatePath(ADMIN_PATHS.facilities.media(facilityId));
  if (slug) {
    revalidatePath(PUBLIC_PATHS.facilityDetail(slug), "layout");
  }
}

export function revalidateAdminUsers() {
  revalidatePath(ADMIN_PATHS.users.list());
}

export const CMS_PATHS = {
  posts: {
    list: () => "/admin/cms/posts" as const,
    detail: (id: string) => `/admin/cms/posts/${id}` as const,
  },
  pages: {
    list: () => "/admin/cms/pages" as const,
    detail: (id: string) => `/admin/cms/pages/${id}` as const,
  },
  categories: {
    list: () => "/admin/cms/categories" as const,
  },
  tags: {
    list: () => "/admin/cms/tags" as const,
  },
} as const;

export function revalidateAdminPosts() {
  revalidatePath(CMS_PATHS.posts.list());
}

export function revalidateAdminPost(postId: string) {
  revalidatePath(CMS_PATHS.posts.detail(postId));
}

export function revalidateAdminPages() {
  revalidatePath(CMS_PATHS.pages.list());
}

export function revalidateAdminPage(pageId: string) {
  revalidatePath(CMS_PATHS.pages.detail(pageId));
}

export function revalidateAdminCategories() {
  revalidatePath(CMS_PATHS.categories.list());
}

export function revalidateAdminTags() {
  revalidatePath(CMS_PATHS.tags.list());
}
