from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.http import HttpResponse
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
import pandas as pd
import json
from .models import Dataset
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
import io

@api_view(['POST'])
@permission_classes([AllowAny])
def register_user(request):
    username = request.data.get('username')
    password = request.data.get('password')
    email = request.data.get('email', '')
    
    if not username or not password:
        return Response({'error': 'Username and password required'}, status=status.HTTP_400_BAD_REQUEST)
    
    if User.objects.filter(username=username).exists():
        return Response({'error': 'Username already exists'}, status=status.HTTP_400_BAD_REQUEST)
    
    user = User.objects.create_user(username=username, password=password, email=email)
    return Response({'message': 'User created successfully'}, status=status.HTTP_201_CREATED)

@api_view(['POST'])
@permission_classes([AllowAny])
def login_user(request):
    username = request.data.get('username')
    password = request.data.get('password')
    
    user = authenticate(username=username, password=password)
    if user:
        return Response({'message': 'Login successful'}, status=status.HTTP_200_OK)
    else:
        return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_csv(request):
    if 'file' not in request.FILES:
        return Response({'error': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)
    
    file = request.FILES['file']
    try:
        df = pd.read_csv(file)
        
        # Validate required columns
        required_cols = ['Equipment Name', 'Type', 'Flowrate', 'Pressure', 'Temperature']
        if not all(col in df.columns for col in required_cols):
            return Response({'error': 'Missing required columns'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Calculate summary statistics
        summary = {
            'total_count': len(df),
            'avg_flowrate': df['Flowrate'].mean(),
            'avg_pressure': df['Pressure'].mean(),
            'avg_temperature': df['Temperature'].mean(),
            'type_distribution': df['Type'].value_counts().to_dict()
        }
        
        # Save dataset (keep only last 5 for this user)
        Dataset.objects.create(
            user=request.user,
            name=file.name,
            data=df.to_json(orient='records'),
            summary=json.dumps(summary)
        )
        
        # Keep only last 5 datasets for this user
        user_datasets = Dataset.objects.filter(user=request.user)
        if len(user_datasets) > 5:
            user_datasets[5:].delete()
        
        return Response({
            'data': df.to_dict('records'),
            'summary': summary
        })
    
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_history(request):
    datasets = Dataset.objects.filter(user=request.user)[:5]
    history = []
    for dataset in datasets:
        history.append({
            'id': dataset.id,
            'name': dataset.name,
            'uploaded_at': dataset.uploaded_at,
            'summary': dataset.get_summary()
        })
    return Response(history)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_dataset(request, dataset_id):
    try:
        dataset = Dataset.objects.get(id=dataset_id, user=request.user)
        return Response({
            'data': dataset.get_data(),
            'summary': dataset.get_summary()
        })
    except Dataset.DoesNotExist:
        return Response({'error': 'Dataset not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_report(request):
    dataset_id = request.data.get('dataset_id')
    try:
        dataset = Dataset.objects.get(id=dataset_id, user=request.user)
        summary = dataset.get_summary()
        
        buffer = io.BytesIO()
        p = canvas.Canvas(buffer, pagesize=letter)
        
        p.drawString(100, 750, f"Equipment Analysis Report - {dataset.name}")
        p.drawString(100, 720, f"Total Equipment: {summary['total_count']}")
        p.drawString(100, 700, f"Average Flowrate: {summary['avg_flowrate']:.2f}")
        p.drawString(100, 680, f"Average Pressure: {summary['avg_pressure']:.2f}")
        p.drawString(100, 660, f"Average Temperature: {summary['avg_temperature']:.2f}")
        
        y = 620
        p.drawString(100, y, "Equipment Type Distribution:")
        for eq_type, count in summary['type_distribution'].items():
            y -= 20
            p.drawString(120, y, f"{eq_type}: {count}")
        
        p.save()
        buffer.seek(0)
        
        response = HttpResponse(buffer.getvalue(), content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="report_{dataset.name}.pdf"'
        return response
        
    except Dataset.DoesNotExist:
        return Response({'error': 'Dataset not found'}, status=status.HTTP_404_NOT_FOUND)