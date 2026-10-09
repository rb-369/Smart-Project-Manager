import 'package:flutter/material.dart';
import 'package:flutter_slidable/flutter_slidable.dart';
import 'package:percent_indicator/linear_percent_indicator.dart';
import 'package:url_launcher/url_launcher.dart';
import '../core/api_client.dart';
import '../core/theme.dart';
import '../models/project_model.dart';

class ProjectDetailScreen extends StatefulWidget {
  final String projectId;
  const ProjectDetailScreen({super.key, required this.projectId});

  @override
  State<ProjectDetailScreen> createState() => _ProjectDetailScreenState();
}

class _ProjectDetailScreenState extends State<ProjectDetailScreen> {
  final _dio = ApiClient.createDio();
  ProjectSummary? _project;
  List<FeatureItem> _features = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchDetails();
  }

  Future<void> _fetchDetails() async {
    try {
      setState(() => _isLoading = true);
      final resp = await _dio.get('/projects/${widget.projectId}');
      if (resp.statusCode == 200) {
        final data = resp.data;
        setState(() {
          _project = ProjectSummary.fromJson(data);
          final List fList = data['features'] ?? [];
          _features = fList.map((f) => FeatureItem.fromJson(f)).toList();
        });
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error loading project: $e')),
      );
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Future<void> _toggleFeatureStatus(FeatureItem f) async {
    final nextStatus = f.status == 'DONE' ? 'BACKLOG' : 'DONE';
    try {
      await _dio.patch('/features/${f.id}', data: {'status': nextStatus});
      _fetchDetails();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to update feature: $e')),
      );
    }
  }

  Future<void> _deleteFeature(String featureId) async {
    try {
      await _dio.delete('/features/$featureId');
      _fetchDetails();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to delete feature: $e')),
      );
    }
  }

  void _showAddFeatureDialog() {
    final titleCtrl = TextEditingController();
    String priority = 'P1';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppTheme.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => StatefulBuilder(
        builder: (context, setModalState) => Padding(
          padding: EdgeInsets.only(
            left: 20,
            right: 20,
            top: 20,
            bottom: MediaQuery.of(context).viewInsets.bottom + 20,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Add Feature to Backlog', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
              const SizedBox(height: 12),
              TextField(
                controller: titleCtrl,
                autofocus: true,
                decoration: const InputDecoration(
                  hintText: 'Feature title (e.g. Stripe Webhook)',
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  const Text('Priority:', style: TextStyle(fontSize: 13)),
                  const SizedBox(width: 10),
                  DropdownButton<String>(
                    value: priority,
                    dropdownColor: AppTheme.surface,
                    items: const [
                      DropdownMenuItem(value: 'P0', child: Text('P0 - Critical')),
                      DropdownMenuItem(value: 'P1', child: Text('P1 - High')),
                      DropdownMenuItem(value: 'P2', child: Text('P2 - Medium')),
                      DropdownMenuItem(value: 'P3', child: Text('P3 - Low')),
                    ],
                    onChanged: (v) {
                      if (v != null) setModalState(() => priority = v);
                    },
                  ),
                ],
              ),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () async {
                    if (titleCtrl.text.trim().isEmpty) return;
                    Navigator.pop(ctx);
                    await _dio.post(
                      '/projects/${widget.projectId}/features',
                      data: {'title': titleCtrl.text.trim(), 'priority': priority},
                    );
                    _fetchDetails();
                  },
                  child: const Text('Add Feature'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showAiSuggestionsModal() async {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppTheme.surface,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) {
        return FutureBuilder(
          future: _dio.post('/ai/suggest-features/${widget.projectId}'),
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return Container(
                height: 300,
                alignment: Alignment.center,
                child: const Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    CircularProgressIndicator(),
                    SizedBox(height: 12),
                    Text('AI Analyzing Goal and Recommending Next Features...'),
                  ],
                ),
              );
            }
            if (snapshot.hasError || snapshot.data?.statusCode != 200) {
              return Container(
                height: 200,
                padding: const EdgeInsets.all(20),
                alignment: Alignment.center,
                child: Text('AI recommendation error: ${snapshot.error}'),
              );
            }

            final List feats = snapshot.data?.data['features'] ?? [];
            return Container(
              height: 480,
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.auto_awesome, color: AppTheme.primaryLight),
                      const SizedBox(width: 8),
                      const Text(
                        'AI Recommended Next Features',
                        style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),
                  Expanded(
                    child: ListView.separated(
                      itemCount: feats.length,
                      separatorBuilder: (_, _) => const SizedBox(height: 10),
                      itemBuilder: (context, i) {
                        final item = feats[i];
                        return Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: AppTheme.background,
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(color: AppTheme.border),
                          ),
                          child: Row(
                            children: [
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      item['title'] ?? '',
                                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                                    ),
                                    const SizedBox(height: 2),
                                    Text(
                                      item['description'] ?? '',
                                      style: TextStyle(fontSize: 11, color: Colors.grey[400]),
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      '“${item['rationale']}”',
                                      style: const TextStyle(fontSize: 10, color: AppTheme.accent, fontStyle: FontStyle.italic),
                                    ),
                                  ],
                                ),
                              ),
                              IconButton(
                                icon: const Icon(Icons.add_circle, color: AppTheme.primary),
                                onPressed: () async {
                                  Navigator.pop(ctx);
                                  await _dio.post(
                                    '/projects/${widget.projectId}/features',
                                    data: {
                                      'title': item['title'],
                                      'priority': item['priority'] ?? 'P1',
                                      'description': item['description'],
                                    },
                                  );
                                  _fetchDetails();
                                },
                              ),
                            ],
                          ),
                        );
                      },
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }
    if (_project == null) {
      return const Scaffold(body: Center(child: Text('Project not found')));
    }

    final p = _project!;

    return Scaffold(
      appBar: AppBar(
        title: Text(p.name),
        actions: [
          IconButton(
            icon: const Icon(Icons.auto_awesome, color: AppTheme.accent),
            tooltip: 'AI Feature Strategist',
            onPressed: _showAiSuggestionsModal,
          ),
          if (p.htmlUrl != null)
            IconButton(
              icon: const Icon(Icons.open_in_browser),
              tooltip: 'View on GitHub',
              onPressed: () => launchUrl(Uri.parse(p.htmlUrl!)),
            ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _showAddFeatureDialog,
        backgroundColor: AppTheme.primary,
        child: const Icon(Icons.add, color: Colors.white),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Goal Banner
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: AppTheme.surface,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppTheme.border),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      p.projectType,
                      style: const TextStyle(
                        color: AppTheme.accent,
                        fontWeight: FontWeight.bold,
                        fontSize: 12,
                      ),
                    ),
                    Text(
                      p.status.replaceFirst('_', ' '),
                      style: TextStyle(fontSize: 12, color: Colors.grey[400]),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  p.goal ?? 'No goal defined yet',
                  style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
                ),
                const SizedBox(height: 12),
                LinearPercentIndicator(
                  lineHeight: 8.0,
                  percent: (p.progressPercentage / 100.0).clamp(0.0, 1.0),
                  progressColor: AppTheme.prodColor,
                  backgroundColor: AppTheme.border,
                  barRadius: const Radius.circular(4),
                ),
                const SizedBox(height: 4),
                Align(
                  alignment: Alignment.centerRight,
                  child: Text(
                    '${p.progressPercentage}% Completed',
                    style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppTheme.prodColor),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // Features Title
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Feature Backlog (${_features.length})',
                style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
              ),
              Text(
                'Swipe right to complete',
                style: TextStyle(fontSize: 11, color: Colors.grey[500]),
              ),
            ],
          ),
          const SizedBox(height: 10),

          // Feature items
          if (_features.isEmpty)
            Container(
              padding: const EdgeInsets.all(32),
              alignment: Alignment.center,
              child: const Text('No features in backlog. Tap + to add one.'),
            )
          else
            ..._features.map((f) {
              final isDone = f.status == 'DONE';
              return Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Slidable(
                  key: ValueKey(f.id),
                  startActionPane: ActionPane(
                    motion: const ScrollMotion(),
                    children: [
                      SlidableAction(
                        onPressed: (_) => _toggleFeatureStatus(f),
                        backgroundColor: AppTheme.prodColor,
                        foregroundColor: Colors.white,
                        icon: isDone ? Icons.undo : Icons.check,
                        label: isDone ? 'Undone' : 'Done',
                      ),
                    ],
                  ),
                  endActionPane: ActionPane(
                    motion: const ScrollMotion(),
                    children: [
                      SlidableAction(
                        onPressed: (_) => _deleteFeature(f.id),
                        backgroundColor: AppTheme.p0Color,
                        foregroundColor: Colors.white,
                        icon: Icons.delete,
                        label: 'Delete',
                      ),
                    ],
                  ),
                  child: Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: AppTheme.surface,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: AppTheme.border),
                    ),
                    child: Row(
                      children: [
                        Icon(
                          isDone ? Icons.check_circle : Icons.circle_outlined,
                          color: isDone ? AppTheme.prodColor : Colors.grey,
                          size: 20,
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            f.title,
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                              decoration: isDone ? TextDecoration.lineThrough : null,
                              color: isDone ? Colors.grey : Colors.white,
                            ),
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: AppTheme.background,
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            f.priority,
                            style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              );
            }),
        ],
      ),
    );
  }
}
