import 'package:flutter/material.dart';
import '../core/api_client.dart';
import '../core/theme.dart';
import '../models/project_model.dart';

class IdeasScreen extends StatefulWidget {
  const IdeasScreen({super.key});

  @override
  State<IdeasScreen> createState() => _IdeasScreenState();
}

class _IdeasScreenState extends State<IdeasScreen> with SingleTickerProviderStateMixin {
  final _dio = ApiClient.createDio();
  late TabController _tabController;
  List<FutureProjectItem> _ideas = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _fetchIdeas();
  }

  Future<void> _fetchIdeas() async {
    try {
      setState(() => _isLoading = true);
      final resp = await _dio.get('/future-projects');
      if (resp.statusCode == 200) {
        final List data = resp.data;
        setState(() {
          _ideas = data.map((j) => FutureProjectItem.fromJson(j)).toList();
        });
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error loading ideas: $e')),
      );
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Future<void> _promoteIdea(String ideaId) async {
    try {
      await _dio.post('/future-projects/$ideaId/promote', data: {});
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Promoted idea into active project!')),
      );
      _fetchIdeas();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to promote idea: $e')),
      );
    }
  }

  void _showAddIdeaModal() {
    final titleCtrl = TextEditingController();
    final pitchCtrl = TextEditingController();
    final stackCtrl = TextEditingController();
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
              const Text('Capture Future Project Idea', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
              const SizedBox(height: 12),
              TextField(
                controller: titleCtrl,
                decoration: const InputDecoration(hintText: 'Project Title', border: OutlineInputBorder()),
              ),
              const SizedBox(height: 10),
              TextField(
                controller: pitchCtrl,
                decoration: const InputDecoration(hintText: 'Elevator pitch / Problem', border: OutlineInputBorder()),
              ),
              const SizedBox(height: 10),
              TextField(
                controller: stackCtrl,
                decoration: const InputDecoration(hintText: 'Target tech stack (e.g. Flutter + Go)', border: OutlineInputBorder()),
              ),
              const SizedBox(height: 10),
              Row(
                children: [
                  const Text('Priority:'),
                  const SizedBox(width: 10),
                  DropdownButton<String>(
                    value: priority,
                    dropdownColor: AppTheme.surface,
                    items: const [
                      DropdownMenuItem(value: 'P0', child: Text('P0 - Next Up')),
                      DropdownMenuItem(value: 'P1', child: Text('P1 - High')),
                      DropdownMenuItem(value: 'P2', child: Text('P2 - Backlog')),
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
                    await _dio.post('/future-projects', data: {
                      'title': titleCtrl.text.trim(),
                      'elevator_pitch': pitchCtrl.text.trim(),
                      'target_tech_stack': stackCtrl.text.trim(),
                      'priority': priority,
                    });
                    _fetchIdeas();
                  },
                  child: const Text('Save Idea'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showAiProjectModal() {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppTheme.surface,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) {
        return FutureBuilder(
          future: _dio.post('/ai/suggest-projects'),
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
                    Text('AI Brainstorming High-Impact Projects...'),
                  ],
                ),
              );
            }
            if (snapshot.hasError || snapshot.data?.statusCode != 200) {
              return Container(
                height: 200,
                alignment: Alignment.center,
                child: Text('AI brainstorm error: ${snapshot.error}'),
              );
            }

            final List projs = snapshot.data?.data['projects'] ?? [];
            return Container(
              height: 480,
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('AI Suggested Future Projects', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                  const SizedBox(height: 12),
                  Expanded(
                    child: ListView.separated(
                      itemCount: projs.length,
                      separatorBuilder: (_, _) => const SizedBox(height: 10),
                      itemBuilder: (context, i) {
                        final item = projs[i];
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
                                    Text(item['title'] ?? '', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                                    const SizedBox(height: 2),
                                    Text(item['elevator_pitch'] ?? '', style: TextStyle(fontSize: 11, color: Colors.grey[400])),
                                    const SizedBox(height: 4),
                                    Text(item['target_tech_stack'] ?? '', style: const TextStyle(fontSize: 10, color: AppTheme.accent)),
                                  ],
                                ),
                              ),
                              IconButton(
                                icon: const Icon(Icons.add_circle, color: AppTheme.primary),
                                onPressed: () async {
                                  Navigator.pop(ctx);
                                  await _dio.post('/future-projects', data: {
                                    'title': item['title'],
                                    'elevator_pitch': item['elevator_pitch'],
                                    'target_tech_stack': item['target_tech_stack'],
                                    'priority': item['priority'] ?? 'P1',
                                  });
                                  _fetchIdeas();
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
    return Scaffold(
      appBar: AppBar(
        title: const Text('Future Project Ideas'),
        actions: [
          IconButton(
            icon: const Icon(Icons.auto_awesome, color: AppTheme.accent),
            tooltip: 'AI Project Ideas',
            onPressed: _showAiProjectModal,
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'P0 - Next Up'),
            Tab(text: 'P1 - Upcoming'),
            Tab(text: 'P2 - Backlog'),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _showAddIdeaModal,
        backgroundColor: AppTheme.primary,
        child: const Icon(Icons.add, color: Colors.white),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : TabBarView(
              controller: _tabController,
              children: ['P0', 'P1', 'P2'].map((prio) {
                final list = _ideas.where((i) => i.priority == prio && i.status != 'PROMOTED').toList();
                if (list.isEmpty) {
                  return Center(
                    child: Text('No ideas in $prio', style: TextStyle(color: Colors.grey[500])),
                  );
                }
                return ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: list.length,
                  itemBuilder: (context, idx) {
                    final idea = list[idx];
                    return Card(
                      margin: const EdgeInsets.only(bottom: 12),
                      child: Padding(
                        padding: const EdgeInsets.all(14),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(idea.title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                            if (idea.elevatorPitch != null) ...[
                              const SizedBox(height: 4),
                              Text(idea.elevatorPitch!, style: TextStyle(fontSize: 12, color: Colors.grey[300])),
                            ],
                            if (idea.targetTechStack != null) ...[
                              const SizedBox(height: 8),
                              Row(
                                children: [
                                  const Icon(Icons.code, size: 14, color: AppTheme.accent),
                                  const SizedBox(width: 4),
                                  Text(idea.targetTechStack!, style: const TextStyle(fontSize: 11, color: AppTheme.accent)),
                                ],
                              ),
                            ],
                            const SizedBox(height: 10),
                            Align(
                              alignment: Alignment.centerRight,
                              child: TextButton.icon(
                                onPressed: () => _promoteIdea(idea.id),
                                icon: const Icon(Icons.arrow_forward, size: 14),
                                label: const Text('Promote to Active'),
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                );
              }).toList(),
            ),
    );
  }
}
