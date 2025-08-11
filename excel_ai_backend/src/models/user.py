from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import relationship

db = SQLAlchemy()

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    
    # Relationships
    visualizations = relationship("Visualization", back_populates="user")
    data_preps = relationship("DataPrep", back_populates="user")
    data_enrichments = relationship("DataEnrichment", back_populates="user")
    tool_generations = relationship("ToolGeneration", back_populates="user")

    def __repr__(self):
        return f'<User {self.username}>'

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email
        }
