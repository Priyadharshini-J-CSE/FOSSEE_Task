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
        summary = dataset.get_summary()
        history.append({
            'id': dataset.id,
            'name': dataset.name,
            'uploaded_at': dataset.uploaded_at,
            'summary': summary,
            'preview_chart_data': {
                'type_distribution': summary['type_distribution'],
                'total_count': summary['total_count']
            }
        })
    return Response(history)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_dataset(request, dataset_id):
    try:
        dataset = Dataset.objects.get(id=dataset_id, user=request.user)
        data = dataset.get_data()
        summary = dataset.get_summary()
        
        # Generate analytics data for charts
        df = pd.DataFrame(data)
        analytics = {
            'type_distribution': summary['type_distribution'],
            'parameter_trends': {
                'equipment_names': [item['Equipment Name'] for item in data],
                'flowrates': [item['Flowrate'] for item in data],
                'pressures': [item['Pressure'] for item in data],
                'temperatures': [item['Temperature'] for item in data]
            },
            'statistics': {
                'flowrate_stats': {
                    'min': df['Flowrate'].min(),
                    'max': df['Flowrate'].max(),
                    'mean': df['Flowrate'].mean(),
                    'std': df['Flowrate'].std()
                },
                'pressure_stats': {
                    'min': df['Pressure'].min(),
                    'max': df['Pressure'].max(),
                    'mean': df['Pressure'].mean(),
                    'std': df['Pressure'].std()
                },
                'temperature_stats': {
                    'min': df['Temperature'].min(),
                    'max': df['Temperature'].max(),
                    'mean': df['Temperature'].mean(),
                    'std': df['Temperature'].std()
                }
            }
        }
        
        return Response({
            'data': data,
            'summary': summary,
            'analytics': analytics
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

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_dashboard(request):
    try:
        datasets = Dataset.objects.filter(user=request.user)[:5]
        if not datasets:
            return Response({'message': 'No data available'})
        
        # Aggregate data from all datasets
        all_data = []
        total_equipment = 0
        type_counts = {}
        
        for dataset in datasets:
            data = dataset.get_data()
            summary = dataset.get_summary()
            all_data.extend(data)
            total_equipment += summary['total_count']
            
            for eq_type, count in summary['type_distribution'].items():
                type_counts[eq_type] = type_counts.get(eq_type, 0) + count
        
        # Calculate smart insights
        df = pd.DataFrame(all_data)
        
        dashboard_data = {
            'overview': {
                'total_equipment': total_equipment,
                'total_datasets': len(datasets),
                'equipment_types': len(type_counts),
                'avg_flowrate': df['Flowrate'].mean(),
                'avg_pressure': df['Pressure'].mean(),
                'avg_temperature': df['Temperature'].mean()
            },
            'type_distribution': type_counts,
            'insights': {
                'most_common_type': max(type_counts, key=type_counts.get) if type_counts else 'None',
                'efficiency_score': min(100, max(0, 100 - df['Flowrate'].std())),
                'outliers': len(df[abs(df['Flowrate'] - df['Flowrate'].mean()) > 2 * df['Flowrate'].std()])
            }
        }
        
        return Response(dashboard_data)
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)