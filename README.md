# Team Geo-Map & Insights

A Microsoft Teams Tab App that visualizes your team's geographical distribution on an interactive map with an AI-powered chat assistant.

## Features

- 🗺️ **Interactive Map**: Visualize team members on an Azure Maps-powered world map
- 👥 **Management Chain**: View your full management hierarchy from CEO to you
- 📍 **Smart Markers**: 
  - **Purple border**: Current user (You)
  - **Orange border**: Managers in your chain
  - **Green border**: Your direct reports
  - **White border**: Colleagues
- 💬 **AI Chat Assistant**: Ask natural language questions about team locations and structure
- 🔍 **Real-time Data**: Connected to CosmosDB for live team data

## Tech Stack

- **Frontend**: React 18, TypeScript, Fluent UI React Components
- **Backend**: Node.js, Express, TypeScript
- **Map**: Azure Maps
- **Database**: Azure CosmosDB
- **Search**: Azure AI Search
- **Platform**: Microsoft Teams Tab App

## Prerequisites

- Node.js 18+
- npm or yarn
- Microsoft Teams account (for deployment)
- Azure subscription (CosmosDB, Azure Maps, Azure AI Search)

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Create a `.env` file in the project root with the following variables:

```bash
# Azure CosmosDB
COSMOS_ENDPOINT=https://your-cosmos-account.documents.azure.com:443
COSMOS_KEY=your-cosmos-primary-key
COSMOS_DATABASE_ID=whereat-db
COSMOS_CONTAINER_ID=users

# Azure AI Search
AZURE_SEARCH_ENDPOINT=https://your-search-service.search.windows.net
AZURE_SEARCH_ADMIN_KEY=your-search-admin-key
AZURE_SEARCH_QUERY_KEY=your-search-query-key

# Azure Maps
AZURE_MAPS_API_KEY=your-azure-maps-subscription-key

# Server Configuration (optional)
PORT=3001
CLIENT_URL=http://localhost:3000
NODE_ENV=development
```

> **Note:** Never commit the `.env` file to version control. It is already listed in `.gitignore`.

### 3. Build the Project

```bash
npm run build
```

### 4. Run Development Server

```bash
npm run dev
```

This starts:
- Backend server on `http://localhost:3001`
- Frontend dev server on `http://localhost:3000`

### 5. Run Production Server

```bash
npm run build
npm start
```

## Project Structure

```
whereat-teams-plugin-v2/
├── appPackage/                 # Teams app manifest and icons
│   ├── manifest.json
│   ├── color.png
│   └── outline.png
├── src/
│   ├── client/                 # React frontend
│   │   ├── components/
│   │   │   ├── ChatPanel.tsx   # AI chat interface
│   │   │   ├── Header.tsx      # App header
│   │   │   ├── ManagementChain.tsx  # Management hierarchy
│   │   │   └── MapView.tsx     # Azure Maps integration
│   │   ├── services/
│   │   │   └── api.ts          # API client
│   │   ├── styles/
│   │   │   └── main.css        # Styling
│   │   ├── types/
│   │   │   └── index.ts        # TypeScript types
│   │   ├── App.tsx             # Main app component
│   │   ├── index.tsx           # React entry point
│   │   └── index.html          # HTML template
│   └── server/                 # Express backend
│       ├── routes/
│       │   ├── cosmos.ts       # CosmosDB test route
│       │   ├── search.ts       # Chat/search routes
│       │   └── users.ts        # User data routes
│       ├── services/
│       │   ├── chatService.ts  # AI chat processing
│       │   ├── cosmosService.ts # CosmosDB client
│       │   └── searchService.ts # Azure AI Search client
│       └── index.ts            # Express entry point
├── package.json
├── tsconfig.json
├── webpack.config.js
└── .env
```

## API Endpoints

### Users
- `GET /api/users` - Get all users
- `GET /api/users/with-location` - Get users with location data
- `GET /api/users/by-principal/:principalName` - Get user by principal name
- `GET /api/users/:id` - Get user by ID
- `GET /api/users/:id/direct-reports` - Get direct reports
- `GET /api/users/management-chain/:principalName` - Get management chain
- `GET /api/users/search/:term` - Search users
- `GET /api/users/stats/locations` - Get location statistics

### Chat
- `POST /api/search/chat` - Send chat message

## Chat Examples

The AI assistant can answer questions like:
- "How many engineers are in the London office?"
- "Show me my direct reports"
- "Who is in my management chain?"
- "Show me the time zone overlap for my team"
- "What's the distribution of team members by country?"

## Deploying to Teams

1. Update `appPackage/manifest.json` with your Azure AD app registration details
2. Create a zip file of the `appPackage` folder
3. Upload to Teams Admin Center or sideload in Teams

## Environment Variables

| Variable | Description |
|----------|-------------|
| `COSMOS_ENDPOINT` | Azure CosmosDB endpoint URL |
| `COSMOS_KEY` | CosmosDB primary key |
| `COSMOS_DATABASE_ID` | Database name |
| `COSMOS_CONTAINER_ID` | Container name |
| `AZURE_MAPS_API_KEY` | Azure Maps subscription key |
| `AZURE_SEARCH_ENDPOINT` | Azure AI Search endpoint |
| `AZURE_SEARCH_ADMIN_KEY` | Search admin key |
| `AZURE_SEARCH_QUERY_KEY` | Search query key |
| `PORT` | Server port (default: 3001) |
| `CLIENT_URL` | Frontend URL for CORS |

## License

MIT
