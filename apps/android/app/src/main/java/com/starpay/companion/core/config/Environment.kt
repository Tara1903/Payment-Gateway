package com.starpay.companion.core.config

enum class Environment(val baseUrl: String) {
    STAGING("https://staging-api.starpay.com/"),
    PRODUCTION("https://payment-gateway-web-kappa.vercel.app/")
}
