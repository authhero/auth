/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "media",
  theme: {
    screens: {
      sm: "640px", // old sm: "768px",
      md: "1280px", // old md: "1024px",
      lg: "1920px", // old lg: "1280px",
      xl: "1920px", // same as lg, old xl: "1520px",
      "2xl": "1920px", // same as lg, old "2xl": "1920px",
    },
    colors: {
      primary: "#7D68F4",
      primaryHover: "#7e69f4",
      secondary: "#D0EE25",
      textOnPrimary: "#ffffff",
      black: "#000000",
      white: "#ffffff",
      gray: {
        100: "#f8f9fb",
        200: "#BFBCD7",
        300: "#88869F",
        400: "#4b4a58",
        500: "#3b3946",
        600: "#282834",
        700: "#1E1E27",
        800: "#14141A",
        900: "#08080E",
      },
      purple: {
        100: "#eceafd",
        200: "#dad4fc",
        300: "#c7bffa",
        400: "#B5A9F9",
        500: "#A394F7",
        600: "#907EF6",
        700: "#7E69F4",
        800: "#6B53F3",
      },
      pear: {
        100: "#000000",
        200: "#cddf65",
        300: "#C3DF25",
      },
      yellow: "#F3BB53",
      red: "#FC5A5A",
      green: "#36BF76",
      // Charts and data vizualization colors
      lime: "#C3DF25",
      olive: "#6EEA92",
      orange: "#EE7B30",
      crimson: "#F3538B",
      pink: "#E9A8E8",
      baby: "#6CE9FC",
    },
    extend: {
      maxWidth: {
        wide: "1680px",
      },
      fontFamily: {
        sans: [
          '"KHTeka"',
          '"Helvetica Neue"',
          "HelveticaNeue",
          '"TeX Gyre Heros"',
          "TeXGyreHeros",
          "FreeSans",
          '"Nimbus Sans L"',
          '"Liberation Sans"',
          "Arimo",
          "Helvetica",
          "sans-serif",
        ],
      },
      fontSize: {
        xs: [
          "0.75rem",
          {
            lineHeight: "135%",
          },
        ], // 12px
        sm: [
          "0.875rem",
          {
            lineHeight: "120%",
          },
        ], // 14px
        base: [
          "1rem",
          {
            lineHeight: "120%",
          },
        ], // 16px | 0.0625rem per px unit
        lg: [
          "1.125rem",
          {
            lineHeight: "120%",
          },
        ], // 18px
        xl: [
          "1.25rem",
          {
            lineHeight: "120%",
          },
        ], // 20px
        "2xl": [
          "1.5rem",
          {
            lineHeight: "120%",
          },
        ], // 24px
        "3xl": [
          "2rem",
          {
            lineHeight: "120%",
          },
        ], // 32px
        "4xl": [
          "3rem",
          {
            lineHeight: "100%",
            letterSpacing: "-0.0625rem",
          },
        ], // 48px
        "5xl": [
          "3.5rem",
          {
            lineHeight: "100%",
            letterSpacing: "-0.0625rem",
          },
        ], // 56px
        "6xl": [
          "5.125rem",
          {
            lineHeight: "100%",
            letterSpacing: "-0.125rem",
          },
        ], // 82px
        "7xl": [
          "5.625rem",
          {
            lineHeight: "100%",
            letterSpacing: "-0.125rem",
          },
        ], // 90px
      },
      lineHeight: {
        currency: "144px",
      },
      boxShadow: {
        card: "0px 2px 3px -1px rgb(213 213 213)",
      },
      borderRadius: {
        sm: "0.1875rem",
        lg: "0.625rem",
        "2xl": "1.25rem",
      },
      letterSpacing: {
        sm: "0.02em",
      },
    },
  },
};
