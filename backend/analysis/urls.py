from django.urls import path
from . import views
urlpatterns = [
    path('submit/', views.submit_analysis, name='analysis-submit'),
    path('history/', views.analysis_history, name='analysis-history'),
    path('detail/<int:pk>/', views.analysis_detail, name='analysis-detail'),
    path('share/<uuid:share_uuid>/', views.public_share, name='analysis-public-share'),
    path('wakeup/', views.wakeup_ml_service, name='analysis-wakeup'),
]