"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { calculateDailyCalories } from "@/lib/utils"

type Unit = "metric" | "imperial"

type FormData = {
  name: string
  email: string
  password: string
  confirmPassword: string
  gender: "male" | "female" | ""
  age: string
  // metric
  heightCm: string
  weightKg: string
  // imperial
  heightFt: string
  heightIn: string
  weightLbs: string
  goalType: "lose" | "maintain" | "gain" | ""
}

const STEPS = ["Hunter Registration", "Physical Assessment", "Training Protocol"]

function toMetric(formData: FormData, unit: Unit) {
  if (unit === "metric") {
    return {
      height: parseFloat(formData.heightCm),
      weight: parseFloat(formData.weightKg),
    }
  }
  const totalInches = parseInt(formData.heightFt || "0") * 12 + parseInt(formData.heightIn || "0")
  return {
    height: Math.round(totalInches * 2.54),
    weight: Math.round(parseFloat(formData.weightLbs) * 0.453592 * 10) / 10,
  }
}

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [unit, setUnit] = useState<Unit>("metric")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [done, setDone] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    gender: "",
    age: "",
    heightCm: "",
    weightKg: "",
    heightFt: "",
    heightIn: "",
    weightLbs: "",
    goalType: "",
  })

  const update = (field: keyof FormData, value: string) =>
    setFormData((prev) => ({ ...prev, [field]: value }))

  function validate() {
    setError("")
    if (step === 0) {
      if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
        setError("All fields are required.")
        return false
      }
      if (formData.password.length < 8) {
        setError("Password must be at least 8 characters.")
        return false
      }
      if (formData.password !== formData.confirmPassword) {
        setError("Passwords do not match.")
        return false
      }
    }
    if (step === 1) {
      if (!formData.gender || !formData.age) {
        setError("All fields are required.")
        return false
      }
      if (unit === "metric" && (!formData.heightCm || !formData.weightKg)) {
        setError("All fields are required.")
        return false
      }
      if (unit === "imperial" && (!formData.heightFt || !formData.weightLbs)) {
        setError("All fields are required.")
        return false
      }
    }
    if (step === 2 && !formData.goalType) {
      setError("Select a training protocol.")
      return false
    }
    return true
  }

  async function handleNext() {
    if (!validate()) return
    if (step < 2) {
      setStep((s) => s + 1)
      return
    }

    setLoading(true)
    const { height, weight } = toMetric(formData, unit)
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          gender: formData.gender,
          age: parseInt(formData.age),
          height,
          weight,
          goalType: formData.goalType,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Registration failed.")
        setLoading(false)
        return
      }
      setDone(true)
    } catch {
      setError("Something went wrong. Try again.")
      setLoading(false)
    }
  }

  const dailyCalories = (() => {
    if (!done || !formData.gender || !formData.age || !formData.goalType) return null
    const { height, weight } = toMetric(formData, unit)
    if (!height || !weight) return null
    return calculateDailyCalories(
      weight,
      height,
      parseInt(formData.age),
      formData.gender as "male" | "female",
      formData.goalType as "lose" | "maintain" | "gain"
    )
  })()

  if (done) {
    return (
      <div className="system-window rounded-lg p-8 w-full max-w-md space-y-6 text-center">
        <div className="space-y-1">
          <p className="system-text text-xs tracking-widest uppercase">System Message</p>
          <h1 className="text-2xl font-bold text-white font-mono">[ AWAKENING COMPLETE ]</h1>
        </div>

        <div className="border border-purple-500/30 rounded p-5 bg-purple-950/20 space-y-4">
          <div className="space-y-1">
            <p className="text-purple-400 font-mono text-xs uppercase tracking-widest">✦ New Hunter Registered ✦</p>
            <p className="text-white font-mono font-bold text-xl">{formData.name}</p>
            <p className="text-gray-500 font-mono text-xs">has awakened as an E-Rank Hunter</p>
          </div>

          {dailyCalories && (
            <div className="border border-amber-900/40 rounded p-3 bg-black/30">
              <p className="text-gray-500 font-mono text-xs mb-1">Daily Calorie Target</p>
              <p className="text-3xl font-bold text-amber-400 font-mono">
                {dailyCalories.toLocaleString()}
              </p>
              <p className="text-gray-600 font-mono text-xs">kcal / day</p>
            </div>
          )}

          <div className="text-gray-500 font-mono text-xs">
            Starting Rank: <span className="rank-E font-bold">E</span>
            &nbsp;·&nbsp;
            XP: <span className="text-white">0</span>
          </div>
        </div>

        <Button className="w-full" onClick={() => router.push("/login")}>
          [ ENTER THE SYSTEM ]
        </Button>
      </div>
    )
  }

  return (
    <div className="system-window rounded-lg p-8 w-full max-w-md space-y-6">
      <div className="text-center space-y-1">
        <p className="system-text text-xs tracking-widest uppercase">System Message</p>
        <h1 className="text-2xl font-bold text-white font-mono">
          [ {STEPS[step].toUpperCase()} ]
        </h1>
        <p className="text-gray-500 text-xs font-mono">Step {step + 1} of 3</p>
      </div>

      <Progress value={((step + 1) / 3) * 100} />

      {/* Step 0 — Account */}
      {step === 0 && (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Hunter Name</Label>
            <Input
              id="name"
              placeholder="Sung Jin-Woo"
              value={formData.name}
              onChange={(e) => update("name", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="hunter@arise.gg"
              value={formData.email}
              onChange={(e) => update("email", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Min. 8 characters"
              value={formData.password}
              onChange={(e) => update("password", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirm">Confirm Password</Label>
            <Input
              id="confirm"
              type="password"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={(e) => update("confirmPassword", e.target.value)}
            />
          </div>
        </div>
      )}

      {/* Step 1 — Physical */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="border border-purple-900/30 rounded p-3 bg-purple-950/10">
            <p className="text-gray-400 text-xs font-mono leading-relaxed">
              The System requires your physical data to calibrate quest difficulty and daily caloric objectives.
            </p>
          </div>

          {/* Unit toggle */}
          <div className="flex rounded border border-purple-900/40 overflow-hidden">
            {(["metric", "imperial"] as const).map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => setUnit(u)}
                className={`flex-1 py-2 font-mono text-xs transition-colors capitalize ${
                  unit === u
                    ? "bg-purple-800/50 text-purple-200"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                {u === "metric" ? "Metric (cm / kg)" : "Imperial (ft / lbs)"}
              </button>
            ))}
          </div>

          <div className="space-y-1.5">
            <Label>Gender</Label>
            <div className="grid grid-cols-2 gap-2">
              {(["male", "female"] as const).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => update("gender", g)}
                  className={`py-2.5 rounded border font-mono text-sm transition-colors ${
                    formData.gender === g
                      ? "border-purple-500 bg-purple-900/40 text-purple-200"
                      : "border-purple-900/40 text-gray-500 hover:border-purple-700/50 hover:text-gray-300"
                  }`}
                >
                  {g === "male" ? "♂ Male" : "♀ Female"}
                </button>
              ))}
            </div>
          </div>

          {unit === "metric" ? (
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  placeholder="25"
                  min="13"
                  max="100"
                  value={formData.age}
                  onChange={(e) => update("age", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="heightCm">Height (cm)</Label>
                <Input
                  id="heightCm"
                  type="number"
                  placeholder="175"
                  value={formData.heightCm}
                  onChange={(e) => update("heightCm", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="weightKg">Weight (kg)</Label>
                <Input
                  id="weightKg"
                  type="number"
                  placeholder="70"
                  value={formData.weightKg}
                  onChange={(e) => update("weightKg", e.target.value)}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    placeholder="25"
                    min="13"
                    max="100"
                    value={formData.age}
                    onChange={(e) => update("age", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="heightFt">Feet</Label>
                  <Input
                    id="heightFt"
                    type="number"
                    placeholder="5"
                    min="1"
                    max="8"
                    value={formData.heightFt}
                    onChange={(e) => update("heightFt", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="heightIn">Inches</Label>
                  <Input
                    id="heightIn"
                    type="number"
                    placeholder="10"
                    min="0"
                    max="11"
                    value={formData.heightIn}
                    onChange={(e) => update("heightIn", e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="weightLbs">Weight (lbs)</Label>
                <Input
                  id="weightLbs"
                  type="number"
                  placeholder="155"
                  value={formData.weightLbs}
                  onChange={(e) => update("weightLbs", e.target.value)}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 2 — Goal */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="border border-purple-900/30 rounded p-3 bg-purple-950/10">
            <p className="text-gray-400 text-xs font-mono leading-relaxed">
              Select your training protocol. The System will assign dungeon quests accordingly.
            </p>
          </div>

          <div className="space-y-2">
            {(
              [
                { value: "lose", label: "[ WEIGHT LOSS ]", desc: "Intense dungeon training. −500 kcal daily deficit.", icon: "🔥" },
                { value: "maintain", label: "[ MAINTAIN ]", desc: "Peak performance. Balanced energy intake.", icon: "⚔️" },
                { value: "gain", label: "[ MUSCLE GAIN ]", desc: "Build mass and power. +300 kcal daily surplus.", icon: "💪" },
              ] as const
            ).map((goal) => (
              <button
                key={goal.value}
                type="button"
                onClick={() => update("goalType", goal.value)}
                className={`w-full text-left p-4 rounded border transition-colors ${
                  formData.goalType === goal.value
                    ? "border-purple-500 bg-purple-900/30 text-white"
                    : "border-purple-900/40 text-gray-400 hover:border-purple-700/50 hover:text-gray-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{goal.icon}</span>
                  <div>
                    <p className="font-mono font-semibold text-sm">{goal.label}</p>
                    <p className="text-xs font-mono text-gray-500 mt-0.5">{goal.desc}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {error && (
        <p className="text-red-400 text-xs font-mono text-center border border-red-900/50 rounded p-2 bg-red-950/20">
          ⚠ {error}
        </p>
      )}

      <div className="flex items-center justify-between">
        {step > 0 ? (
          <button
            type="button"
            onClick={() => { setError(""); setStep((s) => s - 1) }}
            className="text-gray-500 hover:text-gray-300 font-mono text-xs transition-colors"
          >
            ← Back
          </button>
        ) : (
          <Link href="/login" className="text-gray-500 hover:text-gray-300 font-mono text-xs transition-colors">
            ← Login
          </Link>
        )}
        <Button onClick={handleNext} disabled={loading}>
          {loading ? "[ PROCESSING... ]" : step === 2 ? "[ AWAKEN ]" : "[ NEXT ]"}
        </Button>
      </div>
    </div>
  )
}
