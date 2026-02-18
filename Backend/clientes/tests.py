from django.contrib.auth.models import Group, User
from rest_framework import status
from rest_framework.test import APITestCase


class ClientesAPITestCase(APITestCase):
	clientes_url = "/api/clientes/"
	token_url = "/api/auth/token/"

	def setUp(self):
		Group.objects.get_or_create(name="Administrador")
		Group.objects.get_or_create(name="Recepción")
		Group.objects.get_or_create(name="Técnico")

		self.recepcion = User.objects.create_user(
			username="recepcion_test",
			password="Recepcion123!",
		)
		self.recepcion.groups.add(Group.objects.get(name="Recepción"))

		self.tecnico = User.objects.create_user(
			username="tecnico_test",
			password="Tecnico123!",
		)
		self.tecnico.groups.add(Group.objects.get(name="Técnico"))

	def test_clientes_list_requires_authentication(self):
		response = self.client.get(self.clientes_url)
		self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

	def test_recepcion_can_create_cliente(self):
		self.client.force_authenticate(user=self.recepcion)
		payload = {
			"nombres": "Juan",
			"apellidos": "Pérez",
			"tipo_documento": "CC",
			"numero_documento": "900100200",
			"telefono": "3000000000",
			"email": "juan.perez@example.com",
			"direccion": "Calle 1",
			"activo": True,
		}

		response = self.client.post(self.clientes_url, payload, format="json")
		self.assertEqual(response.status_code, status.HTTP_201_CREATED)

	def test_tecnico_cannot_create_cliente(self):
		self.client.force_authenticate(user=self.tecnico)
		payload = {
			"nombres": "Ana",
			"apellidos": "García",
			"tipo_documento": "CC",
			"numero_documento": "900100201",
			"telefono": "3000000001",
			"email": "ana.garcia@example.com",
			"direccion": "Calle 2",
			"activo": True,
		}

		response = self.client.post(self.clientes_url, payload, format="json")
		self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

	def test_jwt_token_obtain_returns_access_and_refresh(self):
		payload = {
			"username": "recepcion_test",
			"password": "Recepcion123!",
		}

		response = self.client.post(self.token_url, payload, format="json")
		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertIn("access", response.data)
		self.assertIn("refresh", response.data)
