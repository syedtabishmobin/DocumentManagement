import 'package:doculyra_mobile/api_client.dart';
import 'package:doculyra_mobile/main.dart';
import 'package:flutter_test/flutter_test.dart';

class FakeApi extends DoculyraApi {
  @override
  Future<Map<String, dynamic>> session() async => {
    'authenticated': false,
    'onboardingComplete': false,
  };
}

void main() {
  testWidgets('shows the Doculyra mobile authentication shell', (tester) async {
    await tester.pumpWidget(DoculyraApp(api: FakeApi()));
    await tester.pumpAndSettle();
    expect(find.text('Doculyra'), findsOneWidget);
    expect(find.text('Welcome back.'), findsOneWidget);
    expect(find.text('Sign in'), findsOneWidget);
  });
}
