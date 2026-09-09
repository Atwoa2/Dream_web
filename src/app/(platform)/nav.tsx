"use client";

/**
 * Sidebar navigation — mirrors the page set of the original platform.
 */
import Link from "next/link";
import { usePathname } from "next/navigation";

type Item = { href: string; label: string };

const SECTIONS: { title: string | null; items: Item[] }[] = [
  {
    title: null,
    items: [
      { href: "/api-keys", label: "API keys" },
      { href: "/usage", label: "Usage" },
    ],
  },
  {
    title: "Fine-tuning",
    items: [
      { href: "/fine-tuning", label: "Jobs" },
      { href: "/fine-tuning/datasets", label: "Datasets" },
      { href: "/fine-tuning/embodiments", label: "Embodiments" },
    ],
  },
  {
    title: "Fish Tank",
    items: [
      { href: "/fish-tank", label: "Tanks" },
      { href: "/fish-tank/requests", label: "Requests" },
    ],
  },
  {
    title: "Account",
    items: [
      { href: "/billing", label: "Billing" },
      { href: "/settings", label: "Settings" },
    ],
  },
];

export function PlatformNav() {
  const pathname = usePathname();

  return (
    <nav>
      {SECTIONS.map((section) => (
        <div key={section.title ?? "top"}>
          {section.title && <div className="nav-section">{section.title}</div>}
          {section.items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-link${pathname === item.href ? " active" : ""}`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      ))}
    </nav>
  );
}
