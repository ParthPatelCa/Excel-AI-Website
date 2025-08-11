from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()

class Visualization(Base):
    __tablename__ = 'visualizations'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    title = Column(String(255), nullable=False)
    chart_type = Column(String(50), nullable=False)  # bar, line, pie, scatter, heatmap
    data_source = Column(String(255))  # file name or connector reference
    chart_config = Column(JSON)  # chart configuration and styling
    data_preview = Column(JSON)  # sample of the data used
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_public = Column(Boolean, default=False)
    
    # Relationship
    user = relationship("User", back_populates="visualizations")

class DataPrep(Base):
    __tablename__ = 'data_preps'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    title = Column(String(255), nullable=False)
    prep_type = Column(String(50), nullable=False)  # blending, cleaning, transformation
    input_data = Column(JSON)  # original data structure
    output_data = Column(JSON)  # cleaned/transformed data
    operations = Column(JSON)  # list of operations performed
    ai_suggestions = Column(JSON)  # AI-generated cleaning suggestions
    created_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String(20), default='pending')  # pending, processing, completed, failed
    
    # Relationship
    user = relationship("User", back_populates="data_preps")

class DataEnrichment(Base):
    __tablename__ = 'data_enrichments'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    title = Column(String(255), nullable=False)
    enrichment_type = Column(String(50), nullable=False)  # sentiment, keywords, classification, summarize
    input_text = Column(Text)
    input_data = Column(JSON)  # for batch processing
    output_data = Column(JSON)  # enriched results
    ai_model = Column(String(50))  # model used for enrichment
    created_at = Column(DateTime, default=datetime.utcnow)
    processing_time = Column(Integer)  # milliseconds
    
    # Relationship
    user = relationship("User", back_populates="data_enrichments")

class ToolGeneration(Base):
    __tablename__ = 'tool_generations'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    tool_type = Column(String(50), nullable=False)  # excel_formula, sql_query, pdf_convert, text_convert, vba_script
    input_description = Column(Text, nullable=False)
    input_data = Column(JSON)  # additional context or files
    generated_output = Column(Text)  # the generated formula/query/script
    explanation = Column(Text)  # how it works
    examples = Column(JSON)  # usage examples
    created_at = Column(DateTime, default=datetime.utcnow)
    ai_model = Column(String(50))
    
    # Relationship
    user = relationship("User", back_populates="tool_generations")
