class ProjectSummary {
  final String id;
  final String name;
  final String? description;
  final String? htmlUrl;
  final String? primaryLanguage;
  final int? githubRepoId;
  final String projectType; // COLLEGE, RESUME, PRODUCTION
  final String status;      // IDEATION, IN_PROGRESS, PAUSED, COMPLETED, ARCHIVED
  final String? goal;
  final bool needsReview;
  final int progressPercentage;
  final int totalFeatures;
  final int completedFeatures;
  final int starsCount;

  ProjectSummary({
    required this.id,
    required this.name,
    this.description,
    this.htmlUrl,
    this.primaryLanguage,
    this.githubRepoId,
    required this.projectType,
    required this.status,
    this.goal,
    required this.needsReview,
    required this.progressPercentage,
    required this.totalFeatures,
    required this.completedFeatures,
    required this.starsCount,
  });

  factory ProjectSummary.fromJson(Map<String, dynamic> json) {
    return ProjectSummary(
      id: json['id'] as String,
      name: json['name'] as String,
      description: json['description'] as String?,
      htmlUrl: json['html_url'] as String?,
      primaryLanguage: json['primary_language'] as String?,
      githubRepoId: json['github_repo_id'] as int?,
      projectType: json['project_type'] as String? ?? 'RESUME',
      status: json['status'] as String? ?? 'IN_PROGRESS',
      goal: json['goal'] as String?,
      needsReview: json['needs_review'] as bool? ?? false,
      progressPercentage: json['progress_percentage'] as int? ?? 0,
      totalFeatures: json['total_features'] as int? ?? 0,
      completedFeatures: json['completed_features'] as int? ?? 0,
      starsCount: json['stars_count'] as int? ?? 0,
    );
  }
}

class FeatureItem {
  final String id;
  final String projectId;
  final String title;
  final String? description;
  final String priority; // P0, P1, P2, P3
  final String status;   // BACKLOG, IN_PROGRESS, DONE
  final int orderIndex;
  final String? completedAt;

  FeatureItem({
    required this.id,
    required this.projectId,
    required this.title,
    this.description,
    required this.priority,
    required this.status,
    required this.orderIndex,
    this.completedAt,
  });

  factory FeatureItem.fromJson(Map<String, dynamic> json) {
    return FeatureItem(
      id: json['id'] as String,
      projectId: json['project_id'] as String,
      title: json['title'] as String,
      description: json['description'] as String?,
      priority: json['priority'] as String? ?? 'P1',
      status: json['status'] as String? ?? 'BACKLOG',
      orderIndex: json['order_index'] as int? ?? 0,
      completedAt: json['completed_at'] as String?,
    );
  }
}

class FutureProjectItem {
  final String id;
  final String title;
  final String? elevatorPitch;
  final String? targetTechStack;
  final String projectType;
  final String priority;
  final String status;
  final String? notes;
  final String? promotedProjectId;

  FutureProjectItem({
    required this.id,
    required this.title,
    this.elevatorPitch,
    this.targetTechStack,
    required this.projectType,
    required this.priority,
    required this.status,
    this.notes,
    this.promotedProjectId,
  });

  factory FutureProjectItem.fromJson(Map<String, dynamic> json) {
    return FutureProjectItem(
      id: json['id'] as String,
      title: json['title'] as String,
      elevatorPitch: json['elevator_pitch'] as String?,
      targetTechStack: json['target_tech_stack'] as String?,
      projectType: json['project_type'] as String? ?? 'RESUME',
      priority: json['priority'] as String? ?? 'P1',
      status: json['status'] as String? ?? 'IDEA',
      notes: json['notes'] as String?,
      promotedProjectId: json['promoted_project_id'] as String?,
    );
  }
}
