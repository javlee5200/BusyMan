from rest_framework.permissions import IsAuthenticated
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.viewsets import ModelViewSet

from .models import Cliente
from .permissions import ClienteGroupPermission
from .serializers import ClienteSerializer


class ClienteViewSet(ModelViewSet):
	queryset = Cliente.objects.all()
	serializer_class = ClienteSerializer
	permission_classes = [IsAuthenticated, ClienteGroupPermission]
	filter_backends = [SearchFilter, OrderingFilter]
	search_fields = ["nombres", "apellidos", "numero_documento", "telefono", "email"]
	ordering_fields = ["fecha_registro", "nombres", "apellidos", "numero_documento"]
	ordering = ["-fecha_registro"]
