from django.contrib.auth.models import Group, User
from rest_framework import status
from rest_framework.test import APITestCase

from clientes.models import Cliente
from .models import Equipo


class EquiposAPITestCase(APITestCase):
	equipos_url = "/api/equipos/"

	def setUp(self):
		Group.objects.get_or_create(name="Administrador")
		Group.objects.get_or_create(name="Recepción")
		Group.objects.get_or_create(name="Técnico")

		self.recepcion = User.objects.create_user(
			username="recepcion_equipo",
			password="Recepcion123!",
		)
		self.recepcion.groups.add(Group.objects.get(name="Recepción"))

		self.tecnico = User.objects.create_user(
			username="tecnico_equipo",
			password="Tecnico123!",
		)
		self.tecnico.groups.add(Group.objects.get(name="Técnico"))

		self.cliente = Cliente.objects.create(
			nombres="Mario",
			apellidos="López",
			tipo_documento="CC",
			numero_documento="100200300",
			telefono="3010000000",
			email="mario.lopez@example.com",
			direccion="Avenida 3",
			activo=True,
		)

		self.equipo = Equipo.objects.create(
			cliente=self.cliente,
			tipo_equipo="PORTATIL",
			marca="Lenovo",
			modelo="IdeaPad",
			numero_serie="SERIE-TEST-001",
			accesorios_recibidos="Cargador",
			estado_fisico="Bueno",
			problema_reportado="No enciende",
			estado_actual="INGRESADO",
		)

	def test_tecnico_can_update_equipo(self):
		self.client.force_authenticate(user=self.tecnico)
		response = self.client.patch(
			f"{self.equipos_url}{self.equipo.id}/",
			{"estado_actual": "DIAGNOSTICO"},
			format="json",
		)

		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.equipo.refresh_from_db()
		self.assertEqual(self.equipo.estado_actual, "DIAGNOSTICO")

	def test_tecnico_cannot_delete_equipo(self):
		self.client.force_authenticate(user=self.tecnico)
		response = self.client.delete(f"{self.equipos_url}{self.equipo.id}/")
		self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

	def test_filter_equipos_by_estado(self):
		self.client.force_authenticate(user=self.recepcion)
		response = self.client.get(f"{self.equipos_url}?estado=INGRESADO")

		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertEqual(len(response.data), 1)
