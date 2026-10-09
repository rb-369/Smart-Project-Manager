import 'package:flutter/material.dart';

class AppTheme {
  // High-End Bento Glass & Holographic Palette
  static const Color background = Color(0xFF08090D); // Deep titanium void
  static const Color surface = Color(0xFF0E1017);    // Dark glass surface
  static const Color card = Color(0xFF0E1017);       // Bento card
  static const Color surfaceRaised = Color(0xFF141724);
  static const Color border = Color(0xFF222638);     // Subtle hairline border
  static const Color borderLight = Color(0xFF333852);

  static const Color primary = Color(0xFF6366F1);    // Holographic indigo
  static const Color primaryLight = Color(0xFF818CF8);
  static const Color accent = Color(0xFF38BDF8);     // Electric sky

  // Semantic Priority Colors
  static const Color p0Color = Color(0xFFF43F5E);    // Luminous Rose
  static const Color p1Color = Color(0xFFF59E0B);    // Luminous Amber
  static const Color p2Color = Color(0xFF38BDF8);    // Luminous Sky
  static const Color p3Color = Color(0xFF64748B);    // Slate

  // Status & Project Type Colors
  static const Color collegeColor = Color(0xFFA855F7);
  static const Color resumeColor = Color(0xFF38BDF8);
  static const Color prodColor = Color(0xFF10B981);

  static ThemeData get darkTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      scaffoldBackgroundColor: background,
      colorScheme: const ColorScheme.dark(
        primary: primary,
        secondary: accent,
        surface: surface,
        error: p0Color,
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: background,
        elevation: 0,
        centerTitle: false,
        titleTextStyle: TextStyle(
          color: Colors.white,
          fontSize: 17,
          fontWeight: FontWeight.w700,
          letterSpacing: -0.3,
        ),
      ),
      cardTheme: CardThemeData(
        color: card,
        elevation: 0,
        shape: RoundedRectangleBorder(
          side: const BorderSide(color: Color(0x1FFFFFFF), width: 1),
          borderRadius: BorderRadius.circular(14),
        ),
      ),
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: Color(0xFF0A0C13),
        selectedItemColor: Color(0xFF818CF8),
        unselectedItemColor: Color(0xFF64748B),
        elevation: 0,
        type: BottomNavigationBarType.fixed,
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primary,
          foregroundColor: Colors.white,
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(10),
          ),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        ),
      ),
    );
  }
}
