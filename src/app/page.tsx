import Link from "next/link"

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
      <div className="system-window rounded-lg p-8 max-w-md w-full text-center space-y-6">
        <div className="space-y-2">
          <p className="system-text text-xs tracking-widest uppercase">
            System Message
          </p>
          <h1 className="text-5xl font-bold text-white tracking-tight font-mono">
            A·R·I·S·E
          </h1>
          <p className="text-purple-400 font-mono text-sm">
            [ Solo Leveling Health System ]
          </p>
        </div>

        <div className="border border-purple-900/50 rounded p-4 bg-purple-950/20">
          <p className="text-gray-300 text-sm font-mono leading-relaxed">
            &quot;I alone level up.&quot;
          </p>
          <p className="text-gray-500 text-xs mt-2 font-mono">— Sung Jin-Woo</p>
        </div>

        <div className="flex flex-col gap-3">
          <Link
            href="/register"
            className="block w-full py-3 px-6 bg-purple-700 hover:bg-purple-600 text-white font-mono font-semibold rounded transition-colors tracking-wider animate-system-glow"
          >
            [ BEGIN YOUR JOURNEY ]
          </Link>
          <Link
            href="/login"
            className="block w-full py-3 px-6 border border-purple-700/50 hover:border-purple-500 text-purple-300 font-mono text-sm rounded transition-colors"
          >
            [ CONTINUE ]
          </Link>
        </div>
      </div>
    </main>
  )
}
