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
        title: const Text('DevCommand'),
        actions: [
          IconButton(
            icon: const Icon(Icons.sync, size: 20, color: Color(0xFF8B8F9E)),
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
                  // High-Density Metric Status Bar (Eliminates Cartoon Boxes)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                    decoration: BoxDecoration(
                      color: AppTheme.surface,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: AppTheme.border),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceAround,
                      children: [
                        _buildMetricItem('Total Repos', _projects.length.toString(), const Color(0xFFF4F4F7)),
                        Container(width: 1, height: 20, color: AppTheme.border),
                        _buildMetricItem('Active', activeCount.toString(), AppTheme.prodColor),
                        Container(width: 1, height: 20, color: AppTheme.border),
                        _buildMetricItem('Avg Velocity', '$avgProgress%', AppTheme.primaryLight),
                      ],
                    ),
                  ),
                  const SizedBox(height: 12),

                  // Actionable Triage Banner if repos need review
                  if (needsReview.isNotEmpty) ...[
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: const Color(0xFF16141A),
                        border: Border.all(color: AppTheme.p1Color.withValues(alpha: 0.35)),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              const Icon(Icons.info_outline, color: AppTheme.p1Color, size: 16),
                              const SizedBox(width: 6),
                              Text(
                                '${needsReview.length} newly synced ${needsReview.length == 1 ? 'repo requires' : 'repos require'} triage',
                                style: const TextStyle(
                                  fontWeight: FontWeight.w600,
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
                                  style: const TextStyle(fontSize: 11, color: Color(0xFFF4F4F7)),
                                ),
                                backgroundColor: AppTheme.surfaceRaised,
                                side: const BorderSide(color: Color(0xFF2E3142)),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
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

                  // Segmented Category Filter
                  SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: Row(
                      children: ['ALL', 'COLLEGE', 'RESUME', 'PRODUCTION'].map((f) {
                        final isSel = _selectedFilter == f;
                        final label = f == 'ALL' ? 'All' : f[0] + f.substring(1).toLowerCase();
                        return Padding(
                          padding: const EdgeInsets.only(right: 6),
                          child: InkWell(
                            borderRadius: BorderRadius.circular(6),
                            onTap: () => setState(() => _selectedFilter = f),
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                              decoration: BoxDecoration(
                                color: isSel ? const Color(0xFF1C1D2A) : Colors.transparent,
                                borderRadius: BorderRadius.circular(6),
                                border: Border.all(
                                  color: isSel ? const Color(0xFF35394E) : AppTheme.border,
                                ),
                              ),
                              child: Text(
                                label,
                                style: TextStyle(
                                  color: isSel ? const Color(0xFFF4F4F7) : const Color(0xFF7C8091),
                                  fontWeight: isSel ? FontWeight.w600 : FontWeight.w400,
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
                        'No repositories found in this category',
                        style: TextStyle(color: Color(0xFF555866), fontSize: 13),
                      ),
                    )
                  else
                    ...filtered.map((p) => _buildProjectCard(p)),
                ],
              ),
      ),
    );
  }

  Widget _buildMetricItem(String label, String value, Color valueColor) {
    return Column(
      children: [
        Text(
          value,
          style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: valueColor),
        ),
        const SizedBox(height: 1),
        Text(
          label,
          style: const TextStyle(fontSize: 10, color: Color(0xFF7C8091)),
        ),
      ],
    );
  }

  Widget _buildProjectCard(ProjectSummary p) {
    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: InkWell(
        borderRadius: BorderRadius.circular(10),
        onTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (_) => ProjectDetailScreen(projectId: p.id),
            ),
          ).then((_) => _fetchProjects());
        },
        child: Padding(
          padding: const EdgeInsets.all(14),
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
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                              decoration: BoxDecoration(
                                color: const Color(0xFF161722),
                                border: Border.all(color: AppTheme.border),
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: Text(
                                p.projectType,
                                style: const TextStyle(
                                  color: Color(0xFF8B8F9E),
                                  fontSize: 10,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                            if (p.primaryLanguage != null) ...[
                              const SizedBox(width: 8),
                              Text(
                                p.primaryLanguage!,
                                style: const TextStyle(fontSize: 11, color: Color(0xFF8B8F9E)),
                              ),
                            ],
                          ],
                        ),
                        const SizedBox(height: 6),
                        Text(
                          p.name,
                          style: const TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w600,
                            color: Color(0xFFF4F4F7),
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
                      style: const TextStyle(fontSize: 9, fontWeight: FontWeight.w600),
                    ),
                    progressColor: p.progressPercentage == 100 ? AppTheme.prodColor : AppTheme.primary,
                    backgroundColor: const Color(0xFF1B1C26),
                  ),
                ],
              ),
              if (p.goal != null) ...[
                const SizedBox(height: 6),
                Text(
                  p.goal!,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(fontSize: 12, color: Color(0xFF9CA0B0)),
                ),
              ],
              const SizedBox(height: 10),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    '${p.completedFeatures}/${p.totalFeatures} completed',
                    style: const TextStyle(fontSize: 11, color: Color(0xFF64687A)),
                  ),
                  const Icon(Icons.arrow_forward, size: 14, color: Color(0xFF64687A)),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
