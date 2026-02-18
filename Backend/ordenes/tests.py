from django.contrib.auth.models import Group, User
from rest_framework import status
from rest_framework.test import APITestCase

from clientes.models import Cliente
from equipos.models import Equipo
from .models import HistorialOrden, OrdenTrabajo


class OrdenesAPITestCase(APITestCase):
	ordenes_url = "/api/ordenes/"

	def setUp(self):
		Group.objects.get_or_create(name="Administrador")
		Group.objects.get_or_create(name="Recepción")
		Group.objects.get_or_create(name="Técnico")

		self.recepcion = User.objects.create_user(username="recep_orden", password="Recep12345!")
		self.recepcion.groups.add(Group.objects.get(name="Recepción"))

		self.tecnico = User.objects.create_user(username="tec_orden", password="Tec12345!")
		self.tecnico.groups.add(Group.objects.get(name="Técnico"))

		self.cliente = Cliente.objects.create(
			nombres="Sara",
			apellidos="Torres",
			tipo_documento="CC",
			numero_documento="700100200",
			telefono="3010000000",
			email="sara.torres@example.com",
			direccion="Calle 9",
			activo=True,
		)

		self.equipo = Equipo.objects.create(
			cliente=self.cliente,
			tipo_equipo="PORTATIL",
			marca="Dell",
			modelo="Latitude",
			numero_serie="ORD-SERIE-01",
			accesorios_recibidos="Cargador",
			estado_fisico="Bueno",
			problema_reportado="No carga sistema",
			estado_actual="INGRESADO",
		)

	def test_recepcion_can_create_orden(self):
		self.client.force_authenticate(user=self.recepcion)
		payload = {
			"equipo": self.equipo.id,
			"tecnico_asignado": self.tecnico.id,
			"descripcion_falla": "No enciende",
			"diagnostico": "",
			"solucion": "",
			"costo_estimado": "45000.00",
			"costo_final": "0.00",
			"estado": "INGRESADO",
		}

		response = self.client.post(self.ordenes_url, payload, format="json")
		self.assertEqual(response.status_code, status.HTTP_201_CREATED)
		self.assertEqual(OrdenTrabajo.objects.count(), 1)
		self.assertEqual(HistorialOrden.objects.count(), 1)

	def test_tecnico_cannot_create_orden(self):
		self.client.force_authenticate(user=self.tecnico)
		payload = {
			"equipo": self.equipo.id,
			"descripcion_falla": "Falla de arranque",
			"costo_estimado": "30000.00",
			"costo_final": "0.00",
			"estado": "INGRESADO",
		}
		response = self.client.post(self.ordenes_url, payload, format="json")
		self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

	def test_tecnico_can_update_estado_and_history_is_created(self):
		orden = OrdenTrabajo.objects.create(
			equipo=self.equipo,
			recepcionista=self.recepcion,
			tecnico_asignado=self.tecnico,
			descripcion_falla="Sin video",
			costo_estimado="20000.00",
			costo_final="0.00",
			estado="INGRESADO",
		)
		HistorialOrden.objects.create(
			orden=orden,
			estado_anterior="",
			estado_nuevo="INGRESADO",
			comentario="Creación",
			usuario=self.recepcion,
		)

		self.client.force_authenticate(user=self.tecnico)
		response = self.client.patch(
			f"{self.ordenes_url}{orden.id}/",
			{"estado": "DIAGNOSTICO", "diagnostico": "Falla de memoria RAM"},
			format="json",
		)

		self.assertEqual(response.status_code, status.HTTP_200_OK)
		orden.refresh_from_db()
		self.assertEqual(orden.estado, "DIAGNOSTICO")
		self.assertEqual(HistorialOrden.objects.filter(orden=orden).count(), 2)
