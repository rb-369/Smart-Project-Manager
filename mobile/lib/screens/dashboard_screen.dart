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
              width: 28,
              height: 28,
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [AppTheme.primary, AppTheme.accent],
                ),
                borderRadius: BorderRadius.circular(8),
                boxShadow: [
                  BoxShadow(
                    color: AppTheme.primary.withValues(alpha: 0.4),
                    blurRadius: 10,
                  ),
                ],
              ),
              alignment: Alignment.center,
              child: const Text(
                'DC',
                style: TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: Colors.white),
              ),
            ),
            const SizedBox(width: 10),
            const Text(
              'DevCommand',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, letterSpacing: -0.3),
            ),
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
            ? const Center(child: CircularProgressIndicator(strokeWidth: 2, color: AppTheme.accent))
            : ListView(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                children: [
                  // Top Liquid Glass Pulse Card
                  Container(
                    padding: const EdgeInsets.all(1.5),
                    decoration: BoxDecoration(
                      color: const Color(0x10FFFFFF),
                      borderRadius: BorderRadius.circular(24),
                      border: Border.all(color: const Color(0x1EFFFFFF)),
                    ),
                    child: Container(
                      padding: const EdgeInsets.all(18),
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [Color(0x1FFFFFFF), Color(0x0AFFFFFF)],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        borderRadius: BorderRadius.circular(22),
                        border: Border.all(color: const Color(0x28FFFFFF)),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              const Row(
                                children: [
                                  Icon(Icons.auto_awesome, size: 14, color: AppTheme.accent),
                                  SizedBox(width: 6),
                                  Text(
                                    'ENGINEERING PULSE',
                                    style: TextStyle(
                                      fontSize: 10,
                                      fontWeight: FontWeight.w700,
                                      color: Color(0xFFA78BFA),
                                      letterSpacing: 0.8,
                                    ),
                                  ),
                                ],
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                decoration: BoxDecoration(
                                  color: AppTheme.glowEmerald.withValues(alpha: 0.15),
                                  borderRadius: BorderRadius.circular(99),
                                  border: Border.all(color: AppTheme.glowEmerald.withValues(alpha: 0.35)),
                                ),
                                child: const Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Icon(Icons.circle, size: 6, color: AppTheme.glowEmerald),
                                    SizedBox(width: 4),
                                    Text(
                                      'Live',
                                      style: TextStyle(
                                        fontSize: 10,
                                        fontWeight: FontWeight.bold,
                                        color: AppTheme.glowEmerald,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 14),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    '$avgProgress%',
                                    style: const TextStyle(
                                      fontSize: 32,
                                      fontWeight: FontWeight.w900,
                                      color: Colors.white,
                                      letterSpacing: -0.5,
                                    ),
                                  ),
                                  Text(
                                    'sprint velocity • $activeCount active repos',
                                    style: const TextStyle(fontSize: 11, color: Color(0xFF94A3B8)),
                                  ),
                                ],
                              ),
                              CircularPercentIndicator(
                                radius: 26.0,
                                lineWidth: 4.5,
                                percent: (avgProgress / 100.0).clamp(0.0, 1.0),
                                center: Text(
                                  '$avgProgress%',
                                  style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.white),
                                ),
                                progressColor: AppTheme.accent,
                                backgroundColor: const Color(0x22FFFFFF),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 14),

                  // Actionable Triage Notification if repos need review
                  if (needsReview.isNotEmpty) ...[
                    Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: const Color(0x18F59E0B),
                        border: Border.all(color: AppTheme.p1Color.withValues(alpha: 0.4)),
                        borderRadius: BorderRadius.circular(16),
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
                                backgroundColor: const Color(0x25FFFFFF),
                                side: const BorderSide(color: Color(0x35FFFFFF)),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(99)),
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
                    const SizedBox(height: 14),
                  ],

                  // Segmented Category Filter with Liquid Glass Pills
                  SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: Row(
                      children: ['ALL', 'COLLEGE', 'RESUME', 'PRODUCTION'].map((f) {
                        final isSel = _selectedFilter == f;
                        final label = f == 'ALL' ? 'All Projects' : f[0] + f.substring(1).toLowerCase();
                        return Padding(
                          padding: const EdgeInsets.only(right: 8),
                          child: InkWell(
                            borderRadius: BorderRadius.circular(99),
                            onTap: () => setState(() => _selectedFilter = f),
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                              decoration: BoxDecoration(
                                color: isSel ? const Color(0x2E8B5CF6) : const Color(0x0CFFFFFF),
                                borderRadius: BorderRadius.circular(99),
                                border: Border.all(
                                  color: isSel ? const Color(0x808B5CF6) : const Color(0x18FFFFFF),
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
                  const SizedBox(height: 14),

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
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(1.5),
      decoration: BoxDecoration(
        color: const Color(0x10FFFFFF),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0x1CFFFFFF)),
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(18),
        onTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (_) => ProjectDetailScreen(projectId: p.id),
            ),
          ).then((_) => _fetchProjects());
        },
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [Color(0x1AFFFFFF), Color(0x08FFFFFF)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: const Color(0x22FFFFFF)),
          ),
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
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2.5),
                              decoration: BoxDecoration(
                                color: const Color(0x1EFFFFFF),
                                borderRadius: BorderRadius.circular(99),
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
                      style: const TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Colors.white),
                    ),
                    progressColor: p.progressPercentage == 100 ? AppTheme.prodColor : AppTheme.accent,
                    backgroundColor: const Color(0x22FFFFFF),
                  ),
                ],
              ),
              if (p.goal != null) ...[
                const SizedBox(height: 8),
                Text(
                  p.goal!,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(fontSize: 12, color: Color(0xFFCBD5E1), height: 1.3),
                ),
              ],
              const SizedBox(height: 12),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    '${p.completedFeatures}/${p.totalFeatures} completed',
                    style: const TextStyle(fontSize: 11, color: Color(0xFF64748B)),
                  ),
                  const Icon(Icons.arrow_forward, size: 14, color: AppTheme.accent),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

