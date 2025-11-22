from django.urls import path
from . import views

urlpatterns = [
    path('register/', views.register_user, name='register_user'),
    path('login/', views.login_user, name='login_user'),
    path('upload/', views.upload_csv, name='upload_csv'),
    path('history/', views.get_history, name='get_history'),
    path('dataset/<int:dataset_id>/', views.get_dataset, name='get_dataset'),
    path('report/', views.generate_report, name='generate_report'),
]