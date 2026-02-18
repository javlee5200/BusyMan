from rest_framework.permissions import BasePermission


class ReportesGroupPermission(BasePermission):
    message = "No tienes permisos para consultar reportes."

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False

        if user.is_superuser:
            return True

        group_names = set(user.groups.values_list("name", flat=True))
        return bool({"Administrador", "Recepción", "Técnico"}.intersection(group_names))
