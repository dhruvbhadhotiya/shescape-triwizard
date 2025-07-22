export const Colors = {
  light: {
    background: "#ffffff",
    text: "#222222",
    icon: "#FF416C",
    tint: "#FF416C",
    tabBar: "#ffffff",  // ✅ Added
    tabBarBorder: "#eee",  // ✅ Added
  },
  dark: {
    background: "#121212",
    text: "#ffffff",
    icon: "#FF4B2B",
    tint: "#FF4B2B",
    tabBar: "#1a1a1a",  // ✅ Added
    tabBarBorder: "#333",  // ✅ Added
  },
};

// ✅ Define TypeScript Type
export type ColorKeys = keyof typeof Colors.light & keyof typeof Colors.dark;
