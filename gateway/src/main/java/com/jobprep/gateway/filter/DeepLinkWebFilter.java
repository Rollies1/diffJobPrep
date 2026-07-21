package com.jobprep.gateway.filter;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jobprep.gateway.config.DeepLinkProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.Ordered;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

/**
 * Serves Apple App Site Association and Android Asset Links at the apex.
 *
 * Per review:
 *   - Content-Type MUST be application/json (Apple rejects octet-stream).
 *   - Served over HTTPS at the apex (no redirects).
 *   - No auth — these are public files fetched by Apple/Google crawlers.
 *   - Spring Cloud Gateway is WebFlux-based; static resource serving is
 *     awkward. This WebFilter intercepts /.well-known/* paths before
 *     routing and returns the JSON directly.
 *
 * Routes:
 *   GET /.well-known/apple-app-site-association
 *   GET /.well-known/assetlinks.json
 */
@Component
public class DeepLinkWebFilter implements WebFilter, Ordered {

    private static final Logger log = LoggerFactory.getLogger(DeepLinkWebFilter.class);

    private final DeepLinkProperties props;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public DeepLinkWebFilter(DeepLinkProperties props) {
        this.props = props;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
        String path = exchange.getRequest().getPath().value();

        // Short-circuit: only handle the two known deep-link paths.
        if (!path.startsWith("/.well-known/")) {
            return chain.filter(exchange);
        }

        byte[] body;
        if ("/.well-known/apple-app-site-association".equals(path)) {
            body = renderAasa();
        } else if ("/.well-known/assetlinks.json".equals(path)) {
            body = renderAssetLinks();
        } else {
            return chain.filter(exchange);
        }

        var response = exchange.getResponse();
        response.getHeaders().setContentType(MediaType.APPLICATION_JSON);
        response.getHeaders().setCacheControl("public, max-age=300, must-revalidate");
        return response.writeWith(
            Mono.just(response.bufferFactory().wrap(body)));
    }

    /**
     * Build the Apple App Site Association JSON.
     *
     * Structure:
     *   {
     *     "applinks": { "details": [{ "appIDs": [...], "components": [...] }] },
     *     "webcredentials": { "apps": [...] },
     *     "appclips": { "apps": [] }
     *   }
     */
    private byte[] renderAasa() {
        String appId = props.getAppleTeamId() + "." + props.getAppBundleId();

        // Build component list. Exclude /.well-known/* from universal links.
        List<Map<String, Object>> components = props.getAppPaths().stream()
            .map(p -> Map.<String, Object>of("/", p))
            .toList();
        components.add(Map.of("/", "/.well-known/*", "exclude", true));

        Map<String, Object> aasa = Map.of(
            "applinks", Map.of(
                "details", List.of(Map.of(
                    "appIDs", List.of(appId),
                    "components", components
                ))
            ),
            "webcredentials", Map.of("apps", List.of(appId)),
            "appclips", Map.of("apps", List.of())
        );
        return toJson(aasa);
    }

    /**
     * Build the Android Asset Links JSON.
     *
     * The sha256_cert_fingerprints come from the signing keystore:
     *   keytool -list -v -keystore release.keystore -alias release | grep SHA256
     */
    private byte[] renderAssetLinks() {
        String[] fingerprints = props.getAndroidSha256Fingerprints()
            .split(",");
        List<String> clean = java.util.Arrays.stream(fingerprints)
            .map(String::trim)
            .filter(s -> !s.isEmpty())
            .toList();

        Map<String, Object> assetlinks = Map.of(
            "relation", List.of("delegate_permission/common.handle_all_urls"),
            "target", Map.of(
                "namespace", "android_app",
                "package_name", props.getAndroidPackage(),
                "sha256_cert_fingerprints", clean
            )
        );
        return toJson(List.of(assetlinks));
    }

    private byte[] toJson(Object obj) {
        try {
            return objectMapper.writerWithDefaultPrettyPrinter()
                .writeValueAsBytes(obj);
        } catch (Exception e) {
            log.error("Failed to serialize deep-link JSON", e);
            return "{}".getBytes(StandardCharsets.UTF_8);
        }
    }

    /**
     * Run before the gateway routing filter so deep-link requests never
     * hit the route table (and thus never require JWT auth).
     */
    @Override
    public int getOrder() {
        return Ordered.HIGHEST_PRECEDENCE;
    }
}
