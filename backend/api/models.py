from django.db import models
from django.contrib.auth.models import User
import json

class Dataset(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    data = models.TextField()  # JSON string of the data
    summary = models.TextField()  # JSON string of summary stats
    
    class Meta:
        ordering = ['-uploaded_at']
    
    def get_data(self):
        return json.loads(self.data)
    
    def get_summary(self):
        return json.loads(self.summary)