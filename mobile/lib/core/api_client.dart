import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'storage.dart';

class ApiClient {
  // 10.0.2.2 points to host localhost in Android Emulator; 127.0.0.1 on web/desktop
  static String baseUrl = kIsWeb ? 'http://localhost:8000/api/v1' : 'http://10.0.2.2:8000/api/v1';

  static Dio createDio() {
    final dio = Dio(
      BaseOptions(
        baseUrl: baseUrl,
        connectTimeout: const Duration(seconds: 15),
        receiveTimeout: const Duration(seconds: 15),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );

    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await SecureStorageService.getAccessToken();
          if (token != null && token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          return handler.next(options);
        },
        onError: (DioException e, handler) async {
          // If 401 Unauthorized, attempt refresh token
          if (e.response?.statusCode == 401) {
            final refreshToken = await SecureStorageService.getRefreshToken();
            if (refreshToken != null && refreshToken.isNotEmpty) {
              try {
                final refreshDio = Dio(BaseOptions(baseUrl: baseUrl));
                final res = await refreshDio.post(
                  '/auth/refresh',
                  data: {'refresh_token': refreshToken},
                );
                if (res.statusCode == 200) {
                  final newAccess = res.data['access_token'];
                  await SecureStorageService.saveTokens(
                    accessToken: newAccess,
                    refreshToken: refreshToken,
                  );
                  // Retry original request with new token
                  e.requestOptions.headers['Authorization'] = 'Bearer $newAccess';
                  final retryResp = await dio.fetch(e.requestOptions);
                  return handler.resolve(retryResp);
                }
              } catch (_) {
                await SecureStorageService.clearAll();
              }
            }
          }
          return handler.next(e);
        },
      ),
    );

    return dio;
  }
}
