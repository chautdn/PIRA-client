/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#EAF6F0",
          100: "#D5EDE1",
          200: "#B4E0C9",
          300: "#8FD2B0",
          400: "#61C293",
          500: "#008B52", // brand green
          600: "#007A49",
          700: "#006C36", // deep brand green
          800: "#075C3D",
          900: "#064032",
        },
        secondary: {
          700: "#006C36",
          600: "#008B52",
        }
      },
    },
  },
  plugins: [],
};
