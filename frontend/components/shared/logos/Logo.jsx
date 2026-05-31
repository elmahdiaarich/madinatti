export default function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg"
        style={{
          background:
            "linear-gradient(135deg, var(--color-primary), var(--color-primary-sage))",
        }}
      >
        <svg
          className="w-8 h-8 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
          />
        </svg>
      </div>

      <span className="text-2xl font-bold">
        <span style={{ color: "var(--forest-green)" }}>Madin</span>
        <span style={{ color: "var(--color-primary-dark)" }}>atti</span>
      </span>
    </div>
  );
}
