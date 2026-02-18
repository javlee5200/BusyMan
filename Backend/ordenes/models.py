from django.db import models
from django.contrib.auth.models import User

from equipos.models import Equipo


class OrdenTrabajo(models.Model):
	ESTADO_CHOICES = [
		("INGRESADO", "Ingresado"),
		("DIAGNOSTICO", "En diagnóstico"),
		("REPARACION", "En reparación"),
		("LISTO", "Listo"),
		("ENTREGADO", "Entregado"),
	]

	equipo = models.ForeignKey(Equipo, on_delete=models.PROTECT, related_name="ordenes")
	recepcionista = models.ForeignKey(
		User,
		on_delete=models.SET_NULL,
		null=True,
		blank=True,
		related_name="ordenes_recepcionadas",
	)
	tecnico_asignado = models.ForeignKey(
		User,
		on_delete=models.SET_NULL,
		null=True,
		blank=True,
		related_name="ordenes_asignadas",
	)
	descripcion_falla = models.TextField()
	diagnostico = models.TextField(blank=True)
	solucion = models.TextField(blank=True)
	costo_estimado = models.DecimalField(max_digits=12, decimal_places=2, default=0)
	costo_final = models.DecimalField(max_digits=12, decimal_places=2, default=0)
	estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default="INGRESADO")
	fecha_creacion = models.DateTimeField(auto_now_add=True)
	fecha_actualizacion = models.DateTimeField(auto_now=True)
	fecha_entrega = models.DateTimeField(null=True, blank=True)

	class Meta:
		ordering = ["-fecha_creacion"]

	def __str__(self):
		return f"OT-{self.id} | {self.equipo} | {self.estado}"


class HistorialOrden(models.Model):
	orden = models.ForeignKey(OrdenTrabajo, on_delete=models.CASCADE, related_name="historial")
	estado_anterior = models.CharField(max_length=20, blank=True)
	estado_nuevo = models.CharField(max_length=20, choices=OrdenTrabajo.ESTADO_CHOICES)
	comentario = models.TextField(blank=True)
	usuario = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
	fecha = models.DateTimeField(auto_now_add=True)

	class Meta:
		ordering = ["-fecha"]

	def __str__(self):
		return f"OT-{self.orden_id}: {self.estado_anterior or '-'} -> {self.estado_nuevo}"
