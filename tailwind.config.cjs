/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1d2a37",
        mist: "#e9eef3",
        brass: "#b8864a",
        paper: "#f6f1e7",
        tide: "#315f8f",
        pine: "#2f6b57",
        ember: "#b4584a"
      },
      fontFamily: {
        display: ["Fraunces", "Iowan Old Style", "Georgia", "serif"],
        sans: ["Avenir Next", "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Noto Sans SC", "sans-serif"]
      },
      boxShadow: {
        panel: "0 24px 60px rgba(24, 35, 52, 0.12)",
        board: "0 26px 70px rgba(29, 42, 55, 0.18)"
      },
      keyframes: {
        rise: {
          "0%": { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        },
        pulseSoft: {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.02)" }
        }
      },
      animation: {
        rise: "rise 420ms ease-out both",
        "pulse-soft": "pulseSoft 1.8s ease-in-out infinite"
      }
    }
  },
  plugins: []
};
