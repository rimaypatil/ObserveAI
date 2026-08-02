from backend.embeddings.chunker import document_chunker
from backend.embeddings.generator import embedding_generator


def test_document_chunker_and_deduplication_hash():
    sample_doc = (
        "# Standard Database Failure Playbook\n\n"
        "When microservices experience PostgreSQL connection pool exhaustion (HTTP 500), "
        "first check max_connections in postgresql.conf and inspect active pool sizes in PgBouncer.\n\n"
        "To resolve: restart PgBouncer service and clear stale transaction locks."
    )

    hash1 = document_chunker.compute_hash(sample_doc)
    hash2 = document_chunker.compute_hash(sample_doc)

    assert hash1 == hash2
    assert len(hash1) == 64  # SHA-256 hex string

    chunks = document_chunker.chunk_text(sample_doc, {"title": "Test Playbook"})
    assert len(chunks) >= 1
    assert "chunk_hash" in chunks[0]


def test_embedding_generator_dimension():
    text = "Critical microservice exception: Connection reset by peer."
    vector = embedding_generator.generate_embedding(text)

    assert isinstance(vector, list)
    assert len(vector) == 384
