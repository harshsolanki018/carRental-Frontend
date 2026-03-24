module.exports = {
  content: [
    "./src/**/*.{html,ts}"
  ],
  theme: {
    extend: {
// tailwind.config.js (confirm these exist)
colors: {
  primary: '#111827',   // near-black header/footer
  accent: '#F97316',    // orange CTA
  background: '#FFFFFF',
  muted: '#6B7280',
  section: '#F9FAFB',
}

    }
  },
  plugins: [],
}
