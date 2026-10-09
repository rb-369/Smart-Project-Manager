import 'package:flutter/material.dart';
import 'package:percent_indicator/circular_percent_indicator.dart';
import '../core/api_client.dart';
import '../core/theme.dart';
import '../models/project_model.dart';
import 'project_detail_screen.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  final _dio = ApiClient.createDio();
  List<ProjectSummary> _projects = [];
  bool _isLoading = true;
  String _selectedFilter = 'ALL';

  @override
  void initState() {
    super.initState();
    _fetchProjects();
  }

  Future<void> _fetchProjects() async {
    try {
      setState(() => _isLoading = true);
      final resp = await _dio.get('/projects');
      if (resp.statusCode == 200) {
        final List data = resp.data;
        setState(() {
          _projects = data.map((j) => ProjectSummary.fromJson(j)).toList();
        });
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to load projects: $e')),
      );
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Future<void> _syncGitHub() async {
    try {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Syncing GitHub repositories...')),
      );
      final resp = await _dio.post('/github/sync');
      if (resp.statusCode == 200) {
        final count = resp.data['new_repos_imported'] ?? 0;
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Sync complete! $count new repos imported.')),
        );
        _fetchProjects();
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Sync failed: $e')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final needsReview = _projects.where((p) => p.needsReview).toList();
    final activeCount = _projects.where((p) => p.status == 'IN_PROGRESS').length;
    final avgProgress = _projects.isNotEmpty
        ? (_projects.fold<int>(0, (acc, p) => acc + p.progressPercentage) / _projects.length).round()
        : 0;

    final filtered = _projects.where((p) {
      if (_selectedFilter == 'ALL') return true;
      return p.projectType == _selectedFilter;
    }).toList();

    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            Container(
              width: 24,
              height: 24,
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [AppTheme.primary, AppTheme.accent],
                ),
                borderRadius: BorderRadius.circular(6),
              ),
              alignment: Alignment.center,
              child: const Text(
                'DC',
                style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.white),
              ),
            ),
            const SizedBox(width: 8),
            const Text('DevCommand'),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.sync, size: 20, color: AppTheme.accent),
            tooltip: 'Sync GitHub',
            onPressed: _syncGitHub,
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          await _syncGitHub();
          await _fetchProjects();
        },
        child: _isLoading
            ? const Center(child: CircularProgressIndicator(strokeWidth: 2))
            : ListView(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                children: [
                  // Top Bento Pulse Card with Live Gradient Accent
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: AppTheme.surface,
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: const Color(0x1FFFFFFF)),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.3),
                          blurRadius: 16,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text(
                              'ENGINEERING PULSE',
                              style: TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.w700,
                                color: Color(0xFF818CF8),
                                letterSpacing: 0.8,
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                              decoration: BoxDecoration(
                                color: AppTheme.prodColor.withValues(alpha: 0.15),
                                borderRadius: BorderRadius.circular(99),
                                border: Border.all(color: AppTheme.prodColor.withValues(alpha: 0.3)),
                              ),
                              child: const Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(Icons.circle, size: 6, color: AppTheme.prodColor),
                                  SizedBox(width: 4),
                                  Text(
                                    'Live',
                                    style: TextStyle(
                                      fontSize: 10,
                                      fontWeight: FontWeight.bold,
                                      color: AppTheme.prodColor,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 10),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  '$avgProgress%',
                                  style: const TextStyle(
                                    fontSize: 28,
                                    fontWeight: FontWeight.w900,
                                    color: Colors.white,
                                    letterSpacing: -0.5,
                                  ),
                                ),
                                const Text(
                                  'velocity milestone rate',
                                  style: TextStyle(fontSize: 11, color: Color(0xFF94A3B8)),
                                ),
                              ],
                            ),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.end,
                              children: [
                                Text(
                                  '${_projects.length} Repos',
                                  style: const TextStyle(
                                    fontSize: 15,
                                    fontWeight: FontWeight.w700,
                                    color: Colors.white,
                                  ),
                                ),
                                Text(
                                  '$activeCount active in progress',
                                  style: const TextStyle(fontSize: 11, color: Color(0xFF818CF8)),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 12),

                  // Actionable Triage Notification if repos need review
                  if (needsReview.isNotEmpty) ...[
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: const Color(0xFF191614),
                        border: Border.all(color: AppTheme.p1Color.withValues(alpha: 0.4)),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              const Icon(Icons.auto_awesome, color: AppTheme.p1Color, size: 16),
                              const SizedBox(width: 6),
                              Text(
                                '${needsReview.length} newly synced ${needsReview.length == 1 ? 'repo requires' : 'repos require'} triage',
                                style: const TextStyle(
                                  fontWeight: FontWeight.w700,
                                  color: Color(0xFFFDE68A),
                                  fontSize: 12,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Wrap(
                            spacing: 6,
                            runSpacing: 4,
                            children: needsReview.map((p) {
                              return ActionChip(
                                label: Text(
                                  p.name,
                                  style: const TextStyle(fontSize: 11, color: Colors.white),
                                ),
                                backgroundColor: AppTheme.surfaceRaised,
                                side: const BorderSide(color: Color(0xFF333852)),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                onPressed: () {
                                  Navigator.push(
                                    context,
                                    MaterialPageRoute(
                                      builder: (_) => ProjectDetailScreen(projectId: p.id),
                                    ),
                                  ).then((_) => _fetchProjects());
                                },
                              );
                            }).toList(),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 12),
                  ],

                  // Segmented Category Filter with Holographic Highlight
                  SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: Row(
                      children: ['ALL', 'COLLEGE', 'RESUME', 'PRODUCTION'].map((f) {
                        final isSel = _selectedFilter == f;
                        final label = f == 'ALL' ? 'All Projects' : f[0] + f.substring(1).toLowerCase();
                        return Padding(
                          padding: const EdgeInsets.only(right: 6),
                          child: InkWell(
                            borderRadius: BorderRadius.circular(8),
                            onTap: () => setState(() => _selectedFilter = f),
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
                              decoration: BoxDecoration(
                                color: isSel ? const Color(0xFF1E2235) : AppTheme.surface,
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(
                                  color: isSel ? const Color(0xFF6366F1) : const Color(0x1FFFFFFF),
                                ),
                              ),
                              child: Text(
                                label,
                                style: TextStyle(
                                  color: isSel ? Colors.white : const Color(0xFF94A3B8),
                                  fontWeight: isSel ? FontWeight.w700 : FontWeight.w500,
                                  fontSize: 12,
                                ),
                              ),
                            ),
                          ),
                        );
                      }).toList(),
                    ),
                  ),
                  const SizedBox(height: 12),

                  // Project Cards
                  if (filtered.isEmpty)
                    Container(
                      padding: const EdgeInsets.all(40),
                      alignment: Alignment.center,
                      child: const Text(
                        'No repositories match this category',
                        style: TextStyle(color: Color(0xFF64748B), fontSize: 13),
                      ),
                    )
                  else
                    ...filtered.map((p) => _buildProjectCard(p)),
                ],
              ),
      ),
    );
  }

  Widget _buildProjectCard(ProjectSummary p) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: InkWell(
        borderRadius: BorderRadius.circular(14),
        onTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (_) => ProjectDetailScreen(projectId: p.id),
            ),
          ).then((_) => _fetchProjects());
        },
        child: Padding(
          padding: const EdgeInsets.all(15),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                              decoration: BoxDecoration(
                                color: const Color(0x1FFFFFFF),
                                borderRadius: BorderRadius.circular(5),
                              ),
                              child: Text(
                                p.projectType,
                                style: const TextStyle(
                                  color: Color(0xFFA5B4FC),
                                  fontSize: 10,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                            ),
                            if (p.primaryLanguage != null) ...[
                              const SizedBox(width: 8),
                              Text(
                                p.primaryLanguage!,
                                style: const TextStyle(fontSize: 11, color: Color(0xFF94A3B8)),
                              ),
                            ],
                          ],
                        ),
                        const SizedBox(height: 6),
                        Text(
                          p.name,
                          style: const TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w700,
                            color: Colors.white,
                            letterSpacing: -0.2,
                          ),
                        ),
                      ],
                    ),
                  ),
                  CircularPercentIndicator(
                    radius: 20.0,
                    lineWidth: 3.5,
                    percent: (p.progressPercentage / 100.0).clamp(0.0, 1.0),
                    center: Text(
                      '${p.progressPercentage}%',
                      style: const TextStyle(fontSize: 9, fontWeight: FontWeight.bold),
                    ),
                    progressColor: p.progressPercentage == 100 ? AppTheme.prodColor : AppTheme.primary,
                    backgroundColor: const Color(0xFF171A27),
                  ),
                ],
              ),
              if (p.goal != null) ...[
                const SizedBox(height: 6),
                Text(
                  p.goal!,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(fontSize: 12, color: Color(0xFFCBD5E1)),
                ),
              ],
              const SizedBox(height: 10),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    '${p.completedFeatures}/${p.totalFeatures} completed',
                    style: const TextStyle(fontSize: 11, color: Color(0xFF64748B)),
                  ),
                  const Icon(Icons.arrow_forward, size: 14, color: Color(0xFF818CF8)),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
