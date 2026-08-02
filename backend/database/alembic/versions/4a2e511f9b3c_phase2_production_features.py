"""Phase 2 Production Features

Revision ID: 4a2e511f9b3c
Revises: 391038f521ce
Create Date: 2026-08-02 16:55:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = '4a2e511f9b3c'
down_revision: Union[str, None] = '391038f521ce'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Users updates
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_token VARCHAR(255);")
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_expires_at TIMESTAMPTZ;")
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(500);")
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'UTC' NOT NULL;")
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS notification_preferences JSONB;")
    op.execute("CREATE INDEX IF NOT EXISTS ix_users_password_reset_token ON users (password_reset_token);")

    # Projects updates
    op.execute("ALTER TABLE projects ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false NOT NULL;")
    op.execute("ALTER TABLE projects ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;")
    op.execute("ALTER TABLE projects ADD COLUMN IF NOT EXISTS logo_url VARCHAR(500);")
    op.execute("ALTER TABLE projects ADD COLUMN IF NOT EXISTS settings JSONB;")

    # Incidents updates
    op.execute("ALTER TABLE incidents ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'MEDIUM' NOT NULL;")
    op.execute("ALTER TABLE incidents ADD COLUMN IF NOT EXISTS assigned_to_id UUID REFERENCES users(id) ON DELETE SET NULL;")
    op.execute("ALTER TABLE incidents ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES users(id) ON DELETE SET NULL;")
    op.execute("CREATE INDEX IF NOT EXISTS ix_incidents_assigned_to_id ON incidents (assigned_to_id);")
    op.execute("CREATE INDEX IF NOT EXISTS ix_incidents_owner_id ON incidents (owner_id);")
    op.execute("CREATE INDEX IF NOT EXISTS ix_incidents_priority ON incidents (priority);")

    # Incident Comments
    op.execute("""
    CREATE TABLE IF NOT EXISTS incident_comments (
        id UUID PRIMARY KEY,
        created_at TIMESTAMPTZ NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL,
        is_deleted BOOLEAN NOT NULL DEFAULT false,
        incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        comment TEXT NOT NULL
    );
    """)
    op.execute("CREATE INDEX IF NOT EXISTS ix_incident_comments_incident_id ON incident_comments (incident_id);")
    op.execute("CREATE INDEX IF NOT EXISTS ix_incident_comments_user_id ON incident_comments (user_id);")

    # Knowledge Document updates
    op.execute("ALTER TABLE knowledge_documents ADD COLUMN IF NOT EXISTS category VARCHAR(100);")
    op.execute("ALTER TABLE knowledge_documents ADD COLUMN IF NOT EXISTS tags JSONB;")
    op.execute("ALTER TABLE knowledge_documents ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;")
    op.execute("CREATE INDEX IF NOT EXISTS ix_knowledge_documents_category ON knowledge_documents (category);")

    # RCA Feedback
    op.execute("""
    CREATE TABLE IF NOT EXISTS rca_feedbacks (
        id UUID PRIMARY KEY,
        created_at TIMESTAMPTZ NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL,
        is_deleted BOOLEAN NOT NULL DEFAULT false,
        incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
        rca_report_id UUID REFERENCES rca_reports(id) ON DELETE SET NULL,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        is_helpful BOOLEAN NOT NULL,
        rating INTEGER,
        comment TEXT
    );
    """)
    op.execute("CREATE INDEX IF NOT EXISTS ix_rca_feedbacks_incident_id ON rca_feedbacks (incident_id);")
    op.execute("CREATE INDEX IF NOT EXISTS ix_rca_feedbacks_rca_report_id ON rca_feedbacks (rca_report_id);")
    op.execute("CREATE INDEX IF NOT EXISTS ix_rca_feedbacks_user_id ON rca_feedbacks (user_id);")


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS rca_feedbacks CASCADE;")
    op.execute("DROP TABLE IF EXISTS incident_comments CASCADE;")
