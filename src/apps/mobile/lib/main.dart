import 'dart:io';

import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';

import 'api_client.dart';
import 'models.dart';

void main() => runApp(const DoculyraApp());

class DoculyraApp extends StatefulWidget {
  const DoculyraApp({super.key, this.api});
  final DoculyraApi? api;
  @override
  State<DoculyraApp> createState() => _DoculyraAppState();
}

class _DoculyraAppState extends State<DoculyraApp> {
  late final DoculyraApi api = widget.api ?? DoculyraApi();
  AuthState? session;
  String? error;

  @override
  void initState() {
    super.initState();
    _loadSession();
  }

  Future<void> _loadSession() async {
    try {
      final value = AuthState.fromJson(await api.session());
      if (mounted) {
        setState(() {
          session = value;
          error = null;
        });
      }
    } catch (cause) {
      if (mounted) {
        setState(() {
          session = const AuthState(
            authenticated: false,
            onboardingComplete: false,
          );
          error = cause.toString();
        });
      }
    }
  }

  @override
  void dispose() {
    api.close();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => MaterialApp(
    title: 'Doculyra',
    debugShowCheckedModeBanner: false,
    theme: ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      scaffoldBackgroundColor: const Color(0xfff6f6f4),
      colorScheme: const ColorScheme.light(
        primary: Color(0xff101010),
        onPrimary: Colors.white,
        surface: Colors.white,
        onSurface: Color(0xff151515),
        outline: Color(0xffd6d6d2),
      ),
      textTheme: const TextTheme(
        headlineLarge: TextStyle(
          fontSize: 38,
          fontWeight: FontWeight.w700,
          letterSpacing: -1.5,
        ),
        headlineMedium: TextStyle(
          fontSize: 28,
          fontWeight: FontWeight.w700,
          letterSpacing: -0.8,
        ),
        titleLarge: TextStyle(fontSize: 20, fontWeight: FontWeight.w700),
        bodyLarge: TextStyle(fontSize: 16, height: 1.45),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: Colors.white,
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 18,
          vertical: 17,
        ),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: Color(0xffd6d6d2)),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: Color(0xffd6d6d2)),
        ),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          minimumSize: const Size.fromHeight(54),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
        ),
      ),
      cardTheme: CardThemeData(
        color: Colors.white,
        elevation: 0,
        margin: EdgeInsets.zero,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(22),
          side: const BorderSide(color: Color(0xffe1e1de)),
        ),
      ),
    ),
    home: session == null
        ? const _Loading()
        : !session!.authenticated
        ? AuthScreen(
            api: api,
            initialError: error,
            onAuthenticated: (value) => setState(() => session = value),
          )
        : !session!.onboardingComplete
        ? WorkspaceSetup(
            api: api,
            ownerName: session!.name ?? 'Owner',
            onComplete: _loadSession,
          )
        : VaultShell(
            api: api,
            onSignedOut: () => setState(
              () => session = const AuthState(
                authenticated: false,
                onboardingComplete: false,
              ),
            ),
          ),
  );
}

class _Loading extends StatelessWidget {
  const _Loading();
  @override
  Widget build(BuildContext context) => const Scaffold(
    body: Center(child: CircularProgressIndicator(color: Colors.black)),
  );
}

class Brand extends StatelessWidget {
  const Brand({super.key, this.compact = false});
  final bool compact;
  @override
  Widget build(BuildContext context) => Row(
    mainAxisSize: MainAxisSize.min,
    children: [
      Container(
        width: compact ? 34 : 44,
        height: compact ? 34 : 44,
        decoration: BoxDecoration(
          color: Colors.black,
          borderRadius: BorderRadius.circular(12),
        ),
        child: const Icon(Icons.auto_awesome_rounded, color: Colors.white),
      ),
      const SizedBox(width: 10),
      Text(
        'Doculyra',
        style: TextStyle(
          fontSize: compact ? 20 : 25,
          fontWeight: FontWeight.w800,
          letterSpacing: -0.8,
        ),
      ),
    ],
  );
}

class AuthScreen extends StatefulWidget {
  const AuthScreen({
    super.key,
    required this.api,
    required this.onAuthenticated,
    this.initialError,
  });
  final DoculyraApi api;
  final ValueChanged<AuthState> onAuthenticated;
  final String? initialError;
  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> {
  bool register = false, busy = false;
  final name = TextEditingController(),
      email = TextEditingController(),
      password = TextEditingController();
  String? error;
  Future<void> showRecoveryBoundary() => showDialog<void>(
    context: context,
    builder: (context) => AlertDialog(
      title: const Text('Account recovery is not available yet'),
      content: const Text(
        'No recovery case or ownership change has been created. This development preview cannot reset access or transfer a workspace owner.',
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('Close'),
        ),
      ],
    ),
  );
  Future<void> submit() async {
    setState(() {
      busy = true;
      error = null;
    });
    try {
      final result = register
          ? await widget.api.register(name.text, email.text, password.text)
          : await widget.api.login(email.text, password.text);
      widget.onAuthenticated(AuthState.fromJson(result));
    } catch (cause) {
      setState(() => error = cause.toString());
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final message = error ?? widget.initialError;
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 460),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const Brand(),
                  const SizedBox(height: 42),
                  Text(
                    register ? 'Create your private vault.' : 'Welcome back.',
                    style: Theme.of(context).textTheme.headlineLarge,
                  ),
                  const SizedBox(height: 12),
                  Text(
                    register
                        ? 'Organise the people, documents and details that matter—secured before cloud storage.'
                        : 'Open your household document workspace.',
                    style: Theme.of(context).textTheme.bodyLarge
                        ?.copyWith(color: Colors.black54),
                  ),
                  const SizedBox(height: 30),
                  if (register) ...[
                    TextField(
                      controller: name,
                      textInputAction: TextInputAction.next,
                      decoration: const InputDecoration(labelText: 'Your name'),
                    ),
                    const SizedBox(height: 14),
                  ],
                  TextField(
                    controller: email,
                    keyboardType: TextInputType.emailAddress,
                    textInputAction: TextInputAction.next,
                    decoration: const InputDecoration(labelText: 'Email'),
                  ),
                  const SizedBox(height: 14),
                  TextField(
                    controller: password,
                    obscureText: true,
                    onSubmitted: (_) => submit(),
                    decoration: InputDecoration(
                      labelText: register
                          ? 'Password · 10+ characters'
                          : 'Password',
                    ),
                  ),
                  const SizedBox(height: 12),
                  if (message != null)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: Text(
                        message,
                        style: const TextStyle(color: Color(0xff8a1c1c)),
                      ),
                    ),
                  FilledButton(
                    onPressed: busy ? null : submit,
                    child: Text(
                      busy
                          ? 'Please wait…'
                          : register
                          ? 'Create vault'
                          : 'Sign in',
                    ),
                  ),
                  const SizedBox(height: 8),
                  TextButton(
                    onPressed: busy
                        ? null
                        : () => setState(() {
                            register = !register;
                            error = null;
                          }),
                    child: Text(
                      register
                          ? 'Already have an account? Sign in'
                          : 'New to Doculyra? Create your vault',
                    ),
                  ),
                  if (!register)
                    TextButton(
                      onPressed: busy ? null : showRecoveryBoundary,
                      child: const Text('Can’t sign in?'),
                    ),
                  const SizedBox(height: 22),
                  const _TrustNote(
                    text: 'Mobile-first · customer-controlled encryption foundation · no advertising or data sale',
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class WorkspaceSetup extends StatefulWidget {
  const WorkspaceSetup({
    super.key,
    required this.api,
    required this.ownerName,
    required this.onComplete,
  });
  final DoculyraApi api;
  final String ownerName;
  final Future<void> Function() onComplete;
  @override
  State<WorkspaceSetup> createState() => _WorkspaceSetupState();
}

class _WorkspaceSetupState extends State<WorkspaceSetup> {
  String type = 'FAMILY';
  bool busy = false;
  late final name = TextEditingController(
    text: '${widget.ownerName.split(' ').first} household',
  );
  void choose(String value) {
    setState(() {
      type = value;
      name.text = value == 'PERSONAL'
          ? '${widget.ownerName.split(' ').first} vault'
          : '${widget.ownerName.split(' ').first} household';
    });
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    body: SafeArea(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Brand(),
            const Spacer(),
            Text(
              'Who are you organising for?',
              style: Theme.of(context).textTheme.headlineLarge,
            ),
            const SizedBox(height: 12),
            const Text(
              'Your workspace name changes with your choice. You can add people and their access separately.',
            ),
            const SizedBox(height: 24),
            Row(
              children: [
                Expanded(
                  child: _Choice(
                    selected: type == 'PERSONAL',
                    icon: Icons.person_outline,
                    label: 'Just me',
                    onTap: () => choose('PERSONAL'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _Choice(
                    selected: type == 'FAMILY',
                    icon: Icons.family_restroom,
                    label: 'My family',
                    onTap: () => choose('FAMILY'),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 18),
            TextField(
              controller: name,
              decoration: const InputDecoration(labelText: 'Workspace name'),
            ),
            const SizedBox(height: 18),
            FilledButton(
              onPressed: busy
                  ? null
                  : () async {
                      setState(() => busy = true);
                      await widget.api.configureWorkspace(name.text, type);
                      await widget.onComplete();
                    },
              child: Text(busy ? 'Creating…' : 'Create workspace'),
            ),
            const Spacer(),
          ],
        ),
      ),
    ),
  );
}

class _Choice extends StatelessWidget {
  const _Choice({
    required this.selected,
    required this.icon,
    required this.label,
    required this.onTap,
  });
  final bool selected;
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  @override
  Widget build(BuildContext context) => InkWell(
    onTap: onTap,
    borderRadius: BorderRadius.circular(20),
    child: Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: selected ? Colors.black : Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: selected ? Colors.black : const Color(0xffd6d6d2),
        ),
      ),
      child: Column(
        children: [
          Icon(icon, color: selected ? Colors.white : Colors.black, size: 32),
          const SizedBox(height: 12),
          Text(
            label,
            style: TextStyle(
              color: selected ? Colors.white : Colors.black,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    ),
  );
}

class VaultShell extends StatefulWidget {
  const VaultShell({super.key, required this.api, required this.onSignedOut});
  final DoculyraApi api;
  final VoidCallback onSignedOut;
  @override
  State<VaultShell> createState() => _VaultShellState();
}

class _VaultShellState extends State<VaultShell> {
  int tab = 0;
  VaultDashboard? dashboard;
  String? error;
  @override
  void initState() {
    super.initState();
    refresh();
  }

  Future<void> refresh() async {
    try {
      final value = VaultDashboard.fromJson(await widget.api.dashboard());
      if (mounted) {
        setState(() {
          dashboard = value;
          error = null;
        });
      }
    } catch (cause) {
      if (mounted) setState(() => error = cause.toString());
    }
  }

  @override
  Widget build(BuildContext context) {
    final data = dashboard;
    return Scaffold(
      appBar: AppBar(
        backgroundColor: const Color(0xfff6f6f4),
        surfaceTintColor: Colors.transparent,
        title: const Brand(compact: true),
        actions: [
          IconButton(
            tooltip: 'Sign out',
            onPressed: () async {
              await widget.api.logout();
              widget.onSignedOut();
            },
            icon: const Icon(Icons.logout_rounded),
          ),
        ],
      ),
      body: error != null && data == null
          ? Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Text(error!),
              ),
            )
          : data == null
          ? const Center(child: CircularProgressIndicator(color: Colors.black))
          : IndexedStack(
              index: tab,
              children: [
                OverviewPage(data: data, onAdd: () => _capture(data)),
                DocumentsPage(api: widget.api, data: data, refresh: refresh),
                AskPage(
                  api: widget.api,
                  documentCount: data.documents
                      .where((item) => !item.isDeleted)
                      .length,
                ),
                FamilyPage(data: data),
                ActivityPage(data: data),
              ],
            ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: tab,
        onDestinationSelected: (value) => setState(() => tab = value),
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.home_outlined),
            selectedIcon: Icon(Icons.home),
            label: 'Home',
          ),
          NavigationDestination(
            icon: Icon(Icons.folder_outlined),
            selectedIcon: Icon(Icons.folder),
            label: 'Documents',
          ),
          NavigationDestination(
            icon: Icon(Icons.auto_awesome_outlined),
            selectedIcon: Icon(Icons.auto_awesome),
            label: 'Ask',
          ),
          NavigationDestination(
            icon: Icon(Icons.people_outline),
            selectedIcon: Icon(Icons.people),
            label: 'Family',
          ),
          NavigationDestination(icon: Icon(Icons.history), label: 'Activity'),
        ],
      ),
      floatingActionButton: tab <= 1
          ? FloatingActionButton.extended(
              backgroundColor: Colors.black,
              foregroundColor: Colors.white,
              onPressed: () => _capture(data!),
              icon: const Icon(Icons.add),
              label: const Text('Add'),
            )
          : null,
    );
  }

  Future<bool> _uploadCapture(
    File file,
    HouseholdPerson person,
    String route,
    bool confirmed,
    String operationKey,
  ) async {
    try {
      await widget.api.upload(
        file,
        [person.id],
        route,
        confirmed,
        operationKey,
      );
      return true;
    } catch (cause) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('$cause The result may be unknown; retry uses the same operation key.'),
            action: SnackBarAction(
              label: 'Retry',
              onPressed: () async {
                if (await _uploadCapture(file, person, route, confirmed, operationKey)) await refresh();
              },
            ),
          ),
        );
      }
      return false;
    }
  }

  Future<void> _capture(VaultDashboard data) async {
    final person = await showModalBottomSheet<HouseholdPerson>(
      context: context,
      showDragHandle: true,
      builder: (context) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 0, 20, 24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                'Add for whom?',
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: 10),
              ...data.people.map(
                (item) => ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: const CircleAvatar(
                    backgroundColor: Colors.black,
                    child: Icon(Icons.person, color: Colors.white),
                  ),
                  title: Text(item.name),
                  subtitle: Text(item.relationship),
                  onTap: () => Navigator.pop(context, item),
                ),
              ),
            ],
          ),
        ),
      ),
    );
    if (person == null || !mounted) return;
    final route = await showModalBottomSheet<String>(
      context: context,
      showDragHandle: true,
      builder: (context) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 0, 20, 24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ListTile(
                leading: const Icon(Icons.insert_drive_file_outlined),
                title: const Text('Choose files'),
                subtitle: const Text('Browse one or more device files'),
                onTap: () => Navigator.pop(context, 'FILE'),
              ),
              ListTile(
                leading: const Icon(Icons.camera_alt_outlined),
                title: const Text('Take a photo'),
                subtitle: const Text('Capture a document with the camera'),
                onTap: () => Navigator.pop(context, 'CAMERA'),
              ),
              ListTile(
                leading: const Icon(Icons.edit_note_outlined),
                title: const Text('Enter details manually'),
                subtitle: const Text('Create a searchable text record'),
                onTap: () => Navigator.pop(context, 'MANUAL'),
              ),
            ],
          ),
        ),
      ),
    );
    if (route == null || !mounted) return;
    final syntheticConfirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Synthetic test data only'),
        content: const Text(
          'This Azure development preview is not approved for real personal, family, customer or confidential documents. Confirm that the item you are about to add is entirely synthetic test data.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('I confirm'),
          ),
        ],
      ),
    );
    final confirmed = syntheticConfirmed ?? false;
    if (!confirmed || !mounted) return;
    try {
      if (route == 'FILE') {
        final files = await FilePicker.pickFiles();
        if (files.isEmpty && mounted) {
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('File selection cancelled. You can choose files again, use the camera, or enter details manually.')));
        }
        for (final file in files) {
          if (file.path != null) {
            final succeeded = await _uploadCapture(
              File(file.path!),
              person,
              'FILE',
              confirmed,
              widget.api.newOperationKey(),
            );
            if (!succeeded) return;
          }
        }
      } else if (route == 'CAMERA') {
        final image = await ImagePicker().pickImage(
          source: ImageSource.camera,
          imageQuality: 92,
        );
        if (image != null) {
          final succeeded = await _uploadCapture(
            File(image.path),
            person,
            'CAMERA',
            confirmed,
            widget.api.newOperationKey(),
          );
          if (!succeeded) return;
        } else if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Camera access was denied or capture was cancelled. Choose files or enter details manually instead.')));
        }
      } else {
        if (!mounted) return;
        await showDialog<void>(
          context: context,
          builder: (context) => ManualDocumentDialog(
            api: widget.api,
            person: person,
            syntheticConfirmed: confirmed,
          ),
        );
      }
      await refresh();
    } catch (cause) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text(cause.toString())));
      }
    }
  }
}

class OverviewPage extends StatelessWidget {
  const OverviewPage({super.key, required this.data, required this.onAdd});
  final VaultDashboard data;
  final VoidCallback onAdd;
  @override
  Widget build(BuildContext context) {
    final active = data.documents.where((item) => !item.isDeleted).toList();
    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 110),
      children: [
        const _TrustNote(
          text: 'Private mobile workspace · cloud connections require explicit consent',
        ),
        const SizedBox(height: 22),
        Text(
          'Your household,\nin order.',
          style: Theme.of(context).textTheme.headlineLarge,
        ),
        const SizedBox(height: 10),
        Text(
          data.workspaceName,
          style: const TextStyle(color: Colors.black54, fontSize: 17),
        ),
        const SizedBox(height: 24),
        Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: Colors.black,
            borderRadius: BorderRadius.circular(26),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Icon(Icons.lock_outline, color: Colors.white),
              const SizedBox(height: 22),
              Text(
                active.isEmpty
                    ? 'Start with one important document.'
                    : '${active.length} documents organised.',
                style: Theme.of(context).textTheme.headlineMedium
                    ?.copyWith(color: Colors.white),
              ),
              const SizedBox(height: 12),
              const Text(
                'Ask questions, review extracted details and see how records connect—always with source evidence.',
                style: TextStyle(color: Colors.white70, height: 1.45),
              ),
              const SizedBox(height: 18),
              OutlinedButton.icon(
                style: OutlinedButton.styleFrom(
                  foregroundColor: Colors.white,
                  side: const BorderSide(color: Colors.white30),
                ),
                onPressed: onAdd,
                icon: const Icon(Icons.add),
                label: const Text('Add document'),
              ),
            ],
          ),
        ),
        const SizedBox(height: 18),
        GridView.count(
          crossAxisCount: 2,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisSpacing: 12,
          mainAxisSpacing: 12,
          childAspectRatio: 1.12,
          children: [
            _Metric(value: active.length, label: 'Documents'),
            _Metric(value: data.factCount, label: 'Profile details'),
            _Metric(value: data.openTaskCount, label: 'Needs attention'),
            _Metric(value: data.people.length, label: 'People'),
          ],
        ),
      ],
    );
  }
}

class _Metric extends StatelessWidget {
  const _Metric({required this.value, required this.label});
  final int value;
  final String label;
  @override
  Widget build(BuildContext context) => Card(
    child: Padding(
      padding: const EdgeInsets.all(18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.end,
        children: [
          Text('$value', style: Theme.of(context).textTheme.headlineMedium),
          const SizedBox(height: 4),
          Text(label, style: const TextStyle(color: Colors.black54)),
        ],
      ),
    ),
  );
}

class DocumentsPage extends StatefulWidget {
  const DocumentsPage({
    super.key,
    required this.api,
    required this.data,
    required this.refresh,
  });
  final DoculyraApi api;
  final VaultDashboard data;
  final Future<void> Function() refresh;
  @override
  State<DocumentsPage> createState() => _DocumentsPageState();
}

class _DocumentsPageState extends State<DocumentsPage> {
  bool trash = false;
  @override
  Widget build(BuildContext context) {
    final documents = widget.data.documents
        .where((item) => item.isDeleted == trash)
        .toList();
    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 110),
      children: [
        Text('Documents', style: Theme.of(context).textTheme.headlineLarge),
        const SizedBox(height: 14),
        SegmentedButton<bool>(
          segments: const [
            ButtonSegment(
              value: false,
              label: Text('Library'),
              icon: Icon(Icons.folder_outlined),
            ),
            ButtonSegment(
              value: true,
              label: Text('Trash'),
              icon: Icon(Icons.delete_outline),
            ),
          ],
          selected: {trash},
          onSelectionChanged: (value) => setState(() => trash = value.first),
        ),
        const SizedBox(height: 18),
        if (documents.isEmpty)
          _Empty(
            icon: trash ? Icons.delete_outline : Icons.folder_outlined,
            title: trash ? 'Trash is empty' : 'No documents yet',
            body: trash
                ? 'Deleted items remain recoverable here for 30 days.'
                : 'Use Add to browse, scan or enter a record.',
          )
        else
          ...documents.map(
            (document) => Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Card(
                child: ListTile(
                  contentPadding: const EdgeInsets.all(16),
                  leading: Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      color: const Color(0xffeeeeeb),
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: Icon(
                      trash ? Icons.delete_outline : Icons.description_outlined,
                    ),
                  ),
                  title: Text(
                    document.name,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontWeight: FontWeight.w700),
                  ),
                  subtitle: Text(
                    trash
                        ? 'Final purge ${_date(document.purgeDueAt)}'
                        : document.libraryDescription,
                  ),
                  trailing: IconButton(
                    tooltip: trash ? 'Restore' : 'Move to Trash',
                    icon: Icon(trash ? Icons.restore : Icons.delete_outline),
                    onPressed: () async {
                      if (trash) {
                        await widget.api.restore(document.id);
                      } else {
                        await widget.api.trash(document.id);
                      }
                      await widget.refresh();
                    },
                  ),
                ),
              ),
            ),
          ),
      ],
    );
  }
}

class AskPage extends StatefulWidget {
  const AskPage({super.key, required this.api, required this.documentCount});
  final DoculyraApi api;
  final int documentCount;
  @override
  State<AskPage> createState() => _AskPageState();
}

class _AskPageState extends State<AskPage> {
  final question = TextEditingController();
  String? answer;
  List<dynamic> citations = const [];
  bool busy = false;
  @override
  Widget build(BuildContext context) => ListView(
    padding: const EdgeInsets.fromLTRB(20, 16, 20, 110),
    children: [
      Text(
        'Ask your documents',
        style: Theme.of(context).textTheme.headlineLarge,
      ),
      const SizedBox(height: 10),
      Text(
        '${widget.documentCount} authorised documents available. Every answer needs evidence.',
        style: const TextStyle(color: Colors.black54),
      ),
      const SizedBox(height: 24),
      TextField(
        controller: question,
        minLines: 3,
        maxLines: 6,
        decoration: const InputDecoration(
          hintText: 'What would you like to know?',
        ),
      ),
      const SizedBox(height: 12),
      FilledButton.icon(
        onPressed: busy || widget.documentCount == 0
            ? null
            : () async {
                setState(() => busy = true);
                final value = await widget.api.ask(question.text);
                setState(() {
                  busy = false;
                  answer = value['answer'].toString();
                  citations = value['citations'] as List<dynamic>;
                });
              },
        icon: const Icon(Icons.auto_awesome),
        label: Text(busy ? 'Searching evidence…' : 'Ask with evidence'),
      ),
      if (answer != null) ...[
        const SizedBox(height: 20),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'ANSWER',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 1.2,
                  ),
                ),
                const SizedBox(height: 12),
                Text(
                  answer!,
                  style: const TextStyle(fontSize: 17, height: 1.5),
                ),
                if (citations.isNotEmpty) ...[
                  const Divider(height: 32),
                  const Text(
                    'Evidence',
                    style: TextStyle(fontWeight: FontWeight.w700),
                  ),
                  ...citations.map((item) {
                    final citation = item as Map<String, dynamic>;
                    return Padding(
                      padding: const EdgeInsets.only(top: 10),
                      child: Text(
                        '• ${citation['documentName']}: ${citation['excerpt']}',
                        style: const TextStyle(color: Colors.black54),
                      ),
                    );
                  }),
                ],
              ],
            ),
          ),
        ),
      ],
    ],
  );
}

class FamilyPage extends StatelessWidget {
  const FamilyPage({super.key, required this.data});
  final VaultDashboard data;
  @override
  Widget build(BuildContext context) => ListView(
    padding: const EdgeInsets.fromLTRB(20, 16, 20, 110),
    children: [
      Text('Family access', style: Theme.of(context).textTheme.headlineLarge),
      const SizedBox(height: 10),
      const Text(
        'People and login access are separate. File permissions and every change remain reviewable.',
      ),
      const SizedBox(height: 18),
      ...data.people.map(
        (person) => Padding(
          padding: const EdgeInsets.only(bottom: 10),
          child: Card(
            child: ListTile(
              contentPadding: const EdgeInsets.all(16),
              leading: const CircleAvatar(
                backgroundColor: Colors.black,
                child: Icon(Icons.person, color: Colors.white),
              ),
              title: Text(
                person.name,
                style: const TextStyle(fontWeight: FontWeight.w700),
              ),
              subtitle: Text(person.relationship),
              trailing: const Icon(Icons.chevron_right),
            ),
          ),
        ),
      ),
    ],
  );
}

class ActivityPage extends StatelessWidget {
  const ActivityPage({super.key, required this.data});
  final VaultDashboard data;
  @override
  Widget build(BuildContext context) => ListView(
    padding: const EdgeInsets.fromLTRB(20, 16, 20, 110),
    children: [
      Text('Activity', style: Theme.of(context).textTheme.headlineLarge),
      const SizedBox(height: 10),
      const Text(
        'A detailed, content-minimised history of important workspace changes.',
      ),
      const SizedBox(height: 18),
      ...data.activity.map(
        (item) => Padding(
          padding: const EdgeInsets.only(bottom: 10),
          child: Card(
            child: ListTile(
              contentPadding: const EdgeInsets.all(16),
              leading: const Icon(Icons.history),
              title: Text(
                item.detail,
                style: const TextStyle(fontWeight: FontWeight.w600),
              ),
              subtitle: Text(
                '${item.actor} · ${_date(item.at)}\n${item.type.replaceAll('_', ' ').toLowerCase()}',
              ),
            ),
          ),
        ),
      ),
    ],
  );
}

class ManualDocumentDialog extends StatefulWidget {
  const ManualDocumentDialog({
    super.key,
    required this.api,
    required this.person,
    required this.syntheticConfirmed,
  });
  final DoculyraApi api;
  final HouseholdPerson person;
  final bool syntheticConfirmed;
  @override
  State<ManualDocumentDialog> createState() => _ManualDocumentDialogState();
}

class _ManualDocumentDialogState extends State<ManualDocumentDialog> {
  final name = TextEditingController(), content = TextEditingController();
  bool busy = false;
  @override
  Widget build(BuildContext context) => AlertDialog(
    title: const Text('Enter details manually'),
    content: SizedBox(
      width: 420,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          TextField(
            controller: name,
            decoration: const InputDecoration(labelText: 'Record name'),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: content,
            minLines: 5,
            maxLines: 9,
            decoration: InputDecoration(
              labelText: 'Details for ${widget.person.name}',
            ),
          ),
        ],
      ),
    ),
    actions: [
      TextButton(
        onPressed: () => Navigator.pop(context),
        child: const Text('Cancel'),
      ),
      FilledButton(
        onPressed: busy
            ? null
            : () async {
                setState(() => busy = true);
                await widget.api.addManual(name.text, content.text, [
                  widget.person.id,
                ], widget.syntheticConfirmed);
                if (context.mounted) Navigator.pop(context);
              },
        child: Text(busy ? 'Adding…' : 'Add record'),
      ),
    ],
  );
}

class _TrustNote extends StatelessWidget {
  const _TrustNote({required this.text});
  final String text;
  @override
  Widget build(BuildContext context) => Row(
    children: [
      const Icon(Icons.shield_outlined, size: 18),
      const SizedBox(width: 8),
      Expanded(
        child: Text(
          text,
          style: const TextStyle(fontSize: 13, color: Colors.black54),
        ),
      ),
    ],
  );
}

class _Empty extends StatelessWidget {
  const _Empty({required this.icon, required this.title, required this.body});
  final IconData icon;
  final String title;
  final String body;
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 70, horizontal: 20),
    child: Column(
      children: [
        Icon(icon, size: 48, color: Colors.black26),
        const SizedBox(height: 16),
        Text(title, style: Theme.of(context).textTheme.titleLarge),
        const SizedBox(height: 8),
        Text(
          body,
          textAlign: TextAlign.center,
          style: const TextStyle(color: Colors.black54),
        ),
      ],
    ),
  );
}

String _date(DateTime? value) =>
    value == null ? 'pending' : '${value.day}/${value.month}/${value.year}';
