package com.eswar.financialplanner.mobile.core

/**
 * JNI bridge to Rust `financial_planner_core` (SPEC §4.3).
 * Build native libs: `mobile/scripts/build-android-core.sh`
 */
object NativeCore {
    init {
        System.loadLibrary("financial_planner_core")
    }

    @JvmStatic
    external fun computeBaselineEmi(
        principalInr: Double,
        annualPercent: Double,
        tenureMonths: Int,
    ): Double

    /** Compact schedule JSON (matches web golden snapshot shape). */
    @JvmStatic
    external fun baselineScheduleJson(
        principalInr: Double,
        annualPercent: Double,
        tenureMonths: Int,
    ): String
}
