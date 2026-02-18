from rest_framework import serializers

from .models import Cliente


class ClienteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cliente
        fields = [
            "id",
            "nombres",
            "apellidos",
            "tipo_documento",
            "numero_documento",
            "telefono",
            "email",
            "direccion",
            "activo",
            "fecha_registro",
            "fecha_actualizacion",
        ]
        read_only_fields = ["id", "fecha_registro", "fecha_actualizacion"]
