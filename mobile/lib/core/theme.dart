import 'package:flutter/material.dart';

class AppTheme {
  // Ultra-Luxury Liquid Glassmorphism Palette
  static const Color background = Color(0xFF050508); // OLED void black
  static const Color surface = Color(0xFF0A0C13);    // Deep glass surface
  static const Color card = Color(0x14FFFFFF);       // Translucent frosted glass pane
  static const Color surfaceRaised = Color(0xFF121420);
  static const Color border = Color(0x22FFFFFF);     // Specular glass hairline border
  static const Color borderLight = Color(0x35FFFFFF);

  static const Color primary = Color(0xFF8B5CF6);    // Luminous Violet
  static const Color primaryLight = Color(0xFFA78BFA);
  static const Color accent = Color(0xFF06B6D4);     // Luminous Cyan
  static const Color glowEmerald = Color(0xFF10B981); // Luminous Emerald
  static const Color glowAmber = Color(0xFFF59E0B);
  static const Color glowRose = Color(0xFFF43F5E);

  // Semantic Priority Colors
  static const Color p0Color = Color(0xFFF43F5E);    // Luminous Rose
  static const Color p1Color = Color(0xFFF59E0B);    // Luminous Amber
  static const Color p2Color = Color(0xFF06B6D4);    // Luminous Cyan
  static const Color p3Color = Color(0xFF64748B);    // Slate

  // Status & Project Type Colors
  static const Color collegeColor = Color(0xFFA855F7);
  static const Color resumeColor = Color(0xFF06B6D4);
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
          side: const BorderSide(color: Color(0x24FFFFFF), width: 1),
          borderRadius: BorderRadius.circular(20),
        ),
      ),
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: Color(0xFF07080E),
        selectedItemColor: Color(0xFFA78BFA),
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
            borderRadius: BorderRadius.circular(9999),
          ),
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
        ),
      ),
    );
  }
}

