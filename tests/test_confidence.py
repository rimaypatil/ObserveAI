from backend.confidence.engine import confidence_engine


def test_confidence_engine_evaluation():
    # High telemetry quality & high RAG similarity match
    high_eval = confidence_engine.evaluate_confidence(
        has_logs=True,
        log_count=15,
        has_exceptions=True,
        exception_count=2,
        has_traces=True,
        trace_count=8,
        has_metrics=True,
        has_deployment=True,
        rag_top_similarity=0.88
    )

    assert high_eval["confidence_level"] == "HIGH"
    assert high_eval["overall_score"] >= 0.75
    assert high_eval["needs_deep_pass"] is False

    # Minimal telemetry & low RAG similarity
    low_eval = confidence_engine.evaluate_confidence(
        has_logs=False,
        log_count=0,
        has_exceptions=False,
        exception_count=0,
        has_traces=False,
        trace_count=0,
        has_metrics=False,
        has_deployment=False,
        rag_top_similarity=0.20
    )

    assert low_eval["confidence_level"] == "LOW"
    assert low_eval["overall_score"] < 0.50
    assert low_eval["needs_deep_pass"] is True
