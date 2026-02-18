from django.contrib.auth.models import Group, User
from rest_framework import status
from rest_framework.test import APITestCase


class UsuariosTecnicosComboAPITestCase(APITestCase):
	endpoint = "/api/usuarios/tecnicos/"

	def setUp(self):
		self.admin_group, _ = Group.objects.get_or_create(name="Administrador")
		self.recepcion_group, _ = Group.objects.get_or_create(name="Recepción")
		self.tecnico_group, _ = Group.objects.get_or_create(name="Técnico")

		self.recepcion = User.objects.create_user(username="recep_combo", password="Recep12345!")
		self.recepcion.groups.add(self.recepcion_group)

		self.tecnico_1 = User.objects.create_user(
			username="tec_combo_1",
			password="Tec12345!",
			first_name="Ana",
			last_name="Ruiz",
		)
		self.tecnico_1.groups.add(self.tecnico_group)

		self.tecnico_2 = User.objects.create_user(
			username="tec_combo_2",
			password="Tec12345!",
		)
		self.tecnico_2.groups.add(self.tecnico_group)

		self.inactivo = User.objects.create_user(
			username="tec_inactivo",
			password="Tec12345!",
			is_active=False,
		)
		self.inactivo.groups.add(self.tecnico_group)

	def test_requires_authentication(self):
		response = self.client.get(self.endpoint)
		self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

	def test_recepcion_can_list_tecnicos_combo(self):
		self.client.force_authenticate(user=self.recepcion)

		response = self.client.get(self.endpoint)

		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertEqual(len(response.data), 2)

		usernames = {item["username"] for item in response.data}
		self.assertSetEqual(usernames, {"tec_combo_1", "tec_combo_2"})

		ana = next(item for item in response.data if item["username"] == "tec_combo_1")
		self.assertEqual(ana["value"], self.tecnico_1.id)
		self.assertEqual(ana["label"], "Ana Ruiz")

		sin_nombre = next(item for item in response.data if item["username"] == "tec_combo_2")
		self.assertEqual(sin_nombre["label"], "tec_combo_2")
