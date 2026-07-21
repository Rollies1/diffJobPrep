package com.jobprep.gateway.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.List;

/**
 * Configuration properties for deep linking (Apple AASA + Android assetlinks).
 *
 * Loaded from application.yml under the `deeplink` prefix. All values can
 * be overridden by environment variables — see application.yml.
 */
@ConfigurationProperties(prefix = "deeplink")
public class DeepLinkProperties {

    /** Apple Developer Team ID (10 chars, e.g. "ABCDE12345"). */
    private String appleTeamId;

    /** iOS app bundle ID (e.g. "com.jobprep.app"). */
    private String appBundleId;

    /** Android package name (e.g. "com.jobprep.app"). */
    private String androidPackage;

    /** SHA-256 fingerprints of the Android signing certificate(s). */
    private String androidSha256Fingerprints;

    /** URL path patterns that should open the app via universal links. */
    private List<String> appPaths;

    public String getAppleTeamId() { return appleTeamId; }
    public void setAppleTeamId(String appleTeamId) { this.appleTeamId = appleTeamId; }

    public String getAppBundleId() { return appBundleId; }
    public void setAppBundleId(String appBundleId) { this.appBundleId = appBundleId; }

    public String getAndroidPackage() { return androidPackage; }
    public void setAndroidPackage(String androidPackage) { this.androidPackage = androidPackage; }

    public String getAndroidSha256Fingerprints() { return androidSha256Fingerprints; }
    public void setAndroidSha256Fingerprints(String androidSha256Fingerprints) { this.androidSha256Fingerprints = androidSha256Fingerprints; }

    public List<String> getAppPaths() { return appPaths; }
    public void setAppPaths(List<String> appPaths) { this.appPaths = appPaths; }
}
