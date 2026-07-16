# Keep rules for JNI / Rust core if minify is enabled later.
-keepclasseswithmembernames class * {
    native <methods>;
}
-keep class com.eswar.financialplanner.mobile.core.NativeCore { *; }
