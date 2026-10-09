from enum import Enum


class ProjectType(str, Enum):
    COLLEGE = "COLLEGE"
    RESUME = "RESUME"
    PRODUCTION = "PRODUCTION"


class ProjectStatus(str, Enum):
    IDEATION = "IDEATION"
    IN_PROGRESS = "IN_PROGRESS"
    PAUSED = "PAUSED"
    COMPLETED = "COMPLETED"
    ARCHIVED = "ARCHIVED"


class FeaturePriority(str, Enum):
    P0 = "P0"  # Critical / MVP Blocker (Weight: 4)
    P1 = "P1"  # High Priority (Weight: 3)
    P2 = "P2"  # Medium Priority (Weight: 2)
    P3 = "P3"  # Nice to Have (Weight: 1)


class FeatureStatus(str, Enum):
    BACKLOG = "BACKLOG"
    IN_PROGRESS = "IN_PROGRESS"
    DONE = "DONE"


class FutureProjectPriority(str, Enum):
    P0 = "P0"  # Highest Priority / Next Up
    P1 = "P1"  # High Priority
    P2 = "P2"  # Medium / Later


class FutureProjectStatus(str, Enum):
    IDEA = "IDEA"
    PLANNING = "PLANNING"
    PROMOTED = "PROMOTED"
    DISCARDED = "DISCARDED"


class RecommendationType(str, Enum):
    NEXT_PROJECT = "NEXT_PROJECT"
    NEXT_FEATURES = "NEXT_FEATURES"
    TRIAGE = "TRIAGE"
