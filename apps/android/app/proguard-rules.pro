# StarPay Companion App ProGuard Rules

# Keep DTO models for kotlinx.serialization
-keepclassmembers class * {
    @kotlinx.serialization.Serializable <fields>;
}
-keepattributes *Annotation*,Signature,InnerClasses,EnclosingMethod

-keepnames class kotlinx.serialization.annotations.SerialName

# Keep Retrofit API interfaces
-keep interface com.starpay.companion.data.remote.api.** { *; }

# Keep Room DAOs and Entities
-keep class * extends androidx.room.RoomDatabase
-keep @androidx.room.Dao interface *
-keep @androidx.room.Entity class *

# Keep Hilt Workers
-keep class * extends androidx.work.ListenableWorker {
    public <init>(...);
}

# Tink Crypto Dependency Rules
-dontwarn com.google.errorprone.annotations.**
