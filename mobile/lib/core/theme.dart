import 'package:flutter/material.dart';

class AppTheme {
  static const Color background = Color(0xFF0F172A); // slate-900
  static const Color surface = Color(0xFF1E293B);    // slate-800
  static const Color card = Color(0xFF1E293B);       // slate-800
  static const Color border = Color(0xFF334155);     // slate-700
  
  static const Color primary = Color(0xFF6366F1);    // indigo-500
  static const Color primaryLight = Color(0xFF818CF8);
  static const Color accent = Color(0xFF38BDF8);     // sky-400

  // Priority Colors
  static const Color p0Color = Color(0xFFEF4444);    // red-500
  static const Color p1Color = Color(0xFFF59E0B);    // amber-500
  static const Color p2Color = Color(0xFF3B82F6);    // blue-500
  static const Color p3Color = Color(0xFF64748B);    // slate-500

  // Status & Project Type Colors
  static const Color collegeColor = Color(0xFFA855F7); // purple-500
  static const Color resumeColor = Color(0xFF06B6D4);  // cyan-500
  static const Color prodColor = Color(0xFF10B981);    // emerald-500

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
        backgroundColor: surface,
        elevation: 0,
        centerTitle: false,
        titleTextStyle: TextStyle(
          color: Colors.white,
          fontSize: 20,
          fontWeight: FontWeight.bold,
        ),
      ),
      cardTheme: CardThemeData(
        color: card,
        elevation: 2,
        shape: RoundedRectangleBorder(
          side: const BorderSide(color: border, width: 1),
          borderRadius: BorderRadius.circular(14),
        ),
      ),
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: surface,
        selectedItemColor: primaryLight,
        unselectedItemColor: Color(0xFF94A3B8),
        elevation: 8,
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primary,
          foregroundColor: Colors.white,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(10),
          ),
          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
        ),
      ),
    );
  }
}
