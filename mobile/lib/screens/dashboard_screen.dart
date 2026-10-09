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
        SnackBar(content: Text('Sync error: $e. Check GitHub PAT in settings.')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final filtered = _projects.where((p) {
      if (_selectedFilter == 'ALL') return true;
      return p.projectType == _selectedFilter;
    }).toList();

    final needsReview = _projects.where((p) => p.needsReview).toList();

    return Scaffold(
      appBar: AppBar(
        title: const Text('DevCommand'),
        actions: [
          IconButton(
            icon: const Icon(Icons.sync, color: AppTheme.accent),
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
            ? const Center(child: CircularProgressIndicator())
            : ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  // Metrics Row
                  Row(
                    children: [
                      _buildStatCard('Total', _projects.length.toString(), Icons.folder, AppTheme.primary),
                      const SizedBox(width: 8),
                      _buildStatCard(
                        'Active',
                        _projects.where((p) => p.status == 'IN_PROGRESS').length.toString(),
                        Icons.timelapse,
                        AppTheme.accent,
                      ),
                      const SizedBox(width: 8),
                      _buildStatCard(
                        'Review',
                        needsReview.length.toString(),
                        Icons.auto_awesome,
                        AppTheme.p1Color,
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // Needs Review Banner if any
                  if (needsReview.isNotEmpty) ...[
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: AppTheme.p1Color.withValues(alpha: 0.15),
                        border: Border.all(color: AppTheme.p1Color.withValues(alpha: 0.4)),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              const Icon(Icons.warning_amber_rounded, color: AppTheme.p1Color, size: 18),
                              const SizedBox(width: 6),
                              Text(
                                '${needsReview.length} Repositories Need Review',
                                style: const TextStyle(
                                  fontWeight: FontWeight.bold,
                                  color: AppTheme.p1Color,
                                  fontSize: 13,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 6),
                          Wrap(
                            spacing: 6,
                            children: needsReview.map((p) {
                              return ActionChip(
                                label: Text(p.name, style: const TextStyle(fontSize: 11)),
                                backgroundColor: AppTheme.surface,
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
                    const SizedBox(height: 16),
                  ],

                  // Filter Chips
                  SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: Row(
                      children: ['ALL', 'COLLEGE', 'RESUME', 'PRODUCTION'].map((f) {
                        final isSel = _selectedFilter == f;
                        return Padding(
                          padding: const EdgeInsets.only(right: 8),
                          child: FilterChip(
                            label: Text(f == 'ALL' ? 'All' : f),
                            selected: isSel,
                            onSelected: (_) => setState(() => _selectedFilter = f),
                            selectedColor: AppTheme.primary,
                            labelStyle: TextStyle(
                              color: isSel ? Colors.white : Colors.grey[400],
                              fontWeight: FontWeight.bold,
                              fontSize: 12,
                            ),
                          ),
                        );
                      }).toList(),
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Project Cards
                  if (filtered.isEmpty)
                    Container(
                      padding: const EdgeInsets.all(32),
                      alignment: Alignment.center,
                      child: Text(
                        'No projects in this category',
                        style: TextStyle(color: Colors.grey[500]),
                      ),
                    )
                  else
                    ...filtered.map((p) => _buildProjectCard(p)),
                ],
              ),
      ),
    );
  }

  Widget _buildStatCard(String label, String value, IconData icon, Color color) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 10),
        decoration: BoxDecoration(
          color: AppTheme.surface,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppTheme.border),
        ),
        child: Column(
          children: [
            Icon(icon, color: color, size: 20),
            const SizedBox(height: 4),
            Text(value, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            Text(label, style: TextStyle(fontSize: 10, color: Colors.grey[400])),
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
          padding: const EdgeInsets.all(16),
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
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                              decoration: BoxDecoration(
                                color: AppTheme.primary.withValues(alpha: 0.2),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Text(
                                p.projectType,
                                style: const TextStyle(
                                  color: AppTheme.primaryLight,
                                  fontSize: 10,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                            if (p.primaryLanguage != null) ...[
                              const SizedBox(width: 6),
                              Text(
                                p.primaryLanguage!,
                                style: TextStyle(fontSize: 11, color: Colors.grey[400]),
                              ),
                            ],
                          ],
                        ),
                        const SizedBox(height: 6),
                        Text(
                          p.name,
                          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                        ),
                      ],
                    ),
                  ),
                  CircularPercentIndicator(
                    radius: 24.0,
                    lineWidth: 5.0,
                    percent: (p.progressPercentage / 100.0).clamp(0.0, 1.0),
                    center: Text(
                      '${p.progressPercentage}%',
                      style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold),
                    ),
                    progressColor: AppTheme.prodColor,
                    backgroundColor: AppTheme.border,
                  ),
                ],
              ),
              if (p.goal != null) ...[
                const SizedBox(height: 8),
                Text(
                  p.goal!,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(fontSize: 12, color: Colors.grey[300]),
                ),
              ],
              const SizedBox(height: 10),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    '${p.completedFeatures}/${p.totalFeatures} features done',
                    style: TextStyle(fontSize: 11, color: Colors.grey[500]),
                  ),
                  const Icon(Icons.chevron_right, size: 18, color: Colors.grey),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
