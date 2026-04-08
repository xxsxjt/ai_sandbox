package com.dx.ai_sandbox;

import java.io.*;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.util.*;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.json.JSONArray;
import org.json.JSONObject;

@WebServlet(name = "searchServlet", value = "/api/search")
public class SearchServlet extends HttpServlet {

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        // CORS 头
        response.setHeader("Access-Control-Allow-Origin", "*");
        response.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        response.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
        response.setHeader("Access-Control-Max-Age", "3600");
        
        String query = request.getParameter("q");

        if (query == null || query.trim().isEmpty()) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write("{\"error\": \"查询参数 q 不能为空\"}");
            return;
        }

        response.setContentType("application/json;charset=UTF-8");
        response.setCharacterEncoding("UTF-8");

        try {
            // 使用 DuckDuckGo HTML API（不需要 API Key）
            String encodedQuery = URLEncoder.encode(query.trim(), "UTF-8");
            String searchUrl = "https://html.duckduckgo.com/html/?q=" + encodedQuery + "&kl=wt-wt";

            URL url = new URL(searchUrl);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");
            conn.setRequestProperty("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
            conn.setConnectTimeout(10000);
            conn.setReadTimeout(10000);

            int responseCode = conn.getResponseCode();
            if (responseCode != HttpURLConnection.HTTP_OK) {
                response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                response.getWriter().write("{\"error\": \"搜索引擎请求失败\"}");
                return;
            }

            // 读取响应
            BufferedReader reader = new BufferedReader(
                    new InputStreamReader(conn.getInputStream(), "UTF-8"));
            StringBuilder htmlResponse = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                htmlResponse.append(line).append("\n");
            }
            reader.close();

            // 解析 HTML 结果
            String html = htmlResponse.toString();
            JSONArray results = parseDuckDuckGoResults(html);

            // 返回 JSON 结果
            JSONObject result = new JSONObject();
            result.put("results", results);
            result.put("query", query);
            result.put("count", results.length());

            response.setStatus(HttpServletResponse.SC_OK);
            response.getWriter().write(result.toString());

        } catch (Exception e) {
            e.printStackTrace();
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            response.setContentType("application/json;charset=UTF-8");
            JSONObject error = new JSONObject();
            error.put("error", "搜索失败: " + e.getMessage());
            response.getWriter().write(error.toString());
        }
    }

    private JSONArray parseDuckDuckGoResults(String html) {
        JSONArray results = new JSONArray();

        try {
            // 匹配结果条目: <a href="..." class="result__a">标题</a> 和后面的描述
            java.util.regex.Pattern pattern = java.util.regex.Pattern.compile(
                    "<a[^>]*class=\"result__a\"[^>]*>([^<]+)</a>[\\s\\S]*?<a[^>]*class=\"result__snippet\"[^>]*>([\\s\\S]*?)</a>",
                    java.util.regex.Pattern.CASE_INSENSITIVE
            );

            java.util.regex.Matcher matcher = pattern.matcher(html);
            int count = 0;

            while (matcher.find() && count < 5) {
                String title = stripHtml(matcher.group(1));
                String snippet = stripHtml(matcher.group(2));

                if (!title.isEmpty() && !snippet.isEmpty()) {
                    JSONObject result = new JSONObject();
                    result.put("title", title.trim());
                    result.put("snippet", snippet.trim());
                    results.put(result);
                    count++;
                }
            }

            // 如果 DuckDuckGo 解析失败，尝试备用解析
            if (results.length() == 0) {
                // 尝试另一种正则表达式
                pattern = java.util.regex.Pattern.compile(
                        "<h2[^>]*class=\"[^\"]*result[^\"]*\"[^>]*>[\\s\\S]*?<a[^>]*>([^<]+)</a>",
                        java.util.regex.Pattern.CASE_INSENSITIVE
                );
                matcher = pattern.matcher(html);
                count = 0;
                while (matcher.find() && count < 5) {
                    String title = stripHtml(matcher.group(1));
                    if (!title.isEmpty()) {
                        JSONObject result = new JSONObject();
                        result.put("title", title.trim());
                        result.put("snippet", "点击查看详情...");
                        results.put(result);
                        count++;
                    }
                }
            }

        } catch (Exception e) {
            e.printStackTrace();
        }

        return results;
    }

    private String stripHtml(String html) {
        if (html == null) return "";
        // 移除所有 HTML 标签
        String text = html.replaceAll("<[^>]+>", "");
        // 解码 HTML 实体
        text = text.replace("&amp;", "&")
                   .replace("&lt;", "<")
                   .replace("&gt;", ">")
                   .replace("&quot;", "\"")
                   .replace("&#39;", "'")
                   .replace("&nbsp;", " ");
        return text.trim();
    }
}
