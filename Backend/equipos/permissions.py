from rest_framework.permissions import BasePermission


class EquipoGroupPermission(BasePermission):
    message = "No tienes permisos para realizar esta acción en equipos."

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False

        if user.is_superuser:
            return True

        group_names = set(user.groups.values_list("name", flat=True))

        if "Administrador" in group_names:
            return True

        if view.action in {"list", "retrieve"}:
            return bool({"Recepción", "Técnico"}.intersection(group_names))

        if view.action in {"create", "update", "partial_update"}:
            return "Recepción" in group_names or "Técnico" in group_names

        if view.action == "destroy":
            return False

        return False
