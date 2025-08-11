"""
Data Connector Models
Manages external data source connections and data ingestion
"""

from datetime import datetime
from . import db

class DataConnector(db.Model):
    """Base model for external data connections"""
    __tablename__ = 'data_connectors'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    connector_type = db.Column(db.String(50), nullable=False)  # excel, google_analytics, etc.
    status = db.Column(db.String(20), default='active')  # active, inactive, error
    
    # Connection configuration (JSON)
    config = db.Column(db.JSON)
    
    # Metadata
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_sync = db.Column(db.DateTime)
    
    # Data summary
    records_count = db.Column(db.Integer, default=0)
    columns_count = db.Column(db.Integer, default=0)
    
    # Relationships
    datasets = db.relationship('ConnectorDataset', backref='connector', lazy=True, cascade='all, delete-orphan')
    
    def __init__(self, user_id, name, connector_type, config=None):
        self.user_id = user_id
        self.name = name
        self.connector_type = connector_type
        self.config = config or {}
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'connector_type': self.connector_type,
            'status': self.status,
            'config': self.config,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'last_sync': self.last_sync.isoformat() if self.last_sync else None,
            'records_count': self.records_count,
            'columns_count': self.columns_count,
            'datasets_count': len(self.datasets)
        }

class ConnectorDataset(db.Model):
    """Represents a dataset from a connector (e.g., a sheet, a report, etc.)"""
    __tablename__ = 'connector_datasets'
    
    id = db.Column(db.Integer, primary_key=True)
    connector_id = db.Column(db.Integer, db.ForeignKey('data_connectors.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    dataset_id = db.Column(db.String(200))  # External dataset ID
    
    # Schema information
    columns = db.Column(db.JSON)  # List of column definitions
    data_types = db.Column(db.JSON)  # Column data types
    
    # Data summary
    records_count = db.Column(db.Integer, default=0)
    last_updated = db.Column(db.DateTime)
    
    # Metadata
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __init__(self, connector_id, name, dataset_id=None):
        self.connector_id = connector_id
        self.name = name
        self.dataset_id = dataset_id
    
    def to_dict(self):
        return {
            'id': self.id,
            'connector_id': self.connector_id,
            'name': self.name,
            'dataset_id': self.dataset_id,
            'columns': self.columns,
            'data_types': self.data_types,
            'records_count': self.records_count,
            'last_updated': self.last_updated.isoformat() if self.last_updated else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class DataAnalysis(db.Model):
    """Enhanced analysis model with multiple analysis types"""
    __tablename__ = 'data_analyses'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    connector_id = db.Column(db.Integer, db.ForeignKey('data_connectors.id'), nullable=True)
    dataset_id = db.Column(db.Integer, db.ForeignKey('connector_datasets.id'), nullable=True)
    
    # Analysis configuration
    name = db.Column(db.String(100), nullable=False)
    analysis_type = db.Column(db.String(50), nullable=False)  # root_cause, statistical, gap, correlation, ml, scenario, optimization
    status = db.Column(db.String(20), default='pending')  # pending, running, completed, failed
    
    # Analysis parameters
    parameters = db.Column(db.JSON)  # Analysis-specific parameters
    
    # Results
    results = db.Column(db.JSON)  # Analysis results
    insights = db.Column(db.Text)  # AI-generated insights
    visualizations = db.Column(db.JSON)  # Chart configurations
    
    # Execution metadata
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    started_at = db.Column(db.DateTime)
    completed_at = db.Column(db.DateTime)
    execution_time_ms = db.Column(db.Integer)
    
    # AI metadata
    model_used = db.Column(db.String(50))
    tokens_used = db.Column(db.Integer)
    
    def __init__(self, user_id, name, analysis_type, parameters=None):
        self.user_id = user_id
        self.name = name
        self.analysis_type = analysis_type
        self.parameters = parameters or {}
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'connector_id': self.connector_id,
            'dataset_id': self.dataset_id,
            'name': self.name,
            'analysis_type': self.analysis_type,
            'status': self.status,
            'parameters': self.parameters,
            'results': self.results,
            'insights': self.insights,
            'visualizations': self.visualizations,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'started_at': self.started_at.isoformat() if self.started_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            'execution_time_ms': self.execution_time_ms,
            'model_used': self.model_used,
            'tokens_used': self.tokens_used
        }
