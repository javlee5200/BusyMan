from drf_spectacular.utils import OpenApiExample, OpenApiResponse, extend_schema
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView


@extend_schema(
    tags=["Auth"],
    summary="Obtener token JWT",
    description="Recibe usuario y contraseña, y retorna tokens access/refresh.",
    examples=[
        OpenApiExample(
            "Login JWT - request",
            value={
                "username": "recepcion_test",
                "password": "Recepcion123!",
            },
            request_only=True,
        ),
        OpenApiExample(
            "Login JWT - response",
            value={
                "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
            },
            response_only=True,
        ),
    ],
    responses={200: OpenApiResponse(description="Tokens JWT generados correctamente")},
)
class BusyManTokenObtainPairView(TokenObtainPairView):
    pass


@extend_schema(
    tags=["Auth"],
    summary="Renovar access token",
    description="Recibe refresh token y retorna un nuevo access token.",
    examples=[
        OpenApiExample(
            "Refresh JWT - request",
            value={
                "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
            },
            request_only=True,
        ),
        OpenApiExample(
            "Refresh JWT - response",
            value={
                "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
            },
            response_only=True,
        ),
    ],
    responses={200: OpenApiResponse(description="Access token renovado correctamente")},
)
class BusyManTokenRefreshView(TokenRefreshView):
    pass
