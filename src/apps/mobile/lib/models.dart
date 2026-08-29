class AuthState {
  const AuthState({
    required this.authenticated,
    required this.onboardingComplete,
    this.name,
    this.email,
    this.activeWorkspaceId,
    this.workspaces = const [],
  });
  final bool authenticated;
  final bool onboardingComplete;
  final String? name;
  final String? email;
  final String? activeWorkspaceId;
  final List<WorkspaceOption> workspaces;

  factory AuthState.fromJson(Map<String, dynamic> value) {
    final account = value['account'] as Map<String, dynamic>?;
    return AuthState(
      authenticated: value['authenticated'] == true,
      onboardingComplete: value['onboardingComplete'] == true,
      name: account?['displayName']?.toString(),
      email: account?['email']?.toString(),
      activeWorkspaceId: value['activeWorkspaceId']?.toString(),
      workspaces: (value['workspaces'] as List<dynamic>? ?? const [])
          .map((item) => WorkspaceOption.fromJson(item as Map<String, dynamic>))
          .toList(),
    );
  }
}

class WorkspaceOption {
  const WorkspaceOption({
    required this.id,
    required this.name,
    required this.type,
  });
  final String id;
  final String name;
  final String type;

  factory WorkspaceOption.fromJson(Map<String, dynamic> value) =>
      WorkspaceOption(
        id: value['id'].toString(),
        name: value['name'].toString(),
        type: value['type'].toString(),
      );
}

class VaultDocument {
  const VaultDocument({
    required this.id,
    required this.name,
    required this.category,
    required this.status,
    required this.subjectIds,
    this.deletedAt,
    this.purgeDueAt,
  });
  final String id;
  final String name;
  final String category;
  final String status;
  final List<String> subjectIds;
  final DateTime? deletedAt;
  final DateTime? purgeDueAt;

  bool get isDeleted => status == 'DELETED';
  factory VaultDocument.fromJson(Map<String, dynamic> value) => VaultDocument(
    id: value['id'].toString(),
    name: value['name'].toString(),
    category: value['category'].toString(),
    status: value['status'].toString(),
    subjectIds: (value['subjectIds'] as List<dynamic>? ?? const [])
        .map((item) => item.toString())
        .toList(),
    deletedAt: DateTime.tryParse(value['deletedAt']?.toString() ?? ''),
    purgeDueAt: DateTime.tryParse(value['purgeDueAt']?.toString() ?? ''),
  );
}

class HouseholdPerson {
  const HouseholdPerson({
    required this.id,
    required this.name,
    required this.relationship,
  });
  final String id;
  final String name;
  final String relationship;
  factory HouseholdPerson.fromJson(Map<String, dynamic> value) =>
      HouseholdPerson(
        id: value['id'].toString(),
        name: value['displayName'].toString(),
        relationship: value['relationship'].toString(),
      );
}

class ActivityItem {
  const ActivityItem({
    required this.type,
    required this.detail,
    required this.actor,
    required this.at,
  });
  final String type;
  final String detail;
  final String actor;
  final DateTime at;
  factory ActivityItem.fromJson(Map<String, dynamic> value) => ActivityItem(
    type: value['type'].toString(),
    detail: value['detail'].toString(),
    actor: value['actor'].toString(),
    at: DateTime.parse(value['at'].toString()),
  );
}

class VaultDashboard {
  const VaultDashboard({
    required this.workspaceName,
    required this.documents,
    required this.people,
    required this.activity,
    required this.factCount,
    required this.openTaskCount,
  });
  final String workspaceName;
  final List<VaultDocument> documents;
  final List<HouseholdPerson> people;
  final List<ActivityItem> activity;
  final int factCount;
  final int openTaskCount;

  factory VaultDashboard.fromJson(Map<String, dynamic> value) => VaultDashboard(
    workspaceName: (value['workspace'] as Map<String, dynamic>)['name']
        .toString(),
    documents: (value['documents'] as List<dynamic>)
        .map((item) => VaultDocument.fromJson(item as Map<String, dynamic>))
        .toList(),
    people: (value['subjects'] as List<dynamic>)
        .map((item) => HouseholdPerson.fromJson(item as Map<String, dynamic>))
        .toList(),
    activity: (value['audit'] as List<dynamic>)
        .map((item) => ActivityItem.fromJson(item as Map<String, dynamic>))
        .toList(),
    factCount: (value['facts'] as List<dynamic>).length,
    openTaskCount: (value['tasks'] as List<dynamic>)
        .where((item) => (item as Map<String, dynamic>)['state'] == 'OPEN')
        .length,
  );
}
