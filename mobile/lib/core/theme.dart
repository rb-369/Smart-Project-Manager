import 'package:flutter/material.dart';

class AppTheme {
  // Obsidian & Graphite Precision Palette
  static const Color background = Color(0xFF090A0F); // Deep obsidian
  static const Color surface = Color(0xFF111218);    // Graphite surface
  static const Color card = Color(0xFF111218);       // Card background
  static const Color surfaceRaised = Color(0xFF181A24);
  static const Color border = Color(0xFF222433);     // 1px Hairline border
  static const Color borderSubtle = Color(0xFF191B26);

  static const Color primary = Color(0xFF3B82F6);    // Precision blue
  static const Color primaryLight = Color(0xFF60A5FA);
  static const Color accent = Color(0xFF60A5FA);

  // Semantic Priority Colors
  static const Color p0Color = Color(0xFFF43F5E);    // Rose / Vermillion
  static const Color p1Color = Color(0xFFF59E0B);    // Amber
  static const Color p2Color = Color(0xFF3B82F6);    // Blue
  static const Color p3Color = Color(0xFF64748B);    // Slate

  // Status & Project Type Colors
  static const Color collegeColor = Color(0xFF8B5CF6);
  static const Color resumeColor = Color(0xFF0EA5E9);
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
          color: Color(0xFFF4F4F7),
          fontSize: 16,
          fontWeight: FontWeight.w600,
          letterSpacing: -0.2,
        ),
      ),
      cardTheme: CardThemeData(
        color: card,
        elevation: 0,
        shape: RoundedRectangleBorder(
          side: const BorderSide(color: border, width: 1),
          borderRadius: BorderRadius.circular(10),
        ),
      ),
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: background,
        selectedItemColor: Color(0xFFF4F4F7),
        unselectedItemColor: Color(0xFF64687A),
        elevation: 0,
        type: BottomNavigationBarType.fixed,
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primary,
          foregroundColor: Colors.white,
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
          ),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        ),
      ),
    );
  }
}
