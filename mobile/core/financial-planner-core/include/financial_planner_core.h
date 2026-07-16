/* Generated manually — FinancialPlanner mobile core FFI.
 * Regenerate when fp_* exports change. */

#ifndef FINANCIAL_PLANNER_CORE_H
#define FINANCIAL_PLANNER_CORE_H

#include <stddef.h>
#include <stdint.h>

#ifdef __cplusplus
extern "C" {
#endif

/** Compute baseline EMI (INR). `error_out` set to 1 on failure; may be NULL. */
double fp_compute_baseline_emi(
    double principal_inr,
    double annual_percent,
    uint32_t tenure_months,
    int32_t *error_out);

/** Write baseline schedule golden JSON into `out_buf`. Returns byte count or -1. */
int64_t fp_baseline_schedule_json(
    double principal_inr,
    double annual_percent,
    uint32_t tenure_months,
    char *out_buf,
    size_t out_cap);

/** Copy last error message. Returns byte count or -1. */
int64_t fp_last_error(char *out_buf, size_t out_cap);

/** Parse minimal loan JSON `{"principal_inr", "annual_interest_rate", "tenure_months"}`; return EMI. */
double fp_parse_and_emi(const char *json, int32_t *error_out);

#ifdef __cplusplus
}
#endif

#endif /* FINANCIAL_PLANNER_CORE_H */
