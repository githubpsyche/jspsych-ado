// Design-selection metric helpers used on the timeline's data path (always on, not
// debug-gated): they normalize the controller's per-design metrics into a stable shape
// and align them with the returned designs. Kept out of debug/ so the production data
// boundary doesn't depend on the debug-logging module.

function normalizeDesignMetric(metric) {
  if (!metric || typeof metric !== "object") {
    return { mutual_info: null };
  }
  const mutual_info = metric.mutual_info;
  return {
    ...metric,
    mutual_info:
      typeof mutual_info === "number" && Number.isFinite(mutual_info) ? mutual_info : null,
  };
}

function metricsFromResult(result, design_count) {
  const metrics = Array.isArray(result.next_design_metrics) ? result.next_design_metrics : [];
  const normalized = [];
  for (let i = 0; i < design_count; i++) {
    normalized.push(normalizeDesignMetric(metrics[i]));
  }
  return normalized;
}

export { normalizeDesignMetric, metricsFromResult };
