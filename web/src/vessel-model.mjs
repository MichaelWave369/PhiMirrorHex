// E4 finite Keyhole witness, independent JS implementation of the frozen Python toy.
// No live agent or biometric signals. No consciousness inference or action permission.
export const VESSEL_SCHEMA = 'phimirrorhex.e4.nested-vessel.v1';
export const VESSEL_LAYERS = Object.freeze([
  'Environmental coupling',
  'Sensory boundary',
  'Signal encoding',
  'Local feedback loops',
  'Integration proxy',
  'Behavioral expression proxy'
]);
export const VESSEL_RADII = Object.freeze([1, 2, 3, 5, 8, 13]);
export const VESSEL_GAINS = Object.freeze([0, .25, .5, 1]);
const INITIAL_A = [1, -1, 0, 0, 0, 0];
const INITIAL_B = [-1, 1, 0, 0, 0, 0];
function rotateRight(values) {return [values[5], ...values.slice(0, 5)];}
function trajectory(initial, probeLayer, gain) {
  const states = [initial.slice()];
  for (let layer = 1; layer < 6; layer++) {
    const shifted = rotateRight(states.at(-1));
    if (layer === probeLayer) shifted[layer] *= 1 + gain;
    states.push(shifted);
  }
  return states;
}
function requireInteger(value, low, high, name) {
  if (!Number.isInteger(value) || value < low || value > high) {
    throw new RangeError(name + ' must be an integer in [' + low + ',' + high + ']');
  }
}
export function buildVesselReport(probeLayer = 3, gain = .5, observerDepth = 3) {
  requireInteger(probeLayer, 1, 5, 'probeLayer');
  requireInteger(observerDepth, 0, 5, 'observerDepth');
  if (!VESSEL_GAINS.includes(gain) || typeof gain !== 'number') throw new RangeError('unsupported gain');
  const as = trajectory(INITIAL_A, probeLayer, gain);
  const bs = trajectory(INITIAL_B, probeLayer, gain);
  const layers = as.map((stateA, index) => {
    const stateB = bs[index];
    const pa = stateA.reduce((s, x) => s + x, 0);
    const pb = stateB.reduce((s, x) => s + x, 0);
    return {
      index,
      name: VESSEL_LAYERS[index],
      radius: VESSEL_RADII[index],
      state_a: stateA,
      state_b: stateB,
      keyhole_a: pa,
      keyhole_b: pb,
      equal_through_keyhole: pa === pb,
      observable_gap: Math.abs(pa - pb),
      latent_l1_difference: stateA.reduce((s, x, i) => s + Math.abs(x - stateB[i]), 0),
      operation: index === 0 ? 'INITIAL' : index === probeLayer ? 'ROTATE_GAIN' : 'ROTATE'
    };
  });
  const first = layers.find(entry => !entry.equal_through_keyhole);
  const selected = layers[observerDepth];
  return {
    schema: VESSEL_SCHEMA,
    status: 'DEMONSTRATED_FINITE_TOY_ONLY',
    concept: 'Nested Vessel / NBG Keyhole depth',
    epistemic_origin: 'SIMULATED',
    physical_measurement: false,
    biometric_data: false,
    consciousness_measured: false,
    causal_claim_about_humans: false,
    action_authorized: false,
    observer: {projection: 'P(x)=sum(six sectors)', depth: observerDepth},
    experiment: {
      probe_layer: probeLayer, gain,
      transition: 'cyclic_right_rotation_then_fixed_sector_gain',
      positive_control: gain > 0, negative_control: gain === 0
    },
    initial: {
      state_a: INITIAL_A.slice(), state_b: INITIAL_B.slice(),
      keyhole_equal: true, hidden_states_differ: true
    },
    layers,
    selected: {
      index: observerDepth,
      keyhole_a: selected.keyhole_a, keyhole_b: selected.keyhole_b,
      equal_through_keyhole: selected.equal_through_keyhole,
      observable_gap: selected.observable_gap
    },
    witness: {
      exists: Boolean(first), first_layer: first?.index ?? null,
      initial_keyhole_equal: true, fixed_transition_same_for_both: true
    },
    controls: {
      no_probe_stays_coarse_equal: true,
      initial_sum_only_cannot_separate: true,
      initial_full_state_can_separate: true
    }
  };
}
