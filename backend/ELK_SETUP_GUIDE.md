# 🐘 ELK Stack Setup Guide - Internship Bridge

## Tổng quan ELK Stack

ELK Stack là giải pháp logging và monitoring toàn diện bao gồm:
- **Elasticsearch**: Database lưu trữ logs
- **Logstash**: Xử lý và transform logs
- **Kibana**: Dashboard và visualization

## 🚀 Tại sao ELK tốt hơn các giải pháp khác?

### 1. **Khả năng tìm kiếm mạnh mẽ**
```json
// Tìm tất cả login attempts trong 24h qua
GET /internship-bridge-logs/_search
{
  "query": {
    "bool": {
      "must": [
        { "match": { "message": "User logged in" } },
        { "range": { "@timestamp": { "gte": "now-24h" } } }
      ]
    }
  }
}
```

### 2. **Real-time Monitoring**
- Dashboard real-time cho user activities
- Alert khi có nhiều failed login attempts
- Monitor performance metrics

### 3. **Advanced Analytics**
- User behavior analysis
- Error pattern detection
- Performance bottlenecks identification

### 4. **Scalability**
- Handle millions of logs per day
- Distributed architecture
- Auto-scaling capabilities

## 📦 Setup ELK Stack

### 1. **Docker Compose Setup**

Tạo file `docker-compose.yml`:

```yaml
version: '3.8'

services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
    container_name: elasticsearch
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
    ports:
      - "9200:9200"
    volumes:
      - elasticsearch_data:/usr/share/elasticsearch/data
    networks:
      - elk

  logstash:
    image: docker.elastic.co/logstash/logstash:8.11.0
    container_name: logstash
    ports:
      - "5044:5044"
      - "5000:5000/tcp"
      - "5000:5000/udp"
      - "9600:9600"
    environment:
      LS_JAVA_OPTS: "-Xmx256m -Xms256m"
    volumes:
      - ./logstash/pipeline:/usr/share/logstash/pipeline
      - ./logstash/config/logstash.yml:/usr/share/logstash/config/logstash.yml
    networks:
      - elk
    depends_on:
      - elasticsearch

  kibana:
    image: docker.elastic.co/kibana/kibana:8.11.0
    container_name: kibana
    ports:
      - "5601:5601"
    environment:
      ELASTICSEARCH_HOSTS: http://elasticsearch:9200
    networks:
      - elk
    depends_on:
      - elasticsearch

volumes:
  elasticsearch_data:
    driver: local

networks:
  elk:
    driver: bridge
```

### 2. **Logstash Configuration**

Tạo file `logstash/pipeline/logstash.conf`:

```conf
input {
  tcp {
    port => 5000
    codec => json
  }
  udp {
    port => 5000
    codec => json
  }
}

filter {
  if [type] == "auth" {
    grok {
      match => { "message" => "%{TIMESTAMP_ISO8601:timestamp} %{LOGLEVEL:level} %{GREEDYDATA:log_message}" }
    }
    
    if [level] == "ERROR" {
      mutate {
        add_tag => [ "error", "auth_error" ]
      }
    }
    
    if [level] == "INFO" {
      mutate {
        add_tag => [ "info", "auth_info" ]
      }
    }
  }
  
  if [type] == "email" {
    grok {
      match => { "message" => "%{TIMESTAMP_ISO8601:timestamp} %{LOGLEVEL:level} %{GREEDYDATA:log_message}" }
    }
    
    if [level] == "ERROR" {
      mutate {
        add_tag => [ "error", "email_error" ]
      }
    }
  }
  
  date {
    match => [ "timestamp", "ISO8601" ]
    target => "@timestamp"
  }
}

output {
  elasticsearch {
    hosts => ["elasticsearch:9200"]
    index => "internship-bridge-logs-%{+YYYY.MM.dd}"
  }
  stdout { codec => rubydebug }
}
```

### 3. **Node.js Logger Configuration**

Cập nhật `src/utils/logger.js`:

```javascript
const winston = require('winston');
const { ElasticsearchTransport } = require('winston-elasticsearch');

// Console transport
const consoleTransport = new winston.transports.Console({
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.colorize(),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
      return `${timestamp} [${level}]: ${message} ${Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''}`;
    })
  )
});

// File transport
const fileTransport = new winston.transports.File({
  filename: 'logs/error.log',
  level: 'error',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  )
});

// Elasticsearch transport
const elasticsearchTransport = new ElasticsearchTransport({
  level: 'info',
  clientOpts: {
    node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
    index: 'internship-bridge-logs',
    'es-version': 8,
    'flush-interval': 2000,
    'ensure-mapping-template': true,
    'mapping-template': {
      'index_patterns': ['internship-bridge-logs-*'],
      'settings': {
        'number_of_shards': 1,
        'number_of_replicas': 0
      },
      'mappings': {
        'properties': {
          '@timestamp': { 'type': 'date' },
          'level': { 'type': 'keyword' },
          'message': { 'type': 'text' },
          'userId': { 'type': 'keyword' },
          'email': { 'type': 'keyword' },
          'role': { 'type': 'keyword' },
          'action': { 'type': 'keyword' },
          'ip': { 'type': 'ip' },
          'userAgent': { 'type': 'text' }
        }
      }
    }
  }
});

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'internship-bridge' },
  transports: [
    consoleTransport,
    fileTransport,
    elasticsearchTransport
  ]
});

module.exports = { logger };
```

### 4. **Cập nhật Auth Controller**

```javascript
// Trong authController.js
const { logger } = require('../utils/logger');

// Thêm structured logging
const register = asyncHandler(async (req, res) => {
  const startTime = Date.now();
  
  try {
    // ... existing code ...
    
    logger.info('User registered successfully', {
      userId: user._id,
      email: user.email,
      role: user.role,
      action: 'register',
      duration: Date.now() - startTime,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    
  } catch (error) {
    logger.error('Registration failed', {
      error: error.message,
      email: req.body.email,
      role: req.body.role,
      action: 'register',
      duration: Date.now() - startTime,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    throw error;
  }
});

const login = asyncHandler(async (req, res) => {
  const startTime = Date.now();
  
  try {
    // ... existing code ...
    
    logger.info('User logged in successfully', {
      userId: user._id,
      email: user.email,
      role: user.role,
      action: 'login',
      duration: Date.now() - startTime,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    
  } catch (error) {
    logger.error('Login failed', {
      error: error.message,
      email: req.body.email,
      action: 'login',
      duration: Date.now() - startTime,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    throw error;
  }
});
```

## 📊 Kibana Dashboards

### 1. **Authentication Dashboard**

```json
{
  "title": "Internship Bridge - Authentication Analytics",
  "panels": [
    {
      "title": "Login Attempts (24h)",
      "type": "visualization",
      "visState": {
        "type": "line",
        "params": {
          "type": "line",
          "grid": { "categoryLines": false },
          "categoryAxes": [{ "id": "CategoryAxis-1", "type": "category" }],
          "valueAxes": [{ "id": "ValueAxis-1" }],
          "seriesParams": [{
            "show": true,
            "type": "line",
            "mode": "normal",
            "data": { "label": "Login Attempts", "id": "1" }
          }]
        }
      }
    },
    {
      "title": "Registration by Role",
      "type": "visualization",
      "visState": {
        "type": "pie",
        "params": {
          "type": "pie",
          "addTooltip": true,
          "addLegend": true,
          "legendPosition": "right"
        }
      }
    },
    {
      "title": "Error Rate",
      "type": "visualization",
      "visState": {
        "type": "metric",
        "params": {
          "type": "metric",
          "addTooltip": true,
          "addLegend": false,
          "metric": {
            "percentageMode": false,
            "useRanges": false,
            "colorSchema": "Green to Red",
            "metricColorMode": "None",
            "colorsRange": [{ "from": 0, "to": 100 }],
            "labels": { "show": true },
            "invertColors": false,
            "style": { "bgFill": "#000", "bgColor": false, "labelColor": false, "subText": "" }
          }
        }
      }
    }
  ]
}
```

### 2. **Email Analytics Dashboard**

```json
{
  "title": "Email System Analytics",
  "panels": [
    {
      "title": "Email Sent Success Rate",
      "type": "visualization",
      "visState": {
        "type": "gauge",
        "params": {
          "type": "gauge",
          "addTooltip": true,
          "addLegend": true,
          "gauge": {
            "verticalSplit": false,
            "extendRange": true,
            "percentageMode": false,
            "gaugeType": "Arc",
            "gaugeStyle": "Full",
            "backStyle": "Full",
            "orientation": "vertical",
            "colorSchema": "Green to Red",
            "gaugeColorMode": "Labels",
            "colorsRange": [{ "from": 0, "to": 100 }],
            "invertColors": false,
            "labels": { "show": true, "color": "black" },
            "scale": { "show": true, "labels": false, "color": "#333" },
            "type": "meter",
            "style": { "bgWidth": "0.9", "width": "0.9", "mask": false, "bgMask": false, "maskBars": false, "bgFill": "#eee", "bgColor": false, "subText": "", "fontSize": 60, "labelColor": true }
          }
        }
      }
    }
  ]
}
```

## 🔔 Alerting Rules

### 1. **High Error Rate Alert**

```json
{
  "name": "High Error Rate Alert",
  "type": "alert",
  "schedule": {
    "interval": "5m"
  },
  "conditions": [
    {
      "type": "query",
      "query": {
        "bool": {
          "must": [
            { "match": { "level": "ERROR" } },
            { "range": { "@timestamp": { "gte": "now-5m" } } }
          ]
        }
      },
      "threshold": 10
    }
  ],
  "actions": [
    {
      "type": "email",
      "to": ["admin@internshipbridge.com"],
      "subject": "High Error Rate Alert",
      "body": "Error rate exceeded threshold in the last 5 minutes"
    }
  ]
}
```

### 2. **Failed Login Attempts Alert**

```json
{
  "name": "Failed Login Attempts Alert",
  "type": "alert",
  "schedule": {
    "interval": "1m"
  },
  "conditions": [
    {
      "type": "query",
      "query": {
        "bool": {
          "must": [
            { "match": { "action": "login" } },
            { "match": { "level": "ERROR" } },
            { "range": { "@timestamp": { "gte": "now-1m" } } }
          ]
        }
      },
      "threshold": 5
    }
  ],
  "actions": [
    {
      "type": "slack",
      "channel": "#security-alerts",
      "message": "Multiple failed login attempts detected"
    }
  ]
}
```

## 📈 Performance Monitoring

### 1. **Response Time Tracking**

```javascript
// Middleware để track response time
const responseTimeMiddleware = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    logger.info('API Request', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id
    });
  });
  
  next();
};
```

### 2. **Database Query Monitoring**

```javascript
// Monitor MongoDB queries
const mongoose = require('mongoose');

mongoose.set('debug', (collectionName, methodName, ...methodArgs) => {
  logger.info('MongoDB Query', {
    collection: collectionName,
    method: methodName,
    args: methodArgs,
    timestamp: new Date()
  });
});
```

## 🚀 Benefits của ELK Stack

### 1. **Real-time Insights**
- Monitor user activities in real-time
- Detect security threats immediately
- Track performance issues instantly

### 2. **Advanced Analytics**
- User behavior analysis
- Error pattern detection
- Performance bottleneck identification

### 3. **Scalability**
- Handle millions of logs per day
- Auto-scaling capabilities
- Distributed architecture

### 4. **Cost-effective**
- Open-source solution
- Self-hosted option available
- Pay only for what you use

### 5. **Integration**
- Easy integration with existing systems
- RESTful APIs
- Multiple input/output plugins

## 🔧 Installation Commands

```bash
# 1. Install dependencies
npm install winston winston-elasticsearch

# 2. Start ELK Stack
docker-compose up -d

# 3. Check if services are running
curl http://localhost:9200
curl http://localhost:5601

# 4. Create index pattern in Kibana
# Go to http://localhost:5601 > Stack Management > Index Patterns
# Create pattern: internship-bridge-logs-*
```

## 📊 Sample Queries

### 1. **Find all failed login attempts**
```json
GET /internship-bridge-logs/_search
{
  "query": {
    "bool": {
      "must": [
        { "match": { "action": "login" } },
        { "match": { "level": "ERROR" } }
      ]
    }
  },
  "sort": [{ "@timestamp": { "order": "desc" } }]
}
```

### 2. **Get registration statistics by role**
```json
GET /internship-bridge-logs/_search
{
  "size": 0,
  "aggs": {
    "registrations_by_role": {
      "terms": {
        "field": "role",
        "size": 10
      }
    }
  },
  "query": {
    "bool": {
      "must": [
        { "match": { "action": "register" } },
        { "match": { "level": "INFO" } }
      ]
    }
  }
}
```

### 3. **Monitor email sending success rate**
```json
GET /internship-bridge-logs/_search
{
  "size": 0,
  "aggs": {
    "email_success_rate": {
      "filters": {
        "filters": {
          "success": { "match": { "level": "INFO" } },
          "error": { "match": { "level": "ERROR" } }
        }
      }
    }
  },
  "query": {
    "bool": {
      "must": [
        { "match": { "action": "email_send" } }
      ]
    }
  }
}
```

ELK Stack cung cấp khả năng monitoring và analytics toàn diện mà các giải pháp khác không thể so sánh được!
