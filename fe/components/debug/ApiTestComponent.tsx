"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function ApiTestComponent() {
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const testApiEndpoint = async (
    endpoint: string,
    method: string = "GET",
    body?: any
  ) => {
    const token = localStorage.getItem("token");
    const API_BASE_URL =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

    console.log(`Testing: ${method} ${API_BASE_URL}${endpoint}`);
    console.log(`Token: ${token ? "Exists" : "Missing"}`);

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      const result = {
        endpoint,
        method,
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries()),
        data: null,
        error: null,
      };

      if (response.ok) {
        try {
          result.data = await response.json();
        } catch (e) {
          result.data = await response.text();
        }
      } else {
        result.error = await response.text();
      }

      setTestResults((prev) => [result, ...prev.slice(0, 9)]); // Keep last 10 results
      return result;
    } catch (error: any) {
      const result = {
        endpoint,
        method,
        status: "ERROR",
        statusText: error.message,
        ok: false,
        headers: {},
        data: null,
        error: error.message,
      };

      setTestResults((prev) => [result, ...prev.slice(0, 9)]);
      return result;
    }
  };

  const runAllTests = async () => {
    setIsLoading(true);
    setTestResults([]);

    // Test multiple base URLs
    const baseUrls = [
      "http://localhost:3001/api",
      "http://localhost:3000/api",
      "http://localhost:8000/api",
      "http://localhost:5000/api",
    ];

    const tests = [
      { endpoint: "/candidates/me", method: "GET" },
      { endpoint: "/candidates/me?include=all", method: "GET" },
      { endpoint: "/candidates/me/education", method: "GET" },
      { endpoint: "/candidates/me/experience", method: "GET" },
      { endpoint: "/candidates/me/skills", method: "GET" },
    ];

    for (const baseUrl of baseUrls) {
      const token = localStorage.getItem("token");

      // Test basic connectivity first
      try {
        const response = await fetch(`${baseUrl}/candidates/me`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const result = {
          endpoint: `${baseUrl}/candidates/me`,
          method: "GET",
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
          headers: Object.fromEntries(response.headers.entries()),
          data: null,
          error: null,
        };

        if (response.ok) {
          try {
            result.data = await response.json();
          } catch (e) {
            result.data = await response.text();
          }
        } else {
          result.error = await response.text();
        }

        setTestResults((prev) => [result, ...prev.slice(0, 9)]);

        // If this base URL works, test all endpoints
        if (response.ok) {
          for (const test of tests) {
            await testApiEndpoint(test.endpoint, test.method);
            await new Promise((resolve) => setTimeout(resolve, 300));
          }
          break; // Stop testing other URLs if this one works
        }
      } catch (error: any) {
        const result = {
          endpoint: `${baseUrl}/candidates/me`,
          method: "GET",
          status: "ERROR",
          statusText: error.message,
          ok: false,
          headers: {},
          data: null,
          error: error.message,
        };

        setTestResults((prev) => [result, ...prev.slice(0, 9)]);
      }

      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    setIsLoading(false);
  };

  const getStatusColor = (status: number | string) => {
    if (typeof status === "string") return "bg-red-100 text-red-800";
    if (status >= 200 && status < 300) return "bg-green-100 text-green-800";
    if (status >= 400 && status < 500) return "bg-red-100 text-red-800";
    if (status >= 500) return "bg-orange-100 text-orange-800";
    return "bg-gray-100 text-gray-800";
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>API Test Results</span>
          <div className="flex gap-2">
            <Button onClick={runAllTests} disabled={isLoading} size="sm">
              {isLoading ? "Testing..." : "Test All APIs"}
            </Button>
            <Button
              onClick={() => setTestResults([])}
              variant="outline"
              size="sm"
            >
              Clear
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Environment Info */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <h3 className="font-semibold mb-2">Environment Info:</h3>
            <div className="text-sm space-y-1">
              <div>
                API Base URL:{" "}
                {process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"}
              </div>
              <div>
                Token:{" "}
                {localStorage.getItem("token") ? "✅ Exists" : "❌ Missing"}
              </div>
              <div>
                Token Length: {localStorage.getItem("token")?.length || 0}
              </div>
              <div>
                Token Preview:{" "}
                {localStorage.getItem("token")?.substring(0, 20) || "N/A"}...
              </div>
              <div>NODE_ENV: {process.env.NODE_ENV}</div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-blue-50 p-3 rounded-lg">
            <h3 className="font-semibold mb-2">Quick Actions:</h3>
            <div className="flex gap-2 flex-wrap">
              <Button
                onClick={() => {
                  const token = localStorage.getItem("token");
                  if (token) {
                    navigator.clipboard.writeText(token);
                    alert("Token copied to clipboard!");
                  } else {
                    alert("No token found!");
                  }
                }}
                size="sm"
                variant="outline"
              >
                Copy Token
              </Button>
              <Button
                onClick={() => {
                  localStorage.removeItem("token");
                  alert("Token removed! Please refresh the page.");
                }}
                size="sm"
                variant="outline"
              >
                Clear Token
              </Button>
              <Button
                onClick={() => {
                  window.location.reload();
                }}
                size="sm"
                variant="outline"
              >
                Refresh Page
              </Button>
            </div>
          </div>

          {/* Test Results */}
          {testResults.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold">Test Results:</h3>
              {testResults.map((result, index) => (
                <div key={index} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(result.status)}>
                        {result.status} {result.statusText}
                      </Badge>
                      <span className="font-mono text-sm">
                        {result.method} {result.endpoint}
                      </span>
                    </div>
                    <Badge variant={result.ok ? "default" : "destructive"}>
                      {result.ok ? "SUCCESS" : "FAILED"}
                    </Badge>
                  </div>

                  {result.error && (
                    <div className="bg-red-50 p-2 rounded text-sm text-red-700 mb-2">
                      <strong>Error:</strong> {result.error}
                    </div>
                  )}

                  {result.data && (
                    <div className="bg-green-50 p-2 rounded text-sm">
                      <strong>Response:</strong>
                      <pre className="mt-1 text-xs overflow-auto max-h-32">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {testResults.length === 0 && !isLoading && (
            <div className="text-center py-8 text-gray-500">
              Click "Test All APIs" to check endpoint availability
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
