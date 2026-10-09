import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/theme.dart';
import 'package:mobile/models/project_model.dart';

void main() {
  group('DevCommand Models Unit Tests', () {
    test('ProjectSummary deserializes correctly from JSON with defaults', () {
      final json = {
        'id': 'proj-123',
        'name': 'DevCommand',
        'description': 'Personal project manager with AI',
        'html_url': 'https://github.com/developer/devcommand',
        'primary_language': 'Dart',
        'project_type': 'RESUME',
        'status': 'IN_PROGRESS',
        'progress_percentage': 85,
        'total_features': 10,
        'completed_features': 8,
        'stars_count': 42,
        'needs_review': true,
      };

      final project = ProjectSummary.fromJson(json);

      expect(project.id, 'proj-123');
      expect(project.name, 'DevCommand');
      expect(project.progressPercentage, 85);
      expect(project.needsReview, isTrue);
      expect(project.totalFeatures, 10);
      expect(project.completedFeatures, 8);
      expect(project.starsCount, 42);
      expect(project.primaryLanguage, 'Dart');
    });

    test('FeatureItem parses priority and status correctly', () {
      final json = {
        'id': 'feat-1',
        'project_id': 'proj-123',
        'title': 'AI Feature Breakdown with Multi-tier fallback',
        'priority': 'P0',
        'status': 'DONE',
        'order_index': 0,
      };

      final feat = FeatureItem.fromJson(json);
      expect(feat.title, 'AI Feature Breakdown with Multi-tier fallback');
      expect(feat.priority, 'P0');
      expect(feat.status, 'DONE');
      expect(feat.orderIndex, 0);
    });

    test('FutureProjectItem incubator model handles nulls gracefully', () {
      final json = {
        'id': 'idea-1',
        'title': 'Autonomous Coding Agent',
        'priority': 'P1',
        'status': 'IDEA',
      };

      final idea = FutureProjectItem.fromJson(json);
      expect(idea.title, 'Autonomous Coding Agent');
      expect(idea.priority, 'P1');
      expect(idea.elevatorPitch, isNull);
      expect(idea.projectType, 'RESUME');
      expect(idea.status, 'IDEA');
    });
  });

  group('DevCommand App UI & Theme Smoke Tests', () {
    testWidgets('AppTheme configures dark mode colors and typography accurately', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          theme: AppTheme.darkTheme,
          home: const Scaffold(
            body: Center(
              child: Text(
                'DevCommand Dark Theme',
                style: TextStyle(color: Colors.white),
              ),
            ),
          ),
        ),
      );

      expect(find.text('DevCommand Dark Theme'), findsOneWidget);
      final theme = Theme.of(tester.element(find.text('DevCommand Dark Theme')));
      expect(theme.scaffoldBackgroundColor, AppTheme.background);
      expect(theme.brightness, Brightness.dark);
    });

    testWidgets('Priority badges and status indicators render correctly', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          theme: AppTheme.darkTheme,
          home: Scaffold(
            body: Column(
              children: [
                Container(
                  color: AppTheme.p0Color,
                  child: const Text('P0 Urgency'),
                ),
                Container(
                  color: AppTheme.accent,
                  child: const Text('Sky Accent'),
                ),
                Container(
                  color: AppTheme.collegeColor,
                  child: const Text('College Project'),
                ),
              ],
            ),
          ),
        ),
      );

      expect(find.text('P0 Urgency'), findsOneWidget);
      expect(find.text('Sky Accent'), findsOneWidget);
      expect(find.text('College Project'), findsOneWidget);
    });
  });
}
