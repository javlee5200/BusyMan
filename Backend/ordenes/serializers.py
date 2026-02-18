from rest_framework import serializers

from .models import HistorialOrden, OrdenTrabajo


class HistorialOrdenSerializer(serializers.ModelSerializer):
    usuario_username = serializers.CharField(source="usuario.username", read_only=True)

    class Meta:
        model = HistorialOrden
        fields = [
            "id",
            "estado_anterior",
            "estado_nuevo",
            "comentario",
            "usuario",
            "usuario_username",
            "fecha",
        ]
        read_only_fields = fields


class OrdenTrabajoSerializer(serializers.ModelSerializer):
    historial = HistorialOrdenSerializer(many=True, read_only=True)
    equipo_marca = serializers.CharField(source="equipo.marca", read_only=True)
    equipo_modelo = serializers.CharField(source="equipo.modelo", read_only=True)
    cliente_nombre = serializers.CharField(source="equipo.cliente.nombres", read_only=True)
    cliente_apellido = serializers.CharField(source="equipo.cliente.apellidos", read_only=True)

    class Meta:
        model = OrdenTrabajo
        fields = [
            "id",
            "equipo",
            "equipo_marca",
            "equipo_modelo",
            "cliente_nombre",
            "cliente_apellido",
            "recepcionista",
            "tecnico_asignado",
            "descripcion_falla",
            "diagnostico",
            "solucion",
            "costo_estimado",
            "costo_final",
            "estado",
            "fecha_creacion",
            "fecha_actualizacion",
            "fecha_entrega",
            "historial",
        ]
        read_only_fields = [
            "id",
            "fecha_creacion",
            "fecha_actualizacion",
            "fecha_entrega",
            "historial",
            "equipo_marca",
            "equipo_modelo",
            "cliente_nombre",
            "cliente_apellido",
        ]
