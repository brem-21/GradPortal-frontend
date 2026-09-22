/**
 * Feature names.
 *
 * "Documents", "Evaluation" and "Assistant" describe the mechanism. These name
 * the thing the applicant is actually doing, which is what makes a sidebar
 * scannable — and gives the product a voice consistent with the Aker system.
 */

export interface NavItem {
  href: string;
  label: string;
  /** One line, shown in the expanded sidebar and as the collapsed tooltip. */
  hint: string;
  icon: string;
  roles?: ("student" | "mentor" | "admin")[];
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Find",
    items: [
      {
        href: "/overview",
        label: "Home",
        hint: "Your matches, deadlines and activity",
        icon: "home",
      },
      {
        href: "/opportunities",
        label: "Openings",
        hint: "Programmes, scholarships and research posts",
        icon: "search",
      },
      {
        href: "/shortlist",
        label: "Shortlist",
        hint: "What you are tracking and how far along you are",
        icon: "bookmark",
      },
    ],
  },
  {
    label: "Prepare",
    items: [
      {
        href: "/dossier",
        label: "Dossier",
        hint: "Your CV, statements, letters and transcripts",
        icon: "folder",
      },
      {
        href: "/committee",
        label: "The Committee",
        hint: "Your file read the way an admissions panel reads it",
        icon: "gavel",
      },
    ],
  },
  {
    label: "People",
    items: [
      {
        href: "/mentors",
        label: "Mentors",
        hint: "People who have already made the move",
        icon: "users",
      },
      {
        href: "/mentorship",
        label: "Conversations",
        hint: "Your mentorship requests and replies",
        icon: "message",
      },
    ],
  },
  {
    label: "Contribute",
    items: [
      {
        href: "/submit",
        label: "Post an opening",
        hint: "Share something you found",
        icon: "plus",
        roles: ["mentor", "admin"],
      },
      {
        href: "/admin/sources",
        label: "Sources",
        hint: "Where the crawler looks",
        icon: "rss",
        roles: ["admin"],
      },
      {
        href: "/admin/media",
        label: "Media",
        hint: "Backgrounds and the photo gallery",
        icon: "image",
        roles: ["admin"],
      },
      {
        href: "/admin/stories",
        label: "Stories",
        hint: "Success stories on the landing page",
        icon: "quote",
        roles: ["admin"],
      },
    ],
  },
];

/** The floating advisor. Not in the sidebar — it follows you around instead. */
export const COUNSEL = {
  name: "Counsel",
  tagline: "Ask about your own documents, or anything on the web",
} as const;

export function groupsForRole(role: "student" | "mentor" | "admin"): NavGroup[] {
  return NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => !item.roles || item.roles.includes(role)),
  })).filter((group) => group.items.length > 0);
}
