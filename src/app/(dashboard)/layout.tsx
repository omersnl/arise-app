import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Nav } from "@/components/system/nav"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session) redirect("/login")

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <Nav />
      <div className="pt-12">{children}</div>
    </div>
  )
}
