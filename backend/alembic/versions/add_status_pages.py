"""add status pages

Revision ID: add_status_pages
Revises: add_user_notification_settings
Create Date: 2026-04-07 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_status_pages'
down_revision = 'add_share_expiration_password'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Status Pages table
    op.create_table('status_pages',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('slug', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('custom_domain', sa.String(length=255), nullable=True),
        sa.Column('is_public', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('show_uptime', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('show_incident_history', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('branding_logo_url', sa.String(length=512), nullable=True),
        sa.Column('branding_primary_color', sa.String(length=7), nullable=True),
        sa.Column('branding_custom_css', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('slug')
    )
    op.create_index('ix_status_pages_user_id', 'status_pages', ['user_id'])
    op.create_index('ix_status_pages_slug', 'status_pages', ['slug'])
    
    # Status Page Components (groups of monitors)
    op.create_table('status_page_components',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('status_page_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('order', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['status_page_id'], ['status_pages.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_status_page_components_status_page_id', 'status_page_components', ['status_page_id'])
    
    # Component Monitors (many-to-many relationship)
    op.create_table('component_monitors',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('component_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('monitor_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['component_id'], ['status_page_components.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['monitor_id'], ['monitors.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('component_id', 'monitor_id', name='uq_component_monitor')
    )
    op.create_index('ix_component_monitors_component_id', 'component_monitors', ['component_id'])
    op.create_index('ix_component_monitors_monitor_id', 'component_monitors', ['monitor_id'])
    
    # Incidents table
    op.create_table('incidents',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('status_page_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('status', sa.String(length=50), nullable=False),  # investigating, identified, monitoring, resolved
        sa.Column('severity', sa.String(length=50), nullable=False),  # minor, major, critical
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('resolved_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['status_page_id'], ['status_pages.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_incidents_status_page_id', 'incidents', ['status_page_id'])
    op.create_index('ix_incidents_status', 'incidents', ['status'])
    op.create_index('ix_incidents_started_at', 'incidents', ['started_at'])
    
    # Incident Updates (timeline)
    op.create_table('incident_updates',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('incident_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('status', sa.String(length=50), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['incident_id'], ['incidents.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_incident_updates_incident_id', 'incident_updates', ['incident_id'])
    op.create_index('ix_incident_updates_created_at', 'incident_updates', ['created_at'])
    
    # Incident Components (which components are affected)
    op.create_table('incident_components',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('incident_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('component_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['incident_id'], ['incidents.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['component_id'], ['status_page_components.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('incident_id', 'component_id', name='uq_incident_component')
    )
    op.create_index('ix_incident_components_incident_id', 'incident_components', ['incident_id'])
    op.create_index('ix_incident_components_component_id', 'incident_components', ['component_id'])
    
    # Scheduled Maintenances
    op.create_table('scheduled_maintenances',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('status_page_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('status', sa.String(length=50), nullable=False),  # scheduled, in_progress, completed
        sa.Column('scheduled_start', sa.DateTime(timezone=True), nullable=False),
        sa.Column('scheduled_end', sa.DateTime(timezone=True), nullable=False),
        sa.Column('actual_start', sa.DateTime(timezone=True), nullable=True),
        sa.Column('actual_end', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['status_page_id'], ['status_pages.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_scheduled_maintenances_status_page_id', 'scheduled_maintenances', ['status_page_id'])
    op.create_index('ix_scheduled_maintenances_scheduled_start', 'scheduled_maintenances', ['scheduled_start'])
    
    # Maintenance Components
    op.create_table('maintenance_components',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('maintenance_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('component_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['maintenance_id'], ['scheduled_maintenances.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['component_id'], ['status_page_components.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('maintenance_id', 'component_id', name='uq_maintenance_component')
    )
    op.create_index('ix_maintenance_components_maintenance_id', 'maintenance_components', ['maintenance_id'])
    op.create_index('ix_maintenance_components_component_id', 'maintenance_components', ['component_id'])
    
    # Status Page Subscribers
    op.create_table('status_page_subscribers',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('status_page_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('is_verified', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('verification_token', sa.String(length=64), nullable=True),
        sa.Column('unsubscribe_token', sa.String(length=64), nullable=False),
        sa.Column('subscribed_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('verified_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['status_page_id'], ['status_pages.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('status_page_id', 'email', name='uq_status_page_subscriber')
    )
    op.create_index('ix_status_page_subscribers_status_page_id', 'status_page_subscribers', ['status_page_id'])
    op.create_index('ix_status_page_subscribers_email', 'status_page_subscribers', ['email'])


def downgrade() -> None:
    op.drop_table('status_page_subscribers')
    op.drop_table('maintenance_components')
    op.drop_table('scheduled_maintenances')
    op.drop_table('incident_components')
    op.drop_table('incident_updates')
    op.drop_table('incidents')
    op.drop_table('component_monitors')
    op.drop_table('status_page_components')
    op.drop_table('status_pages')
