import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class SecureStorageService {
  static const _storage = FlutterSecureStorage();
  static const _tokenKey = 'jwt_access_token';
  static const _refreshKey = 'jwt_refresh_token';
  static const _userEmailKey = 'user_email';

  static Future<void> saveTokens({required String accessToken, required String refreshToken}) async {
    await _storage.write(key: _tokenKey, value: accessToken);
    await _storage.write(key: _refreshKey, value: refreshToken);
  }

  static Future<String?> getAccessToken() async {
    return await _storage.read(key: _tokenKey);
  }

  static Future<String?> getRefreshToken() async {
    return await _storage.read(key: _refreshKey);
  }

  static Future<void> clearAll() async {
    await _storage.deleteAll();
  }

  static Future<void> saveUserEmail(String email) async {
    await _storage.write(key: _userEmailKey, value: email);
  }

  static Future<String?> getUserEmail() async {
    return await _storage.read(key: _userEmailKey);
  }
}
