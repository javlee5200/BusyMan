from django.db import transaction
from rest_framework import serializers

from .models import ConsumoOrden, MovimientoInventario, Repuesto


class RepuestoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Repuesto
        fields = [
            "id",
            "nombre",
            "codigo",
            "descripcion",
            "stock_actual",
            "stock_minimo",
            "costo_unitario",
            "activo",
            "fecha_creacion",
            "fecha_actualizacion",
        ]
        read_only_fields = ["id", "fecha_creacion", "fecha_actualizacion"]


class MovimientoInventarioSerializer(serializers.ModelSerializer):
    repuesto_codigo = serializers.CharField(source="repuesto.codigo", read_only=True)

    class Meta:
        model = MovimientoInventario
        fields = [
            "id",
            "repuesto",
            "repuesto_codigo",
            "tipo",
            "cantidad",
            "motivo",
            "orden_referencia",
            "usuario",
            "fecha",
        ]
        read_only_fields = ["id", "usuario", "fecha", "repuesto_codigo"]

    def validate_cantidad(self, value):
        if value <= 0:
            raise serializers.ValidationError("La cantidad debe ser mayor que cero.")
        return value

    @transaction.atomic
    def create(self, validated_data):
        request = self.context.get("request")
        repuesto = validated_data["repuesto"]
        tipo = validated_data["tipo"]
        cantidad = validated_data["cantidad"]

        if tipo == "ENTRADA":
            repuesto.stock_actual += cantidad
        elif tipo in {"SALIDA", "AJUSTE"}:
            if repuesto.stock_actual < cantidad:
                raise serializers.ValidationError("Stock insuficiente para realizar la salida/ajuste.")
            repuesto.stock_actual -= cantidad

        repuesto.save(update_fields=["stock_actual", "fecha_actualizacion"])

        validated_data["usuario"] = request.user if request else None
        return super().create(validated_data)


class ConsumoOrdenSerializer(serializers.ModelSerializer):
    repuesto_codigo = serializers.CharField(source="repuesto.codigo", read_only=True)

    class Meta:
        model = ConsumoOrden
        fields = [
            "id",
            "orden",
            "repuesto",
            "repuesto_codigo",
            "cantidad",
            "precio_unitario",
            "usuario",
            "fecha",
        ]
        read_only_fields = ["id", "usuario", "fecha", "repuesto_codigo"]

    def validate_cantidad(self, value):
        if value <= 0:
            raise serializers.ValidationError("La cantidad debe ser mayor que cero.")
        return value

    @transaction.atomic
    def create(self, validated_data):
        request = self.context.get("request")
        repuesto = validated_data["repuesto"]
        orden = validated_data["orden"]
        cantidad = validated_data["cantidad"]

        if repuesto.stock_actual < cantidad:
            raise serializers.ValidationError("Stock insuficiente para registrar el consumo.")

        repuesto.stock_actual -= cantidad
        repuesto.save(update_fields=["stock_actual", "fecha_actualizacion"])

        validated_data["usuario"] = request.user if request else None
        consumo = super().create(validated_data)

        MovimientoInventario.objects.create(
            repuesto=repuesto,
            tipo="SALIDA",
            cantidad=cantidad,
            motivo=f"Consumo en orden OT-{orden.id}",
            orden_referencia=orden,
            usuario=validated_data["usuario"],
        )

        return consumo
