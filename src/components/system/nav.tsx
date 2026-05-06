"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"

const LINKS = [
  { href: "/dashboard", label: "[ STATUS ]" },
  { href: "/quests", label: "[ QUESTS ]" },
  { href: "/shadows", label: "[ SHADOWS ]" },
  { href: "/weapons", label: "[ WEAPONS ]" },
  { href: "/skills", label: "[ SKILLS ]" },
  { href: "/guild", label: "[ GUILD ]" },
  { href: "/duels", label: "[ DUELS ]" },
]

export function Nav() {
  const pathname = usePathname()

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-purple-900/30 bg-[#0a0a0f]/95 backdrop-blur-sm">
      <div className="max-w-5xl mx-auto px-4 flex items-center justify-between h-12">
        <Link href="/dashboard" className="text-purple-400 font-mono font-bold text-sm tracking-widest">
          A·R·I·S·E
        </Link>

        <div className="flex items-center gap-1">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-2.5 py-1.5 rounded font-mono text-xs transition-colors ${
                pathname === link.href || pathname.startsWith(link.href + "/")
                  ? "bg-purple-900/40 text-purple-200"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="text-gray-600 hover:text-gray-400 font-mono text-xs transition-colors"
        >
          [ EXIT ]
        </button>
      </div>
    </nav>
  )
}
