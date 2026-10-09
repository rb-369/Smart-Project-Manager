import 'package:flutter/material.dart';
import '../core/api_client.dart';
import '../core/theme.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  final _dio = ApiClient.createDio();
  final _tokenCtrl = TextEditingController();
  final _urlCtrl = TextEditingController(text: ApiClient.baseUrl);
  bool _isConnected = false;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _fetchStatus();
  }

  Future<void> _fetchStatus() async {
    try {
      final resp = await _dio.get('/github/status');
      if (resp.statusCode == 200) {
        setState(() {
          _isConnected = resp.data['is_connected'] ?? false;
        });
      }
    } catch (_) {}
  }

  Future<void> _saveToken() async {
    if (_tokenCtrl.text.trim().isEmpty) return;
    setState(() => _isLoading = true);
    try {
      await _dio.post('/github/token', data: {'token': _tokenCtrl.text.trim()});
      _tokenCtrl.clear();
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('GitHub token encrypted and saved successfully!')),
      );
      _fetchStatus();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to save token: $e')),
      );
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Settings & Integrations')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Connection Status Card
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppTheme.surface,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppTheme.border),
            ),
            child: Row(
              children: [
                Icon(
                  _isConnected ? Icons.check_circle : Icons.warning_amber_rounded,
                  color: _isConnected ? AppTheme.prodColor : AppTheme.p1Color,
                  size: 28,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        _isConnected ? 'GitHub Connected' : 'GitHub Token Missing',
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                      ),
                      Text(
                        _isConnected
                            ? 'Repositories will automatically sync upon pull-to-refresh'
                            : 'Set your Personal Access Token below to enable repo sync',
                        style: TextStyle(fontSize: 11, color: Colors.grey[400]),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // GitHub PAT Form
          const Text('GitHub Personal Access Token (PAT)', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
          const SizedBox(height: 8),
          TextField(
            controller: _tokenCtrl,
            obscureText: true,
            decoration: const InputDecoration(
              hintText: 'ghp_xxxxxxxxxxxxxxxxxxxx',
              border: OutlineInputBorder(),
              prefixIcon: Icon(Icons.key),
            ),
          ),
          const SizedBox(height: 12),
          ElevatedButton(
            onPressed: _isLoading ? null : _saveToken,
            child: _isLoading ? const CircularProgressIndicator() : const Text('Save & Encrypt Token'),
          ),
          const SizedBox(height: 30),

          // Backend URL Configuration
          const Text('Backend Server URL', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
          const SizedBox(height: 8),
          TextField(
            controller: _urlCtrl,
            decoration: const InputDecoration(
              hintText: 'http://10.0.2.2:8000/api/v1',
              border: OutlineInputBorder(),
              prefixIcon: Icon(Icons.dns),
            ),
          ),
          const SizedBox(height: 10),
          ElevatedButton(
            onPressed: () {
              ApiClient.baseUrl = _urlCtrl.text.trim();
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text('Server URL updated to: ${ApiClient.baseUrl}')),
              );
            },
            child: const Text('Update Server URL'),
          ),
        ],
      ),
    );
  }
}
