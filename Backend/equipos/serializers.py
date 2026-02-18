from rest_framework import serializers

from .models import Equipo


class EquipoSerializer(serializers.ModelSerializer):
    cliente_nombre = serializers.CharField(source="cliente.nombres", read_only=True)
    cliente_apellido = serializers.CharField(source="cliente.apellidos", read_only=True)

    class Meta:
        model = Equipo
        fields = [
            "id",
            "cliente",
            "cliente_nombre",
            "cliente_apellido",
            "tipo_equipo",
            "marca",
            "modelo",
            "numero_serie",
            "accesorios_recibidos",
            "estado_fisico",
            "problema_reportado",
            "estado_actual",
            "fecha_ingreso",
            "fecha_actualizacion",
        ]
        read_only_fields = ["id", "fecha_ingreso", "fecha_actualizacion"]
