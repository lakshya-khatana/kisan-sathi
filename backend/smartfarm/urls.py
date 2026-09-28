import re

from django.conf import settings
from django.contrib import admin
from django.urls import include, path, re_path
from django.views.generic import TemplateView

urlpatterns = [
    path(settings.ADMIN_URL, admin.site.urls),
    path("api/", include("detection.urls")),
    # Everything else is the React single-page app (client-side routes like /login, /farmer).
    re_path(rf"^(?!api/|static/|{re.escape(settings.ADMIN_URL)}).*$", TemplateView.as_view(template_name="index.html")),
]
