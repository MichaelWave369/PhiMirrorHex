"""Geometric, combinatorial, sampling, and weighting contracts."""

import math

import pytest

from phimirrorhex.core import (
    FIBONACCI_BUDGETS, GATE, PHI,
    audit_pairs, bipyramid, build_graph, coherence,
)


def test_physical_geometry_euler_contract():
    solid = bipyramid()
    assert (len(solid.vertices), len(solid.edges), len(solid.faces)) == (8, 18, 12)
    assert len(solid.vertices) - len(solid.edges) + len(solid.faces) == 2
    assert all(len(set(face)) == 3 for face in solid.faces)
    assert math.isclose(solid.vertices[6][2], PHI)
    assert math.isclose(solid.vertices[7][2], -PHI)


def test_reject_invalid_geometry():
    with pytest.raises(ValueError):
        bipyramid(side=0)
    with pytest.raises(ValueError):
        bipyramid(height_ratio=float("nan"))


def test_exact_combinatorics():
    graph = build_graph()
    assert len(graph.channels) == 6 * 6 == 36
    assert len(set(graph.channels)) == 36
    assert len(graph.nodes) == 37
    assert len(graph.peer_pairs) == 630
    assert len(graph.gate_pairs) == 36
    assert len(graph.pairs) == 666 == 37 * 36 // 2
    assert len(set(graph.pairs)) == 666
    assert all(GATE in pair for pair in graph.gate_pairs)


@pytest.mark.parametrize("budget", FIBONACCI_BUDGETS)
def test_sampler_includes_gate_and_is_replay_exact(budget):
    first = audit_pairs(budget, seed=369)
    assert first == audit_pairs(budget, seed=369)
    assert len(first) == budget == len(set(first))
    assert set(build_graph().gate_pairs) <= set(first)


def test_sampler_monotonic_at_fixed_seed():
    previous = set()
    for budget in FIBONACCI_BUDGETS:
        current = set(audit_pairs(budget, seed=7))
        assert previous <= current
        previous = current
    assert previous == set(build_graph().pairs)


def test_seed_changes_peer_selection_not_gate():
    a, b = audit_pairs(55, seed=1), audit_pairs(55, seed=2)
    assert a[:36] == b[:36] == build_graph().gate_pairs
    assert set(a[36:]) != set(b[36:])


def test_sampler_rejects_unsupported_values():
    for value in (36, 50, 667, True):
        with pytest.raises(ValueError):
            audit_pairs(value)
    with pytest.raises(ValueError):
        audit_pairs(55, seed=3.5)


def test_coherence_bounds_and_monotonicity():
    assert coherence(1, 1, 1, 0) == pytest.approx(1.0)
    assert coherence(0, 1, 1, 0) == 0
    assert 0 <= coherence(.9, .8, .7, .1) <= 1
    assert coherence(.9, .8, .7, .1) > coherence(.9, .8, .7, .8)
    assert coherence(.9, .8, .7, .4, penalty=1) > coherence(.9, .8, .7, .4, penalty=PHI)


def test_coherence_rejects_bad_inputs():
    for value in (-.01, 1.01, math.nan, math.inf):
        with pytest.raises(ValueError):
            coherence(value, .5, .5, .5)
    with pytest.raises(ValueError):
        coherence(.5, .5, .5, .5, penalty=-1)
