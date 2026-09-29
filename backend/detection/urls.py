from django.urls import path

from . import auth_views, views

urlpatterns = [
    path("auth/register/", auth_views.register, name="register"),
    path("auth/login/", auth_views.login_view, name="login"),
    path("auth/forgot/", auth_views.forgot_password, name="forgot-password"),
    path("auth/reset/", auth_views.reset_password, name="reset-password"),
    path("auth/logout/", auth_views.logout_view, name="logout"),
    path("auth/me/", auth_views.me, name="me"),
    path("predict/", views.predict_disease, name="predict-disease"),
    path("scans/", views.my_scans, name="my-scans"),
    path("advisories/", views.advisories, name="advisories"),
    path("advisories/<int:pk>/", views.advisory_detail, name="advisory-detail"),
    path("demands/", views.demands, name="demands"),
    path("demands/<int:pk>/", views.demand_detail, name="demand-detail"),
    path("produce/", views.produce, name="produce"),
    path("produce/<int:pk>/", views.produce_detail, name="produce-detail"),
    path("health/", views.health_check, name="health-check"),
]
