"use client"
import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    })

    if (result?.error) {
      setError("Invalid email or password.")
      setLoading(false)
      return
    }

    router.push("/dashboard")
  }

  return (
    <div className="system-window rounded-lg p-8 w-full max-w-md space-y-6">
      <div className="text-center space-y-1">
        <p className="system-text text-xs tracking-widest uppercase">System Login</p>
        <h1 className="text-2xl font-bold text-white font-mono">
          [ HUNTER VERIFICATION ]
        </h1>
        <p className="text-gray-500 text-xs font-mono">
          Prove your identity to the System
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="hunter@arise.gg"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </div>

        {error && (
          <p className="text-red-400 text-xs font-mono text-center border border-red-900/50 rounded p-2 bg-red-950/20">
            ⚠ {error}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "[ VERIFYING... ]" : "[ ENTER ]"}
        </Button>
      </form>

      <p className="text-center text-gray-500 text-xs font-mono">
        No account?{" "}
        <Link
          href="/register"
          className="text-purple-400 hover:text-purple-300 transition-colors"
        >
          Begin your journey →
        </Link>
      </p>
    </div>
  )
}
