# API Documentation

This document provides comprehensive documentation for the PDL Property Inspector API endpoints.

## Base URL

- **Development**: `http://localhost:3001`
- **Production**: `https://your-production-domain.com`

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```http
Authorization: Bearer <your-jwt-token>
```

For API key authentication, include the API key in the header:

```http
X-API-Key: <your-api-key>
```

## Rate Limiting

Rate limiting is implemented to prevent abuse:

- **Basic Tier**: 1,000 requests per day, 30,000 per month
- **Premium Tier**: Higher limits available
- **Enterprise Tier**: Custom limits

Rate limit headers are included in responses:

```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
```

## Error Handling

The API uses standard HTTP status codes and returns JSON error responses:

```json
{
  "error": "Error message description",
  "code": "ERROR_CODE",
  "details": {
    "field": "Additional error details"
  }
}
```

### Common HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Too Many Requests
- `500` - Internal Server Error

## Endpoints

### Health Check

Check API and service status.

**GET** `/health`

**Response:**
```json
{
  "status": "ok",
  "redis": "connected"
}
```

### Repair Estimates

#### Generate Repair Estimate

Generate a detailed repair estimate for inventory items.

**POST** `/api/estimate`

**Headers:**
```http
Content-Type: application/json
Authorization: Bearer <jwt-token>
X-API-Key: <api-key>
```

**Request Body:**
```json
{
  "inventory": [
    {
      "itemId": "string",
      "itemName": "string",
      "category": "electrical|plumbing|hvac|general|specialized",
      "currentCondition": "Excellent|Good|Fair|Poor|Damaged",
      "purchaseDate": "2023-01-01T00:00:00Z",
      "lastMaintenanceDate": "2023-06-01T00:00:00Z",
      "originalCost": 1000,
      "currentMarketValue": 800,
      "location": "string",
      "description": "string"
    }
  ],
  "userLocation": {
    "city": "string",
    "region": "string", 
    "country": "string",
    "type": "approximate"
  },
  "currency": "USD"
}
```

**Response:**
```json
{
  "totalItems": 1,
  "flaggedItems": [
    {
      "itemId": "string",
      "itemName": "string",
      "category": "string",
      "recommendation": "fix|replace",
      "estimatedRepairCost": 250.00,
      "estimatedReplacementCost": 1200.00,
      "flagReason": "condition|lifecycle|maintenance",
      "flagDetails": "string",
      "requiredResources": ["string"],
      "estimatedTimeline": "string",
      "depreciation": {
        "originalValue": 1000,
        "currentValue": 600,
        "depreciationRate": 0.15,
        "ageInYears": 3
      }
    }
  ],
  "itemsToFix": [],
  "itemsToReplace": [],
  "totalEstimatedCost": 250.00,
  "generatedDate": "2024-01-01T00:00:00Z",
  "summary": {
    "conditionFlags": 0,
    "lifecycleFlags": 1,
    "maintenanceFlags": 0
  }
}
```

**Error Responses:**

- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Missing or invalid authentication
- `429 Too Many Requests`: Rate limit exceeded

### Enhanced Estimates

#### Generate Enhanced Estimate

Generate an enhanced estimate with 6-step analysis process.

**POST** `/api/enhanced-estimate`

**Headers:**
```http
Content-Type: application/json
Authorization: Bearer <jwt-token>
```

**Request Body:**
```json
{
  "inventoryItems": [
    {
      "itemId": "string",
      "itemName": "string", 
      "category": "string",
      "currentCondition": "string",
      "purchaseDate": "string",
      "originalCost": 1000,
      "location": "string"
    }
  ],
  "userLocation": {
    "city": "string",
    "region": "string",
    "country": "string"
  },
  "currency": "USD"
}
```

**Response:**
```json
{
  "success": true,
  "estimate": {
    "totalCost": 1500.00,
    "lineItems": [
      {
        "itemId": "string",
        "description": "string",
        "quantity": 1,
        "unitCost": 1500.00,
        "totalCost": 1500.00,
        "depreciation": {
          "originalValue": 2000,
          "depreciatedValue": 1500,
          "depreciationFactor": 0.25
        }
      }
    ],
    "analysis": {
      "laborRates": {},
      "materialCosts": {},
      "depreciationCalculations": {},
      "conditionAdjustments": {},
      "originalCostBasis": {},
      "lifetimeAnalysis": {}
    }
  }
}
```

## Admin API

### API Key Management

#### Create API Key

Create a new API key for programmatic access.

**POST** `/admin/api-keys`

**Headers:**
```http
Content-Type: application/json
X-Admin-Key: <admin-api-key>
```

**Request Body:**
```json
{
  "name": "string",
  "ownerEmail": "user@example.com",
  "ownerId": "uuid",
  "permissions": {
    "estimate": true
  },
  "rateLimitTier": "basic|premium|enterprise",
  "dailyQuota": 1000,
  "monthlyQuota": 30000,
  "expiresAt": "2024-12-31T23:59:59Z",
  "prefix": "pk_"
}
```

**Response:**
```json
{
  "success": true,
  "apiKey": {
    "id": "uuid",
    "key": "pk_live_abcd1234...",
    "name": "string",
    "prefix": "pk_",
    "permissions": {},
    "rateLimitTier": "basic",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

#### List API Keys

List API keys for a specific owner.

**GET** `/admin/api-keys?ownerId=<uuid>`

**Headers:**
```http
X-Admin-Key: <admin-api-key>
```

**Response:**
```json
{
  "keys": [
    {
      "id": "uuid",
      "name": "string",
      "prefix": "pk_",
      "ownerEmail": "user@example.com",
      "permissions": {},
      "rateLimitTier": "basic",
      "dailyQuota": 1000,
      "monthlyQuota": 30000,
      "usageCountDaily": 50,
      "usageCountMonthly": 1500,
      "usageCountTotal": 15000,
      "lastUsedAt": "2024-01-01T00:00:00Z",
      "createdAt": "2024-01-01T00:00:00Z",
      "expiresAt": "2024-12-31T23:59:59Z",
      "isActive": true
    }
  ]
}
```

#### Deactivate API Key

Deactivate an existing API key.

**DELETE** `/admin/api-keys`

**Headers:**
```http
Content-Type: application/json
X-Admin-Key: <admin-api-key>
```

**Request Body:**
```json
{
  "keyId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "message": "API key deactivated successfully"
}
```

#### Get API Key Statistics

Get usage statistics for API keys.

**GET** `/admin/api-keys/stats?ownerId=<uuid>`

**Headers:**
```http
X-Admin-Key: <admin-api-key>
```

**Response:**
```json
{
  "stats": {
    "totalKeys": 5,
    "activeKeys": 3,
    "totalRequests": 50000,
    "requestsToday": 1200,
    "requestsThisMonth": 15000
  }
}
```

## Data Models

### InventoryItem

```typescript
interface InventoryItem {
  itemId: string;
  itemName: string;
  category: 'electrical' | 'plumbing' | 'hvac' | 'general' | 'specialized';
  currentCondition: 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Damaged';
  purchaseDate: string; // ISO 8601 date
  lastMaintenanceDate?: string; // ISO 8601 date
  originalCost: number;
  currentMarketValue?: number;
  location: string;
  description?: string;
}
```

### UserLocation

```typescript
interface UserLocation {
  city: string;
  region: string;
  country: string;
  type: 'exact' | 'approximate';
}
```

### EstimateResult

```typescript
interface EstimateResult {
  totalItems: number;
  flaggedItems: FlaggedItem[];
  itemsToFix: FlaggedItem[];
  itemsToReplace: FlaggedItem[];
  totalEstimatedCost: number;
  generatedDate: string;
  summary: {
    conditionFlags: number;
    lifecycleFlags: number;
    maintenanceFlags: number;
  };
}
```

## SDK Examples

### JavaScript/Node.js

```javascript
const axios = require('axios');

// Create API client
const apiClient = axios.create({
  baseURL: 'https://api.propertyinspector.com',
  headers: {
    'X-API-Key': 'your-api-key',
    'Content-Type': 'application/json'
  }
});

// Generate estimate
async function generateEstimate(inventory, location) {
  try {
    const response = await apiClient.post('/api/estimate', {
      inventory,
      userLocation: location,
      currency: 'USD'
    });
    return response.data;
  } catch (error) {
    console.error('API Error:', error.response.data);
    throw error;
  }
}
```

### Python

```python
import requests

class PropertyInspectorAPI:
    def __init__(self, api_key, base_url='https://api.propertyinspector.com'):
        self.api_key = api_key
        self.base_url = base_url
        self.session = requests.Session()
        self.session.headers.update({
            'X-API-Key': api_key,
            'Content-Type': 'application/json'
        })
    
    def generate_estimate(self, inventory, location, currency='USD'):
        response = self.session.post(f'{self.base_url}/api/estimate', json={
            'inventory': inventory,
            'userLocation': location,
            'currency': currency
        })
        response.raise_for_status()
        return response.json()
```

### cURL

```bash
# Generate estimate
curl -X POST https://api.propertyinspector.com/api/estimate \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "inventory": [
      {
        "itemId": "item-1",
        "itemName": "HVAC Unit",
        "category": "hvac",
        "currentCondition": "Fair",
        "purchaseDate": "2020-01-01T00:00:00Z",
        "originalCost": 5000,
        "location": "Roof"
      }
    ],
    "userLocation": {
      "city": "New York",
      "region": "NY", 
      "country": "US",
      "type": "approximate"
    },
    "currency": "USD"
  }'
```

## Rate Limiting

The API implements rate limiting to ensure fair usage:

- Rate limits are enforced per API key
- Limits are based on the assigned tier (basic, premium, enterprise)
- Both daily and monthly quotas are enforced
- Rate limit information is returned in response headers

## Security

- All API endpoints require authentication
- Sensitive data is never exposed in responses
- Rate limiting prevents abuse
- API keys can be revoked at any time
- Audit logging tracks all API usage

## Support

For API support:

- **Documentation**: This API reference
- **Issues**: GitHub Issues for bugs or feature requests
- **Security**: Report security issues privately

## Changelog

### v1.0.0
- Initial API release
- Basic estimate generation
- Enhanced estimate support
- API key management
- Rate limiting