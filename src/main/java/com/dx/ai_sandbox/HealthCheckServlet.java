package com.dx.ai_sandbox;

import java.io.*;
import java.net.HttpURLConnection;
import java.net.URL;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.json.JSONObject;

@WebServlet(name = "healthCheckServlet", value = "/api/health")
public class HealthCheckServlet extends HttpServlet {

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        // CORS 头
        response.setHeader("Access-Control-Allow-Origin", "*");
        response.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        response.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
        response.setHeader("Access-Control-Max-Age", "3600");
        
        response.setContentType("application/json;charset=UTF-8");
        response.setCharacterEncoding("UTF-8");

        JSONObject result = new JSONObject();
        JSONObject services = new JSONObject();

        try {
            // 1. 检查搜索服务（通过测试DuckDuckGo连接）
            boolean searchServiceOk = testSearchService();
            services.put("search", searchServiceOk ? "healthy" : "unhealthy");

            // 2. 检查Ollama服务（如果用户配置了端点）
            String ollamaEndpoint = request.getParameter("ollamaEndpoint");
            if (ollamaEndpoint != null && !ollamaEndpoint.trim().isEmpty()) {
                boolean ollamaOk = testOllamaService(ollamaEndpoint.trim());
                services.put("ollama", ollamaOk ? "healthy" : "unhealthy");
            } else {
                services.put("ollama", "not_configured");
            }

            // 3. Java服务本身
            services.put("java", "healthy");

            result.put("services", services);
            result.put("timestamp", System.currentTimeMillis());
            result.put("status", "ok");

            response.setStatus(HttpServletResponse.SC_OK);
        } catch (Exception e) {
            result.put("error", e.getMessage());
            result.put("status", "error");
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
        }

        response.getWriter().write(result.toString());
    }

    private boolean testSearchService() {
        try {
            URL url = new URL("https://duckduckgo.com/html/?q=test&kl=wt-wt");
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");
            conn.setRequestProperty("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
            conn.setConnectTimeout(5000);
            conn.setReadTimeout(5000);

            int responseCode = conn.getResponseCode();
            return responseCode == HttpURLConnection.HTTP_OK;
        } catch (Exception e) {
            return false;
        }
    }

    private boolean testOllamaService(String endpoint) {
        try {
            // 清理端点URL
            String testEndpoint = endpoint;
            if (!testEndpoint.startsWith("http")) {
                testEndpoint = "http://" + testEndpoint;
            }
            if (!testEndpoint.endsWith("/v1/models")) {
                testEndpoint = testEndpoint.replaceAll("/v1/chat/completions$", "");
                testEndpoint = testEndpoint.replaceAll("/v1$", "");
                testEndpoint = testEndpoint.replaceAll("/$", "") + "/v1/models";
            }

            URL url = URL.of(java.net.URI.create(testEndpoint));
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");
            conn.setConnectTimeout(10000);
            conn.setReadTimeout(10000);

            int responseCode = conn.getResponseCode();
            return responseCode == HttpURLConnection.HTTP_OK;
        } catch (Exception e) {
            return false;
        }
    }
}
