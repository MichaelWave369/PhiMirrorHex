# E20 · Governed Evidence Receivers and Quarantine Qualification

## Question and frozen scope

E19 exported \`field-evidence.synthetic-quorum.v1\` evidence with unsigned SHA-256 integrity, no authentication and explicit simulation labels. E20 asks whether a **recipient profile** can safely inspect it, preserve failures, reject prompt/authority injection and refuse agent actions.

E20 adds **local contract implementations inside PhiMirrorHex only**. It does not install adapters, issue tokens, modify data, update a model, or contact NestedBubbleGear, BrainC or SuperPhiVessel. Names identify proposed **future read-only recipients**, not active integrations.

## Profiles and view projection

Three frozen profiles:

| Profile | Permitted view | Forbidden promotion |
| --- | --- | --- |
| NestedBubbleGear | Synthetic causal-history statistics | Graph-memory writes, physical closure conclusions |
| BrainC | Synthetic routing evidence and failed cases | Training, model selection, active routing |
| SuperPhiVessel | Synthetic research receipt and uncertainty | Reality Gate approval, tools, model autonomy |

A successful E19 **content replay** is accepted for **QUARANTINED_READ_ONLY inspection** only. It is not accepted as a trusted source, memory write, or action command. Projection exposes only fixed numeric/categorical fields from the verified packet: 36 case count, 3456 frame count, selected frozen E17 quorum, false alarms, missed events, abstentions, and explicit provenance. Raw arbitrary JSON fields are never dispatched or treated as natural-language instructions.

## Intake contract

\`receive(packet, consumer, requested_action="inspect")\` or asynchronous \`receiveEvidence(packet, consumer, requestedAction="inspect")\` returns:

- \`schema\`: \`field-evidence.receiver-qualification.v1\`
- \`disposition\`: **QUARANTINED_READ_ONLY**, **REJECTED**, or **REFUSED_ACTION**
- \`reasons\`: fixed machine-readable strings
- \`contract_connected = false\`, \`external_calls = 0\`
- \`authenticity_proven = false\`, \`authority_granted = false\`
- \`trusted_memory_write = false\`, \`model_routing_write = false\`, \`reality_gate_approval = false\`
- \`view\`: concise synthetic statistics **only when successfully quarantined**; null otherwise

Unknown consumers and actions reject. Any known requested mutation (\`execute\`, \`approve\`, \`train\`, \`route\`, \`persist\`) returns **REFUSED_ACTION** before any packet dispatch. Inspection requires E19 checksum, exact frozen local E18 replay, complete traces, and strict provenance checks. This is a **demo intake contract**, not a security boundary for a connected external app.

## Deterministic misuse qualification

The frozen E20 report runs **nine scenarios**:

1. Valid unsigned evidence sent to NestedBubbleGear -> **QUARANTINED_READ_ONLY**.
2. Valid unsigned evidence sent to BrainC -> **QUARANTINED_READ_ONLY**.
3. Valid unsigned evidence sent to SuperPhiVessel -> **QUARANTINED_READ_ONLY**.
4. Trace mutated without updating checksum -> **REJECTED**.
5. \`execution_allowed=true\` with recomputed checksum -> **REJECTED**.
6. Injected \`instruction\` string with recomputed checksum -> **REJECTED**.
7. Claimed signature and authenticity without real signature -> **REJECTED**.
8. Explicit \`approve\` operation for SuperPhiVessel -> **REFUSED_ACTION**.
9. Unknown consumer \`SyntheticAgent\` -> **REJECTED**.

Expected totals: **3 quarantined, 5 rejected, 1 refused action, 0 authority promotions, 0 external calls**. Every failure remains visible; no successful tests are treated as operational permissions.

## Cryptographic and research caveats

A SHA-256 content digest alone does not verify a sender. The E19 local verifier reproduces an exact synthetic experiment, which allows it to reject inconsistent receipts even when an attacker recomputes a hash, but anyone who can produce a matching public deterministic fixture could still impersonate the claimed \`producer\`. For real connected consumers, use authenticated transport, origin authorization, replay controls, independent data-classification policy, and human approval where required.

The simulator has **no real sensor evidence**, three simulated observers are correlated, and E17 retrospective selection was not originally preregistered as training. No physical, biological, consciousness, optimization, safety or agent-capability claim is established.

## Reproduce

\`\`\`bash
python -m phimirrorhex --mode receiver-qualification --output e20-receiver-qualification.json
node tests/check-receiver-parity.mjs e20-receiver-qualification.json
python -m pytest -q
cd web && npm test && npm run build
\`\`\`

The browser **RECEIVERS** room locally constructs and inspects the same nine-case qualification, shows quarantine and rejections, and can export a JSON evidence report. No network calls or external agent actions are made.
